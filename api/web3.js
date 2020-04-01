require('dotenv').config()
const Web3 = require('web3')
const conf = require('./config')

if(conf.isWebtest()) {
    const web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://localhost:7545`))
    exports.web3 = web3
} else {
    const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_KEY}`))
    exports.web3 = web3
}

