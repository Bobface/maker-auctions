require('dotenv').config()
const Web3 = require('web3')
const conf = require('./config')

if(conf.isWebtest()) {
    exports.web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://localhost:7545`))
    exports.web3HTTP = new Web3(`http://localhost:7545`)
} else {
    exports.web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_KEY}`))
    exports.web3HTTP = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`)
}

