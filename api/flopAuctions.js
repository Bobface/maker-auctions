require('dotenv').config()
const web3 = require('./web3').web3
const flop = require('./contracts/flop')
const db = require('./db').getDB('flop')
const moment = require('moment');
const BigNumber = require('bignumber.js')

let state

let currentBlock = 0
let parserRunning = false

const ignoreAuctions = [
]

let wsStateCallback

function makeAuctionPhase(auction) {
    if(!auction.isValid)
        return 'INV'

    let phase = 'RUN'
        
    if(auction.end == 0)
        phase = 'DEL'
    else if(auction.tic != 0 && (auction.end < parseInt(Date.now() / 1000) || auction.tic < parseInt(Date.now() / 1000)))
        phase = 'FIN'
    else if(auction.tic == 0 && auction.end < parseInt(Date.now() / 1000))
        phase = 'RES'

    return phase
}

function makeAuction(lot, bid, guy, tic, end, isValid) {
    let auction = {
        lot: lot,
        bid: bid,
        guy: guy,
        tic: tic,
        end: end,
        isValid: isValid,
    }

    auction.phase = makeAuctionPhase(auction)
    return auction
}

function isAuctionDeleted(id) {
    const auction = state.auctions[id]
    return auction.end == 0 || ignoreAuctions.includes(id)
}

function printState() {
    let numAuctions = 0
    let tableData = []

    for(let i = 0; i <= state.lastID; i++) {

        const auction = state.auctions[i]
        if(auction== undefined) {
            continue
        } else if(!auction.isValid) {
            tableData.push({
                id: i,
                phase: 'INV',
            })
            continue
        }

            
        const lot = BigNumber(auction.lot).div(BigNumber('10').pow(BigNumber('18'))).toFixed(4)
        const bid = BigNumber(auction.bid).div(BigNumber('10').pow(BigNumber('45'))).toFixed(2)
    
        let earlyEnd

        if(auction.tic < auction.end) earlyEnd = auction.tic
        else earlyEnd = auction.end

        tableData.push({
            id: i,
            phase: auction.phase,
            lot: lot,
            bid: bid,
            tic: `${moment.unix(auction.tic).fromNow()} (${auction.tic})`,
            end: `${moment.unix(auction.end).fromNow()} (${auction.end})`,
            earlyEnd: `${moment.unix(earlyEnd).fromNow()} (${earlyEnd})`,
            isValid: auction.isValid,
        })

        numAuctions++
    }
    console.table(tableData)

    tableData = {
        lastID: state.lastID
    }
    console.table([tableData])


    tableData = {
        timestamp: parseInt(Date.now() / 1000),
        block: currentBlock,
        auctions: numAuctions,
    }
    console.table([tableData])
}

async function getNewAuctionsInBlock(blockNumber) {

    let currentID = parseInt(await flop.contract.methods.kicks().call(undefined, blockNumber, undefined))

    const lastID = state.lastID
    if(lastID >= currentID)
        return

    console.log('flopAuctions: got', currentID - lastID, 'new auctions')
    
    let awaits = []
    for(let i = lastID + 1; i <= currentID; i++) {
        
        const ci = i;
        console.log('flopAuctions: requesting state for auction', ci)

        awaits.push(flop.contract.methods.bids(ci).call(undefined, blockNumber, function(error, result) {
            if(error) 
                return
            
            state.auctions[ci] = makeAuction(
                result.lot.toString(),
                result.bid.toString(),
                result.guy,
                result.tic,
                result.end,
                true
                )
        }).catch(function(error) {
            console.log('flopAuctions: getNewAuctionsInBlock:', error.message)
                
            state.auctions[ci] = makeAuction(
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                false
                )
        }))   
    }

    for(let i = 0; i < awaits.length; i++) {
        await awaits[i]
        console.log('flopAuctions: received state for request', i + 1)
    }

    state.lastID = currentID
}

async function updateRunningAuctionsImpl(blockNumber, invalidOnly, run, maxRun) {

    if(run == maxRun) 
        return

    let awaits = []
    let deletes = []

    for(let i = 0; i <= state.lastID; i++) {

        // Hack
        if(state.auctions[i] == undefined)
            continue

        if(invalidOnly && state.auctions[i].isValid)
            continue

        console.log('flopAuctions: requesting updated state for auction', i)
        const ci = i;

        awaits.push(flop.contract.methods.bids(ci).call(undefined, blockNumber, function(error, result) {
            if(error) 
                return

            const prevState = state.auctions[ci]
            state.auctions[ci] = makeAuction(
                result.lot.toString(),
                result.bid.toString(),
                result.guy,
                result.tic,
                result.end,
                true
                )

            if(isAuctionDeleted(ci))
                deletes.push(ci)

        }).catch(function(error) {
            console.log('flopAuctions: updateRunningAuctions:', error.message)
                
            const prevState = state.auctions[ci]
            // Keep the state, just set flag
            state.auctions[ci].isValid = false
        }));
    }

    for(let i = 0; i < awaits.length; i++) {
        await awaits[i]
        console.log('flopAuctions: updated state for request', i+1)
    }

    // We delete here to not break the iteration
    for(let i = 0; i < deletes.length; i++) {
        delete state.auctions[deletes[i]]
        console.log('flopAuctions: deleted auction', deletes[i])
    }

    // Check if we have invalid entries
    for(let i = 0; i <= state.lastID; i++) {
        const auction = state.auctions[i]

        if(auction == undefined) 
            continue

        if(!auction.isValid) {
            return updateRunningAuctionsImpl(blockNumber, true, run + 1, maxRun);
        }
    }
}

async function updateRunningAuctions(blockNumber) {
    return updateRunningAuctionsImpl(blockNumber, false, 0, 3)    
}

async function parser() {
    parserRunning = true

    let lastParseBlock = 0
    while(lastParseBlock != currentBlock) {
        lastParseBlock = currentBlock
        console.log('flopAuctions: Parsing block', lastParseBlock)

        await getNewAuctionsInBlock(lastParseBlock)
        await updateRunningAuctions(lastParseBlock)

        db.write(state)
        wsStateCallback(state)
        printState()
    }

    parserRunning = false
}

function onNewBlock(block, error) {

    if(error) {
        console.log('flopAuctions: onNewBlock:', error.message)
        process.exit()
    }

    // Handler fires twice per block
    if(block.number <= currentBlock)
        return

    if(block.number % 1000 == 0 || currentBlock == 0)
        console.log('flopAuctions: onNewBlock: New block', block.number)

    currentBlock = block.number

    if(!parserRunning) {
        parser()
    }
}

function initDB() {
    const read = db.read()
    if(read === undefined) {
        console.log('flopAuctions: empty db, creating default content')

        let content = {
            lastID: 0,
            auctions: {},
        }

        db.write(content)
        state = content
    } else {
        state = read
    }

    console.log('flopAuctions: initialized state', state)
}

exports.startParser = async (startBlock, callback) => {

    wsStateCallback = callback
    initDB()
    onNewBlock({number: startBlock}, undefined)

    // Subscribe to new blocks
    let blockSubscription = web3.eth.subscribe('newBlockHeaders')
    blockSubscription.subscribe((error, result) => {
        if (error) {
            console.log('flopAuctions: Error subscribing to event', error)
            process.exit()
        }
    }).on('data', onNewBlock)

    console.log('flopAuctions: ready')
}