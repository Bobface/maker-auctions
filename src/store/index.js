import Vuex from 'vuex'
import Vue from 'vue'

import web3Provider from './modules/eth/web3Provider'
import balances from './modules/eth/balances'
import contracts from './modules/eth/contracts'
import interactions from './modules/eth/interactions'
import flipAuctions from './modules/auctions/flipAuctions'
import flapAuctions from './modules/auctions/flapAuctions'
import flopAuctions from './modules/auctions/flopAuctions'

import ethgasstation from './modules/api/ethgasstation'
import wsStore from './modules/api/ws'
import wsClient from './ws'

Vue.use(Vuex)

const store = new Vuex.Store({
    modules: {
        web3Provider,
        balances,
        contracts,
        interactions,
        flipAuctions,
        flapAuctions,
        flopAuctions,
        ethgasstation,
        wsStore,
    }
})

wsClient.init(store)

store.dispatch('updateGasPrices')
setTimeout(() => {store.dispatch('updateGasPrices')}, 1000 * 60) // 1 / min

export default store 