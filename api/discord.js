require('dotenv').config();
const BigNumber = require('bignumber.js')
const Discord = require('discord.js');
const channelIDTest = '694986374884884520'
const channelIDOfficial = '694997469099982919'

const token = process.env.DISCORD_TOKEN
const channelID = channelIDOfficial

const client = new Discord.Client();
let channel

const tenPow18 = BigNumber(10).exponentiatedBy(BigNumber(18))
const tenPow45 = BigNumber(10).exponentiatedBy(BigNumber(45))

const displayDecimals = {
    'ETH': 4,
    'BAT': 2,
    'USDC': 2,
}

function formatFlipAuction(currency, id, auction) {

    const amount = BigNumber(auction.lot).dividedBy(tenPow18).toFixed(displayDecimals[auction.currency])
    const max = BigNumber(auction.tab).dividedBy(tenPow45).toFixed(2)
    const bid = BigNumber(auction.bid).dividedBy(tenPow45).toFixed(2)

    return {
        id: id,
        amount: amount,
        currency: currency,
        max: max,
        bid: bid,
    }
}

exports.notifyNewFlipAuction = async function(currency, id, auction) {

    if(channel === undefined) {
        return
    }

    const formatted = formatFlipAuction(currency, id, auction)

    channel.send(`
**New flip auction available**

ID: ${formatted.id}     |     Amount: ${formatted.amount} ${formatted.currency}     |     Max Bid: ${formatted.max} DAI     |     Current Bid: ${formatted.bid} DAI 
    `)
}

exports.start = async function() {

    client.on("ready", async () => {
        channel = await client.channels.fetch(channelID)
    })

    await client.login(token);
}