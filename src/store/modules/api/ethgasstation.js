import axios from 'axios'

const state = {
    gasFastest: '10000000000', // 10 gwei
    gasFast: '5000000000', // 5 gwei
    gasAverage: '3000000000', // 3 gwei
    gasSafeLow: '1000000000', // 1 gwei
}

const getters = {
    gasPriceFastest: (state) => state.gasFastest,
    gasPriceFast: (state) => state.gasFast,
    gasPriceAverage: (state) => state.gasAverage,
    gasPriceSafeLow: (state) => state.gasSafeLow,
}

const actions = {
    async updateGasPrices({ commit }) {
        try {
            const res = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
            if(res.status !== 200) {
                throw 'ethgasstation: status not OK'
            }

            commit('setGasPriceFastest', parseInt((res.data.fastest / 10) * (10**9)).toString())
            commit('setGasPriceFast', parseInt((res.data.fastest / 10) * (10**9)).toString())
            commit('setGasPriceAverage', parseInt((res.data.fastest / 10) * (10**9)).toString())
            commit('setGasPriceSafeLow', parseInt((res.data.fastest / 10) * (10**9)).toString())
        } catch(ex) {
            console.log(ex)
            return
        }
    },
}

const mutations = {
    setGasPriceFastest: (state, price) => state.gasFastest = price,
    setGasPriceFast: (state, price) => state.gasFast = price,
    setGasPriceAverage: (state, price) => state.gasAverage = price,
    setGasPriceSafeLow: (state, price) => state.gasSafeLow = price,
}


export default {
    state,
    getters,
    actions,
    mutations,
}