require('dotenv').config()
const web3 = require('./web3').web3
const flap = require('./contracts/flap')
const db = require('./db').getDB('flap')
const moment = require('moment');
const conf = require('./config')
const BigNumber = require('bignumber.js')

let state
let isInitialized = false

let currentBlock = 0
let parserRunning = false

let wsStateCallback
let onNewAuction

const sigs = {
    tend: '4b43ed12',
    deal: 'c959c42b',
    file: '29ae8114',
}

const fileWhats = {
    ttl: '74746c0000000000000000000000000000000000000000000000000000000000',
    tau: '7461750000000000000000000000000000000000000000000000000000000000',
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
            console.log('flapAuctions: Error subscribing to event', error)
            process.exit()
        }
    }).on('data', onNewBlock)

    console.log('flapAuctions: ready')
}

function initDB() {
    const read = db.read()
    if(read === undefined) {
        console.log('flapAuctions: empty db, creating default content')
        const content = {
            lastBlock: conf.isWebtest() ? 0 : 8900000 - 1,
            lastID: 0,
            auctions: {},
            history: {},
            lastEvents: {},
            kicks: {},
            ttls: {'1': '10800'},
            taus: {'1': '172800'},
        }
        db.write(content)
        state = content
    } else {
        state = read
    }

    console.log('flapAuctions: initialized state')
}

function onNewBlock(block, error) {
    if(error) {
        console.log('flapAuctions: onNewBlock:', error.message)
        process.exit()
    }

    // Handler fires twice per block
    if(block.number <= currentBlock.number)
        return

    if(block.number % 1000 == 0 || currentBlock.number == 0)
        console.log('flapAuctions: onNewBlock: New block', block.number)

    currentBlock = block

    if(!parserRunning) {
        parserRunning = true
        parser()
    }
}

async function parser() {

    while(state.lastBlock !== currentBlock.number) {

        let hadError = false
        const block = currentBlock
        console.log('flapAuctions: parsing block', block.number)
        const maxParseBlocks = 100000

        const eventResults = []
        for(let i = state.lastBlock + 1; i <= block.number; i += maxParseBlocks) {
            let toBlock = i + maxParseBlocks - 1
            if(toBlock > block.number) {
                toBlock = block.number
            }

            try {
                eventResults.push(await parseEventsInBlocks(i, toBlock, flap.contractHTTP))
            } catch(ex) {
                console.log('flapAuctions: could not parse block', block, ex.message)
                hadError = true
            }
        }

        if(hadError) {
            setTimeout(parser, 2000)
            return
        }

        const promises = []
        let hadKick = false
        let tends = []
        let deals = []

        for(let i = 0; i < eventResults.length; i++) {
            const result = eventResults[i]
            tends = tends.concat(...result.tends)
            deals = deals.concat(...result.deals)

            if(result.hadKick) {
                hadKick = true
            }
        }

        const dealIDs = []
        for(let c = 0; c < deals.length; c++) {
            dealIDs.push(deals[c].id)
        }

        tends = tends.filter(function(elem, pos) {
            return tends.indexOf(elem) == pos < 0 && dealIDs.indexOf(elem) < 0
        })
        deals = deals.filter(function(elem, pos) {
            return deals.indexOf(elem) == pos;
        })

        if(hadKick) {
            promises.push(
                updateKicks(block.number, flap.contract, tends.concat(...dealIDs))
                .then(async () => {
                    let promises = []
                    for(let c = 0; c < tends.length; c++) {
                        promises.push(updateAuction(tends[c], block.number, flap.contract))
                    }
                    await Promise.all(promises)

                    for(let c = 0; c < deals.length; c += 100) {
                        if(c >= deals.length) {
                            c = deals.length - 1
                        }

                        const promises = []
                        for(let j = 0; c + j < deals.length && j < 100; j++) {
                            promises.push(updateAuctionHistory(deals[c + j].id))
                        }
                        await Promise.all(promises)
                    }
                })
            )
        } else {
            promises.push(
                async function() {
                    let promises = []
                    for(let c = 0; c < tends.length; c++) {
                        promises.push(updateAuction(tends[c], block.number, flap.contract))
                    }
                    await Promise.all(promises)

                    for(let c = 0; c < deals.length; c += 100) {
                        if(c >= deals.length) {
                            c = deals.length - 1
                        }

                        const promises = []
                        for(let j = 0; c + j < deals.length && j < 100; j++) {
                            promises.push(updateAuctionHistory(deals[c + j].id))
                        }
                        await Promise.all(promises)
                    }
                }()
            )
        }

        try {
            await Promise.all(promises)
        } catch(ex) {
            console.log('flapAuctions: could not parse events in block', block, ex.message)
            setTimeout(parser, 2000)
            return
        }
        
        updateAuctionPhases()
        state.lastBlock = block.number
        db.write(state)
        wsStateCallback(state)
        printState()
        isInitialized = true
    }

    parserRunning = false
}

