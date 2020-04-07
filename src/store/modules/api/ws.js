const state = {
    wsSocket: undefined
}

const getters = {
}

const actions = {
    wsSetSocket({ commit, dispatch }, wsSocket) {

        wsSocket.on('data', (msg) => {
            dispatch('wsMsgReceived', JSON.parse(msg))
        })

        commit('wsSetSocket', wsSocket)
    },
    wsMsgReceived({ dispatch }, msg ) {
        const topic = msg.topic
        if(topic === 'flip') {
            dispatch('setFlipAuctionsFromWS', msg.content)
        } else if(topic == 'flap') {
            dispatch('setFlapAuctionsFromWS', msg.content)
        } else if(topic == 'flop') {
            dispatch('setFlopAuctionsFromWS', msg.content)
        } else if(topic === 'flipHistory') {
            dispatch('setFlipHistoryFromWS', msg.content)
        } else if(topic === 'flapHistory') {
            dispatch('setFlapHistoryFromWS', msg.content)
        } else if(topic === 'flopHistory') {
            dispatch('setFlopHistoryFromWS', msg.content)
        }
    },
    wsSendMsg({ state }, msg) {
        state.wsSocket.emit('data', msg)
    }
}

const mutations = {
    wsSetSocket: (state, socket) => (state.wsSocket = socket),
}


export default {
    state,
    getters,
    actions,
    mutations,
}