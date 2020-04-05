require('dotenv').config()
const web3 = require('./web3').web3
const flip = require('./contracts/flip')
const db = require('./db').getDB('flip')
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
    dent: '5ff3a382',
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
            console.log('flipAuctions: Error subscribing to event', error)
            process.exit()
        }
    }).on('data', onNewBlock)

    console.log('flipAuctions: ready')
}

function initDB() {
    const read = db.read()
    if(read === undefined) {
        console.log('flipAuctions: empty db, creating default content')
        let content = {
            lastBlock: conf.isWebtest() ? 0 : 8900000 - 1,
        }
        for(let i = 0; i < flip.flipAddresses.length; i++) {
            content[flip.flipAddresses[i].currency] = {
                lastID: 0,
                auctions: {},
                history: {},
                lastEvents: {},
                kicks: {},
                ttls: {'1': '10800'},
                taus: {'1': '172800'},
            }
        }
        db.write(content)
        state = content
    } else {
        state = read
    }

    console.log('flipAuctions: initialized state')
}

function onNewBlock(block, error) {
    if(error) {
        console.log('flipAuctions: onNewBlock:', error.message)
        process.exit()
    }

    // Handler fires twice per block
    if(block.number <= currentBlock.number)
        return

    if(block.number % 1000 == 0 || currentBlock.number == 0)
        console.log('flipAuctions: onNewBlock: New block', block.number)

    currentBlock = block

    if(!parserRunning) {
        parserRunning = true
        parser()
    }
}

async function parser() {

    while(state.lastBlock !== currentBlock.number) {

        const block = currentBlock
        console.log('flipAuctions: parsing block', block.number)
        const maxParseBlocks = 100000

        const eventResults = {}
        for(let i = state.lastBlock + 1; i <= block.number; i += maxParseBlocks) {
            let toBlock = i + maxParseBlocks - 1
            if(toBlock > block.number) {
                toBlock = block.number
            }

            const promises = []
            Object.keys(flip.contractsHTTP).forEach(key => {
                promises.push(parseEventsInBlocks(i, toBlock, key, flip.contractsHTTP[key]))
            })

            for(let j = 0; j < promises.length; j++) {
                const result = await promises[j]
                if(!eventResults[result.token]) {
                    eventResults[result.token] = []
                }
                eventResults[result.token].push(await promises[j])
            }
        }

        const promises = []
        Object.keys(eventResults).forEach(key => {
            const results = eventResults[key]
            let hadKick = false
            let tends = []
            let dents = []
            let deals = []

            for(let i = 0; i < results.length; i++) {
                const result = results[i]
                tends = tends.concat(...result.tends)
                dents = dents.concat(...result.dents)
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
                return tends.indexOf(elem) == pos && dents.indexOf(elem) < 0 && dealIDs.indexOf(elem) < 0
            })
            dents = dents.filter(function(elem, pos) {
                return dents.indexOf(elem) == pos && dealIDs.indexOf(elem) < 0
            })
            deals = deals.filter(function(elem, pos) {
                return deals.indexOf(elem) == pos;
            })

            if(hadKick) {
                promises.push(
                    updateKicks(block.number, key, flip.contracts[key], tends.concat(...dents).concat(...dealIDs))
                    .then(async () => {
                        const updates = tends.concat(...dents)
                        let promises = []
                        for(let c = 0; c < updates.length; c++) {
                            promises.push(updateAuction(updates[c], block.number, key, flip.contracts[key]))
                        }
                        await Promise.all(promises)

                        for(let c = 0; c < deals.length; c += 100) {
                            if(c >= deals.length) {
                                c = deals.length - 1
                            }

                            const promises = []
                            for(let j = 0; c + j < deals.length && j < 100; j++) {
                                promises.push(updateAuctionHistory(deals[c + j].id, key))
                            }
                            await Promise.all(promises)
                        }
                    })
                )
            } else {
                promises.push(
                    async function() {
                        const updates = tends.concat(...dents)
                        let promises = []
                        for(let c = 0; c < updates.length; c++) {
                            promises.push(updateAuction(updates[c], block.number, key, flip.contracts[key]))
                        }
                        await Promise.all(promises)

                        for(let c = 0; c < deals.length; c += 100) {
                            if(c >= deals.length) {
                                c = deals.length - 1
                            }

                            const promises = []
                            for(let j = 0; c + j < deals.length && j < 100; j++) {
                                promises.push(updateAuctionHistory(deals[c + j].id, key))
                            }
                            await Promise.all(promises)
                        }
                    }()
                )
            }
        })

        await Promise.all(promises)

        updateAuctionPhases()

        state.lastBlock = block.number
        db.write(state)
        wsStateCallback(state)
        printState()
        isInitialized = true
    }

    parserRunning = false
}

