require('dotenv').config()
const web3 = require('./web3').web3
const flip = require('./contracts/flip')
const db = require('./db').getDB('flip')
const moment = require('moment');
const BigNumber = require('bignumber.js')

let state
let isInitialized = false

let currentBlock = 0
let parserRunning = false

const ignoreAuctions = [
    15
]

let wsStateCallback
let onNewAuction

function makeAuctionPhase(auction) {
    if(!auction.isValid)
        return 'INV'

    let phase = 'DAI'
    if(auction.bid == auction.tab) 
        phase = 'GEM'
        
    if(auction.end == 0)
        phase = 'DEL'
    else if(auction.tic != 0 && (auction.end < parseInt(Date.now() / 1000) || auction.tic < parseInt(Date.now() / 1000)))
        phase = 'FIN'
    else if(auction.tic == 0 && auction.end < parseInt(Date.now() / 1000))
        phase = 'RES'

    return phase
}

function makeAuction(lot, bid, tab, usr, gal, guy, tic, end, isValid) {
    let auction = {
        lot: lot,
        bid: bid,
        tab: tab,
        usr: usr,
        gal: gal,
        guy: guy,
        tic: tic,
        end: end,
        isValid: isValid,
    }

    auction.phase = makeAuctionPhase(auction)
    return auction
}

function isAuctionDeleted(currency, id) {
    const auction = state[currency].auctions[id]
    return auction.end == 0 || ignoreAuctions.includes(id)
}

function printState() {
    let numAuctions = 0
    let tableData = []

    for(let c = 0; c < flip.flipAddresses.length; c++) {
        const currency = flip.flipAddresses[c].currency

        for(let i = 0; i <= state[currency].lastID; i++) {

            const auction = state[currency].auctions[i]
            if(auction== undefined) {
                continue
            } else if(!auction.isValid) {
                tableData.push({
                    id: i,
                    currency: currency,
                    phase: 'INV',
                })
                continue
            }

            
            const lot = BigNumber(auction.lot).div(BigNumber('10').pow(BigNumber('18'))).toFixed(4)
            const tab = BigNumber(auction.tab).div(BigNumber('10').pow(BigNumber('45'))).toFixed(2)
            const bid = BigNumber(auction.bid).div(BigNumber('10').pow(BigNumber('45'))).toFixed(2)
    
            let earlyEnd

            if(auction.tic < auction.end) earlyEnd = auction.tic
            else earlyEnd = auction.end

            tableData.push({
                id: i,
                currency: currency,
                phase: auction.phase,
                lot: lot,
                tab: tab,
                bid: bid,
                tic: `${moment.unix(auction.tic).fromNow()} (${auction.tic})`,
                end: `${moment.unix(auction.end).fromNow()} (${auction.end})`,
                earlyEnd: `${moment.unix(earlyEnd).fromNow()} (${earlyEnd})`,
                isValid: auction.isValid,
            })

            numAuctions++
        }
    }
    console.table(tableData)

    tableData = {}
    for(let i = 0; i < flip.flipAddresses.length; i++) {
        const currency = flip.flipAddresses[i].currency
        tableData[currency] = state[currency].lastID
    }
    console.table([tableData])


    tableData = {
        timestamp: parseInt(Date.now() / 1000),
        block: currentBlock,
        auctions: numAuctions,
    }
    console.table([tableData])
}

