const state = {
    wsSocket: undefined,
    url: '',
}

const getters = {
    
}

const actions = {
    init({commit, dispatch}, url) {
        commit('wsSetUrl', url)
        dispatch('wsConnect')
    },
    wsConnect({ state, commit, dispatch }) {

        const wsSocket = new WebSocket(state.url)

        wsSocket.onerror = function(error) {
            console.log(error)
        }

        wsSocket.onclose = function(error) {
            console.log(error)
            setTimeout(() => {dispatch('wsConnect')}, 2000)
        }

        wsSocket.onmessage = function (e) {
            dispatch('wsMsgReceived', JSON.parse(e.data))
        }

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
        state.wsSocket.send(msg)
    }
}

const mutations = {
    wsSetUrl: (state, url) => (state.url = url),
    wsSetSocket: (state, socket) => (state.wsSocket = socket),
}


export default {
    state,
    getters,
    actions,
    mutations,
}