async function parseEventsInBlocks(from, to, token, contract) {
    const result = {
        token: token,
        hadKick: false,
        tends: [],
        dents: [],
        deals: [],
    }

    let fromBlock = from
    let toBlock = to

    while(fromBlock <= to) {
        let events = []
        try {
            events = await contract.getPastEvents('LogNote', {fromBlock: fromBlock, toBlock: toBlock})
            const kicks = await contract.getPastEvents('Kick', {fromBlock: fromBlock, toBlock: toBlock})

            for(let i = 0; i < kicks.length; i++) {
                state[token].kicks[kicks[i].returnValues.id] = kicks[i]
            }

            if(kicks.length > 0) {
                result.hadKick = true
            }

        } catch(ex) {
            let numBlocks = toBlock - fromBlock 
            toBlock = fromBlock + parseInt(numBlocks / 2)
            console.log('flipAuctions:', token,'could not get events from', numBlocks + 1, 'blocks, trying', toBlock - fromBlock + 1, 'blocks')
            continue
        }

        for(let i = 0; i < events.length; i++) {
            const event = events[i]
            const sig = event.returnValues.sig.slice(2, 10)
            
            if(sig === sigs.deal) {
                const id = new web3.utils.BN(event.returnValues.arg1.slice(2), 16).toString(10)
                result.deals.push({block: event.blockNumber, id: id})
            } else if(sig === sigs.tend) {
                const id = new web3.utils.BN(event.returnValues.arg1.slice(2), 16).toString(10)

                if(!state[token].lastEvents[id] || 
                    state[token].lastEvents[id].blockNumber < event.blockNumber ||
                    (state[token].lastEvents[id].blockNumber === event.blockNumber &&
                    state[token].lastEvents[id].transactionIndex < event.transactionIndex)) {
                    state[token].lastEvents[id] = event
                }

                result.tends.push(id)
            } else if(sig === sigs.dent) {
                const id = new web3.utils.BN(event.returnValues.arg1.slice(2), 16).toString(10)

                if(!state[token].lastEvents[id] || 
                    state[token].lastEvents[id].blockNumber < event.blockNumber ||
                    (state[token].lastEvents[id].blockNumber === event.blockNumber &&
                    state[token].lastEvents[id].transactionIndex < event.transactionIndex)) {
                        
                    state[token].lastEvents[id] = event
                }

                result.dents.push(id)
            } else if(sig === sigs.file) {
                const blockNum = event.blockNumber
                const what = event.returnValues.arg1.slice(2)
                const value = new web3.utils.BN(event.returnValues.arg2.slice(2), 16).toString(10)
                if(what === fileWhats.ttl) {
                    state[token].ttls[blockNum] = value
                } else if(what === fileWhats.tau) {
                    state[token].taus[blockNum] = value
                }
            }
        }

        fromBlock = toBlock + 1
        toBlock = to
    }

    return result
}

async function updateKicks(blockNum, token, contract, ignore) {

    const kicks = await contract.methods.kicks().call(undefined, blockNum)

    if(kicks === state[token].lastID) {
        return
    }

    const promises = []
    const updatedIDs = []
    for(let i = state[token].lastID + 1; i <= kicks; i++) {
        if(ignore && ignore.indexOf(i.toString()) > -1) {
            continue
        }
        updatedIDs.push(i)
        promises.push(updateAuction(i, blockNum, token, contract))
    }
    if(promises.length > 0) {
        await Promise.all(promises)
    }

    state[token].lastID = kicks

    if(isInitialized) {
        for(let i = 0; i < updatedIDs.length; i++) {
            onNewAuction(token, updatedIDs[i], state[token].auctions[updatedIDs[i]])
        }
    }
}

async function updateAuction(id, blockNum, token, contract) {
    console.log('flipAuctions: updating',token,'auction',id)
    const result = await getAuction(id, blockNum, contract)

    if(result.guy === '0x0000000000000000000000000000000000000000') {
        return
    }

    state[token].auctions[id] = makeAuction(
        result.lot.toString(),
        result.bid.toString(),
        result.tab.toString(),
        result.usr,
        result.gal,
        result.guy,
        result.tic,
        result.end,
        true,
    )
}

async function updateAuctionHistory(id, token) {

    console.log('flipAuctions: updating history for ', token, id)

    const lastBidEvent = state[token].lastEvents[id]
    const lastBidEventData = lastBidEvent.raw.data.slice(10)
    const lastBidBlock = lastBidEvent.blockNumber
    const lot = lastBidEventData.slice(192, 256)
    const bid = lastBidEventData.slice(256, 320)

    const kickEvent = state[token].kicks[id]
    const kickBlock = kickEvent.blockNumber
    const tab = new web3.utils.BN(kickEvent.returnValues.tab)

    let ttlBlock = 0
    Object.keys(state[token].ttls).forEach(key => {
        if(key > ttlBlock && key <= lastBidBlock) {
            ttlBlock = key
        }
    })
    const ttl = parseInt(state[token].ttls[ttlBlock])

    let tauBlock = 0
    Object.keys(state[token].taus).forEach(key => {
        if(key > tauBlock && key <= kickBlock) {
            tauBlock = key
        }
    })
    const tau = parseInt(state[token].taus[tauBlock])

    const kickBlockTimestamp = parseInt((await web3.eth.getBlock(kickBlock)).timestamp)
    const lastBidBlockTimestamp = parseInt((await web3.eth.getBlock(lastBidBlock)).timestamp)

    let end
    if(kickBlockTimestamp + tau < lastBidBlockTimestamp + ttl) {
        end = kickBlockTimestamp + tau
    } else {
        end = lastBidBlockTimestamp + ttl
    }

    state[token].history[id] = {
        tab: tab.toString(10),
        lot: new web3.utils.BN(lot, 16).toString(10),
        bid: new web3.utils.BN(bid, 16).toString(10),
        guy: lastBidEvent.returnValues.usr,
        end: end.toString(),
    }

    if(state[token].auctions[id]) {
        delete state[token].auctions[id]
    }

    delete state[token].kicks[id]
    delete state[token].lastEvents[id]

    console.log('flipAuctions: updated history for ', token, id)
}

function updateAuctionPhases() {
    Object.keys(flip.contracts).forEach(token => {
        Object.keys(state[token].auctions).forEach(id => {
            state[token].auctions[id].phase = makeAuctionPhase(state[token].auctions[id])
        })
    })
}

async function getAuction(id, blockNum, contract) {
    return await contract.methods.bids(id).call(undefined, blockNum)
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
        block: currentBlock.number,
        auctions: numAuctions,
    }
    console.table([tableData])
}