async function parseEventsInBlocks(from, to, contract) {
    const result = {
        hadKick: false,
        tends: [],
        deals: [],
    }

    let fromBlock = from
    let toBlock = to

    while(fromBlock <= to) {
        let events = []
        try {
            events = await getLogNoteEvents(fromBlock, toBlock, contract)
            const kicks = await contract.getPastEvents('Kick', {fromBlock: fromBlock, toBlock: toBlock})
            for(let i = 0; i < kicks.length; i++) {
                state.kicks[kicks[i].returnValues.id] = kicks[i]
            }

            if(kicks.length > 0) {
                result.hadKick = true
            }

        } catch(ex) {
            let numBlocks = toBlock - fromBlock 
            toBlock = fromBlock + parseInt(numBlocks / 2)
            console.log('flapAuctions: could not get events from', numBlocks + 1, 'blocks, trying', toBlock - fromBlock + 1, 'blocks')
            continue
        }

        for(let i = 0; i < events.length; i++) {
            const event = events[i]
            const sig = event.raw.topics[0].slice(2, 10)
            if(sig === sigs.deal) {
                const arg1 = event.raw.topics[2]
                const id = new web3.utils.BN(arg1.slice(2), 16).toString(10)
                result.deals.push({block: event.blockNumber, id: id})
            } else if(sig === sigs.tend) {
                const arg1 = event.raw.topics[2]
                const id = new web3.utils.BN(arg1.slice(2), 16).toString(10)

                if(!state.lastEvents[id] || 
                    state.lastEvents[id].blockNumber < event.blockNumber ||
                    (state.lastEvents[id].blockNumber === event.blockNumber &&
                    state.lastEvents[id].transactionIndex < event.transactionIndex)) {
                    state.lastEvents[id] = event
                }

                result.tends.push(id)
            } else if(sig === sigs.file) {
                const blockNum = event.blockNumber
                const arg1 = event.raw.topics[2]
                const arg2 = event.raw.topics[3]
                const what = arg1.slice(2)
                const value = new web3.utils.BN(arg2.slice(2), 16).toString(10)
                if(what === fileWhats.ttl) {
                    state.ttls[blockNum] = value
                } else if(what === fileWhats.tau) {
                    state.taus[blockNum] = value
                }
            }
        }

        fromBlock = toBlock + 1
        toBlock = to
    }

    return result
}

async function getLogNoteEvents(fromBlock, toBlock, contract) {
    const result = []
    const allEvents = await contract.getPastEvents('allEvents', { fromBlock: fromBlock, toBlock: toBlock})
    for(let i = 0; i < allEvents.length; i++) {
        const event = allEvents[i]
        if(!event || !event.raw.topics) {
            continue
        }

        const sig = event.raw.topics[0].slice(2, 10)
        if(sig === sigs.tend ||
            sig === sigs.deal ||
            sig === sigs.file) {
            
            result.push(event)
        }
    }

    return result
}