async function getNewAuctionsInBlock(currency) {

    const flipContract = flip.contracts[currency]
    let currentID = parseInt(await flipContract.methods.kicks().call())
    console.log(currency, currentID, flipContract.options.address)

    const lastID = state[currency].lastID
    if(lastID >= currentID)
        return

    console.log('flipAuctions: got', currentID - lastID, 'new auctions')
    
    let awaits = []
    for(let i = lastID + 1; i <= currentID; i++) {
        
        const ci = i;
        console.log('flipAuctions: requesting state for', currency, 'auction', ci)

        awaits.push(flipContract.methods.bids(ci).call(function(error, result) {
            if(error) 
                return
            
            const auction = makeAuction(
                result.lot.toString(),
                result.bid.toString(),
                result.tab.toString(),
                result.usr,
                result.gal,
                result.guy,
                result.tic,
                result.end,
                true
                )

            state[currency].auctions[ci] = auction

            if(isInitialized) {
                onNewAuction(currency, ci, auction)
            }

        }).catch(function(error) {
            console.log('flipAuctions: getNewAuctionsInBlock:', error.message)
                
            state[currency].auctions[ci] = makeAuction(
                undefined,
                undefined,
                undefined,
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
        console.log('flipAuctions: received state for', currency, 'request', i + 1)
    }

    state[currency].lastID = currentID
}

async function updateRunningAuctionsImpl(currency, invalidOnly, run, maxRun) {

    if(run == maxRun) 
        return

    let awaits = []
    let deletes = []

    const flipContract = flip.contracts[currency]

    for(let i = 0; i <= state[currency].lastID; i++) {

        // Hack
        if(state[currency].auctions[i] == undefined)
            continue

        if(invalidOnly && state[currency].auctions[i].isValid)
            continue

        console.log('flipAuctions: requesting updated state for', currency, 'auction', i)
        const ci = i;

        awaits.push(flipContract.methods.bids(ci).call(function(error, result) {
            if(error) 
                return

            const prevState = state[currency].auctions[ci]
            state[currency].auctions[ci] = makeAuction(
                result.lot.toString(),
                result.bid.toString(),
                result.tab.toString(),
                result.usr,
                result.gal,
                result.guy,
                result.tic,
                result.end,
                true
                )

            if(isAuctionDeleted(currency, ci))
                deletes.push(ci)

        }).catch(function(error) {
            console.log('flipAuctions: updateRunningAuctions:', error.message)
                
            const prevState = state[currency].auctions[ci]
            // Keep the state, just set flag
            state[currency].auctions[ci].isValid = false
        }));
    }

    for(let i = 0; i < awaits.length; i++) {
        await awaits[i]
        console.log('flipAuctions: updated state for', currency, 'request', i+1)
    }

    // We delete here to not break the iteration
    for(let i = 0; i < deletes.length; i++) {
        delete state[currency].auctions[deletes[i]]
        console.log('flipAuctions: deleted', currency, 'auction', deletes[i])
    }

    // Check if we have invalid entries
    for(let i = 0; i <= state[currency].lastID; i++) {
        const auction = state[currency].auctions[i]

        if(auction == undefined) 
            continue

        if(!auction.isValid) {
            return updateRunningAuctionsImpl(currency, true, run + 1, maxRun);
        }
    }
}

async function updateRunningAuctions(currency) {
    return updateRunningAuctionsImpl(currency, false, 0, 3)    
}

async function parser() {
    parserRunning = true

    let lastParseBlock = 0
    while(lastParseBlock != currentBlock) {
        lastParseBlock = currentBlock
        console.log('flipAuctions: Parsing block', lastParseBlock)

        let awaits = []
        for(let i = 0; i < flip.flipAddresses.length; i++) {
            awaits.push(getNewAuctionsInBlock(flip.flipAddresses[i].currency))
        }

        for(let i = 0; i < awaits.length; i++) {
            await awaits[i]
        }

        awaits = []
        for(let i = 0; i < flip.flipAddresses.length; i++) {
            awaits.push(updateRunningAuctions(flip.flipAddresses[i].currency))
        }

        for(let i = 0; i < awaits.length; i++) {
            await awaits[i]
        }

        db.write(state)
        wsStateCallback(state)
        printState()

        isInitialized = true
    }

    parserRunning = false
}

function onNewBlock(block, error) {
    if(error) {
        console.log('flipAuctions: onNewBlock:', error.message)
        process.exit()
    }

    // Handler fires twice per block
    if(block.number <= currentBlock)
        return

    if(block.number % 1000 == 0 || currentBlock == 0)
        console.log('flipAuctions: onNewBlock: New block', block.number)

    currentBlock = block.number

    if(!parserRunning) {
        parser()
    }
}

function initDB() {
    const read = db.read()
    if(read === undefined) {
        console.log('flipAuctions: empty db, creating default content')
        let content = {}
        for(let i = 0; i < flip.flipAddresses.length; i++) {
            content[flip.flipAddresses[i].currency] = {
                lastID: 0,
                auctions: {},
            }
        }
        db.write(content)
        state = content
    } else {
        state = read
    }

    console.log('flipAuctions: initialized state', state)
}

exports.startParser = async (startBlock, wsCallback, newAuctionCallback) => {
    wsStateCallback = wsCallback
    onNewAuction = newAuctionCallback
    initDB()
    onNewBlock({number: startBlock}, undefined)

    // Subscribe to new blocks
    let blockSubscription = web3.eth.subscribe('newBlockHeaders')
    blockSubscription.subscribe((error, result) => {
        if (error) {
            console.log('flipAuctions: Error subscribing to event', error)
            process.exit()
        }
    }).on('data', onNewBlock)

    console.log('flipAuctions: ready')
}