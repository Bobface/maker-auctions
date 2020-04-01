require('dotenv').config()
const fs = require('fs')
const web3 = require('./web3').web3
const conf = require('./config')
const io = require("socket.io")
let ws

const discord = require('./discord')

const flipAuctions = require('./flipAuctions')
const flapAuctions = require('./flapAuctions')
const flopAuctions = require('./flopAuctions')

let flipState = {}
let flapState = {}
let flopState = {}

function getWSFlipMsg() {
    const msg = {
        topic: 'flip',
        content: flipState,
    }
    const json = JSON.stringify(msg)
    return json 
}

function flipWSCallback(state) {
    flipState = state    
    ws.emit('data', getWSFlipMsg())
}

function getWSFlapMsg() {
    const msg = {
        topic: 'flap',
        content: flapState,
    }
    const json = JSON.stringify(msg)
    return json 
}

function flapWSCallback(state) {
    flapState = state    
    ws.emit('data', getWSFlapMsg())
}

function getWSFlopMsg() {
    const msg = {
        topic: 'flop',
        content: flopState,
    }
    const json = JSON.stringify(msg)
    return json 
}

function flopWSCallback(state) {
    flopState = state    
    ws.emit('data', getWSFlopMsg())
}

async function main() {

    if(process.env.DISCORD_TOKEN || process.env.DISCORD_TEST_TOKEN) {
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
    flapAuctions.startParser(latestBlock, flapWSCallback)
    flopAuctions.startParser(latestBlock, flopWSCallback)

    ws.on("connection", (socket) => {
        console.info(`ws: client connected [id=${socket.id}]`);

        socket.on("disconnect", () => {
            console.info(`ws: client disconnected [id=${socket.id}]`);
        });

        socket.emit('data', getWSFlipMsg())
        console.log('sent flip')
        socket.emit('data', getWSFlapMsg())
        console.log('sent flap')
        socket.emit('data', getWSFlopMsg())
        console.log('sent flop')
    });
    
}

main()