async function updateKicks(blockNum, contract, ignore) {

    const kicks = await contract.methods.kicks().call(undefined, blockNum)

    if(kicks === state.lastID) {
        return
    }

    const promises = []
    const updatedIDs = []
    for(let i = parseInt(state.lastID) + 1; i <= kicks; i++) {
        if(ignore && ignore.indexOf(i.toString()) > -1) {
            continue
        }
        updatedIDs.push(i)
        promises.push(updateAuction(i, blockNum, contract))
    }
    if(promises.length > 0) {
        await Promise.all(promises)
    }

    state.lastID = kicks

    if(isInitialized) {
        for(let i = 0; i < updatedIDs.length; i++) {
            onNewAuction(updatedIDs[i], state.auctions[updatedIDs[i]])
        }
    }
}

async function updateAuction(id, blockNum, contract) {
    console.log('flapAuctions: updating auction',id)
    const result = await getAuction(id, blockNum, contract)

    if(result.guy === '0x0000000000000000000000000000000000000000') {
        return
    }

    state.auctions[id] = makeAuction(
        result.lot.toString(),
        result.bid.toString(),
        result.usr,
        result.gal,
        result.guy,
        result.tic,
        result.end,
        true,
    )
}

async function updateAuctionHistory(id) {

    console.log('flapAuctions: updating history for ', id)

    const lastBidEvent = state.lastEvents[id]
    const lastBidEventData = lastBidEvent.raw.data.slice(10)
    const lastBidBlock = lastBidEvent.blockNumber
    const lot = lastBidEventData.slice(192, 256)
    const bid = lastBidEventData.slice(256, 320)

    const kickEvent = state.kicks[id]
    const kickBlock = kickEvent.blockNumber

    let ttlBlock = 0
    Object.keys(state.ttls).forEach(key => {
        if(key > ttlBlock && key <= lastBidBlock) {
            ttlBlock = key
        }
    })
    const ttl = parseInt(state.ttls[ttlBlock])

    let tauBlock = 0
    Object.keys(state.taus).forEach(key => {
        if(key > tauBlock && key <= kickBlock) {
            tauBlock = key
        }
    })
    const tau = parseInt(state.taus[tauBlock])

    const kickBlockTimestamp = parseInt((await web3.eth.getBlock(kickBlock)).timestamp)
    const lastBidBlockTimestamp = parseInt((await web3.eth.getBlock(lastBidBlock)).timestamp)

    let end
    if(kickBlockTimestamp + tau < lastBidBlockTimestamp + ttl) {
        end = kickBlockTimestamp + tau
    } else {
        end = lastBidBlockTimestamp + ttl
    }

    state.history[id] = {
        lot: new web3.utils.BN(lot, 16).toString(10),
        bid: new web3.utils.BN(bid, 16).toString(10),
        guy: '0x' + lastBidEvent.raw.topics[1].slice(26),
        end: end.toString(),
    }

    if(state.auctions[id]) {
        delete state.auctions[id]
    }

    delete state.kicks[id]
    delete state.lastEvents[id]

    console.log('flapAuctions: updated history for', id)
}

function updateAuctionPhases() {
    Object.keys(state.auctions).forEach(id => {
        state.auctions[id].phase = makeAuctionPhase(state.auctions[id])
    })
}

async function getAuction(id, blockNum, contract) {
    return await contract.methods.bids(id).call(undefined, blockNum)
}

function makeAuction(lot, bid, usr, gal, guy, tic, end, isValid) {
    let auction = {
        lot: lot,
        bid: bid,
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
        
        const lot = BigNumber(auction.lot).div(BigNumber('10').pow(BigNumber('45'))).toFixed(2)
        const bid = BigNumber(auction.bid).div(BigNumber('10').pow(BigNumber('18'))).toFixed(4)

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
        timestamp: parseInt(Date.now() / 1000),
        block: currentBlock.number,
        auctions: numAuctions,
    }
    console.table([tableData])
}