import Web3 from "web3"


const state = {
    web3: undefined,
    showConnectWeb3Dialog: false,
}

const getters = {
    web3: (state) => state.web3,
    showConnectWeb3Dialog: (state) => state.showConnectWeb3Dialog,
}

const actions = {
    showConnectWeb3Dialog({ commit }) {
        commit('setShowConnectWeb3Dialog', true)
    },
    hideConnectWeb3Dialog({ commit }) {
        commit('setShowConnectWeb3Dialog', false)
    },
    async connectMetamask({ commit, dispatch }) {


        let w3;
        try {
            if(window.ethereum) {
                w3 = new Web3(window.ethereum)
                try {
                    await window.ethereum.enable();
                } catch (e) {
                    throw 'Error while connecting to Metamask: User denied access'
                }
            } else if(window.web3) {
                w3 = new Web3(window.web3.currentProvider);
            } else {
                throw 'Error while connecting to Metamask: Not installed'
            }
        } catch(e) {
            console.log(e)
            return
        }

        w3.eth.defaultAccount = (await w3.eth.getAccounts())[0]

        commit('setWeb3', w3)
        commit('setShowConnectWeb3Dialog', false)

        dispatch('setBalancesLoading', true)
        dispatch('initializeContracts')
    },
}

const mutations = {
    setWeb3: (state, web3) => (state.web3 = web3),
    setShowConnectWeb3Dialog: (state, show) => (state.showConnectWeb3Dialog = show),
}

export default {
    state,
    getters,
    actions,
    mutations,
}