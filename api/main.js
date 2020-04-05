require('dotenv').config()
const fs = require('fs')
const web3 = require('./web3').web3
const conf = require('./config')
const io = require("socket.io")
const flip = require('./contracts/flip')

let ws
let connectedWSClients = 0

const discord = require('./discord')

const flipAuctions = require('./flipAuctions')
const flapAuctions = require('./flapAuctions')
const flopAuctions = require('./flopAuctions')

const flipState = {
    state: {},
    wsMsg: '',
}

const flapState = {
    state: {},
    wsMsg: '',
}

const flopState = {
    state: {},
    wsMsg: '',
}

function flipWSCallback(state) {

    flipState.state = state
    flipState.wsMsg = ''

    const wsObj = {}
    Object.keys(flip.contracts).forEach(token => {
        wsObj[token] = {}
        wsObj[token].history = {}
        wsObj[token].auctions = flipState.state[token].auctions

        const historyKeys = []
        Object.keys(flipState.state[token].history).forEach(id => {
            historyKeys.push(parseInt(id))
        })
        historyKeys.sort(function(a, b) { return b - a });

        for(let i = 0; i < historyKeys.length && i < 10; i++) {
            const hKey = historyKeys[i].toString()
            wsObj[token].history[hKey] = flipState.state[token].history[hKey]
        }
    })

    flipState.wsMsg = JSON.stringify({
        topic: 'flip',
        content: wsObj,
    })
    ws.emit('data', flipState.wsMsg)
}

function flapWSCallback(state) {

    flapState.state = state
    flapState.wsMsg = ''

    const wsObj = {}
    wsObj.history = {}
    wsObj.auctions = flapState.state.auctions

    const historyKeys = []
    Object.keys(flapState.state.history).forEach(id => {
        historyKeys.push(parseInt(id))
    })
    historyKeys.sort(function(a, b) { return b - a });

    for(let i = 0; i < historyKeys.length && i < 10; i++) {
        const hKey = historyKeys[i].toString()
        wsObj.history[hKey] = flapState.state.history[hKey]
    }

    flapState.wsMsg = JSON.stringify({
        topic: 'flap',
        content: wsObj,
    })
    ws.emit('data', flapState.wsMsg)
}

function flopWSCallback(state) {

    flopState.state = state
    flopState.wsMsg = ''

    const wsObj = {}
    wsObj.history = {}
    wsObj.auctions = flopState.state.auctions

    const historyKeys = []
    Object.keys(flopState.state.history).forEach(id => {
        historyKeys.push(parseInt(id))
    })
    historyKeys.sort(function(a, b) { return b - a });

    for(let i = 0; i < historyKeys.length && i < 10; i++) {
        const hKey = historyKeys[i].toString()
        wsObj.history[hKey] = flopState.state.history[hKey]
    }

    flopState.wsMsg = JSON.stringify({
        topic: 'flop',
        content: wsObj,
    })
    ws.emit('data', flopState.wsMsg)
}

async function main() {

    if(process.env.DISCORD_TOKEN || process.env.DISCORD_TEST_TOKEN) {
        console.log('===================== DISCORD TESTSERVER ENABLED ==========================')
        await discord.start()
    }

    if(conf.isLocal() || conf.isWebtest()) {
        ws = io.listen(8000);
    } else {
        const app = require('express')();
        const https = require('https');
        const server = https.createServer({
            key: fs.readFileSync('/etc/letsencrypt/live/maker-auctions.io/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/maker-auctions.io/cert.pem'),
            ca: fs.readFileSync('/etc/letsencrypt/live/maker-auctions.io/chain.pem'),
            requestCert: false,
            rejectUnauthorized: false
        }, app);

        server.listen(8000)
        ws = io.listen(server)
    }
    
    const latestBlock = await web3.eth.getBlockNumber()
    console.log('Starting at block', latestBlock)

    flipAuctions.startParser(latestBlock, flipWSCallback, discord.notifyNewFlipAuction)
    flapAuctions.startParser(latestBlock, flapWSCallback, discord.notifyNewFlapAuction)
    flopAuctions.startParser(latestBlock, flopWSCallback, discord.notifyNewFlopAuction)

    ws.on("connection", (socket) => {
        connectedWSClients++
        console.info(`ws: client connected [id=${socket.id}]`);

        socket.on("disconnect", () => {
            connectedWSClients--
            console.info(`ws: client disconnected [id=${socket.id}]`);
        });

        socket.emit('data', flipState.wsMsg)
        console.log('sent flip')
        socket.emit('data', flapState.wsMsg)
        console.log('sent flap')
        socket.emit('data', flopState.wsMsg)
        console.log('sent flop')
    });
    
    setInterval(function() {
        console.log('got', connectedWSClients, 'connected clients')
    }, 10000)
}

main()