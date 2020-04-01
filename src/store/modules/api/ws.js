const state = {
}

const getters = {
}

const actions = {
    wsMsgReceived({ dispatch }, msg ) {
        const topic = msg.topic
        if(topic === 'flip') {
            dispatch('setFlipAuctionsFromWS', msg.content)
        } else if(topic == 'flap') {
            dispatch('setFlapAuctionsFromWS', msg.content)
        } else if(topic == 'flop') {
            dispatch('setFlopAuctionsFromWS', msg.content)
        }
    },
}

const mutations = {

}


export default {
    state,
    getters,
    actions,
    mutations,
}