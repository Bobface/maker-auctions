const BigNumber = require('bignumber.js')
const moment = require('moment')

const state = {
    flipAuctions: {
        'ETH': [],
        'BAT': [],
        'USDC': [],
    },
    flipHistory: {
        'ETH': [],
        'BAT': [],
        'USDC': [],
    },
    flipAuctionsInitialized: false,
}

const getters = {
    getFlipAuctions: state => token => (state.flipAuctions[token]),
    getFlipHistory: state => token => (state.flipHistory[token]),
    getNumTotalFlipAuctions: () => state.flipAuctions.ETH.length + state.flipAuctions.BAT.length + state.flipAuctions.USDC.length,
    flipAuctionsInitialized: state => (state.flipAuctionsInitialized),
}

const actions = {
    setFlipAuctionsFromWS({ commit, state, rootState, rootGetters }, msg) {

        const token = msg.token
        
        const parsedAuctions = []
        let parsedHistory = []
        if(msg.auctions) {
            Object.keys(msg.auctions).forEach(function(id) {
                parsedAuctions.push(makeAuctionFromRaw(rootState, rootGetters, id, token, msg.auctions[id]))
            })
        }

        if(msg.histories) {
            Object.keys(msg.histories).forEach(function(id) {
                parsedHistory.push(makeHistoryFromRaw(rootState, rootGetters, id, token, msg.histories[id]))
            })
        }

        for(let i = 0; i < parsedAuctions; i++) {
            let prev
            // Do we have a previous valid entry?
            for(let c = 0; c < state.flipAuctions[token].length; c++) {
                if(state.flipAuctions[token][c].id === parsedAuctions[i]) {
                    prev = state.flipAuctions[token][c]
                    break
                }
            }

            if(prev) {
                parsedAuctions[i] = prev
            }
        }
        parsedAuctions.sort((lhs, rhs) => {return parseInt(rhs.id) - parseInt(lhs.id)})

        
        const appendHistory = []
        for(let i = 0; i < state.flipHistory[token].length; i++) {
            let found = false
            for(let c = 0; c < parsedHistory.length; c++) {
                if(state.flipHistory[token][i].id === parsedHistory[c].id) {
                    found = true
                    break
                }
            }

            if(found) {
                continue
            }

            appendHistory.push(state.flipHistory[token][i])
        }

        parsedHistory = parsedHistory.concat(...appendHistory)
        parsedHistory.sort((lhs, rhs) => {return parseInt(rhs.id) - parseInt(lhs.id)})

        commit('setFlipAuctionsInitialized', true)
        commit('setFlipAuctionsForToken', {token: token, auctions: parsedAuctions})
        commit('setFlipHistoryForToken', {token: token, history: parsedHistory})
    },

    setFlipHistoryFromWS({ commit, state, rootState, rootGetters }, msg) {
        let parsed = []
        const token = msg.token

        if(msg.histories) {
            Object.keys(msg.histories).forEach(function(id) {
                parsed.push(makeHistoryFromRaw(rootState, rootGetters, id, token, msg.histories[id]))
            })
        }

        

        const append = []
        for(let i = 0; i < state.flipHistory[token].length; i++) {
            let found = false
            for(let c = 0; c < parsed.length; c++) {
                if(state.flipHistory[token][i].id === parsed[c].id) {
                    found = true
                    break
                }
            }

            if(found) {
                continue
            }

            append.push(state.flipHistory[token][i])
        }

        parsed = parsed.concat(...append)
        parsed.sort((lhs, rhs) => {return parseInt(rhs.id) - parseInt(lhs.id)})

        commit('setFlipHistoryForToken', {token: token, history: parsed})
    },

    requestMoreFlipHistory({state, dispatch}, token) {

        const len = state.flipHistory[token].length
        if(len === 0) {
            return
        }

        const lastID = state.flipHistory[token][len - 1].id
        const msg = {
            topic: 'flipHistory',
            content: {
                lastID: parseInt(lastID),
                token: token,
            },
        }

        dispatch('wsSendMsg', JSON.stringify(msg))
    }
}

const mutations = {
    setFlipAuctionsForToken: (state, {token, auctions}) => (state.flipAuctions[token] = auctions),
    setFlipHistoryForToken: (state, {token, history}) => (state.flipHistory[token] = history),
    setFlipAuctionsInitialized: (state, b) => (state.flipAuctionsInitialized = b),
}

function makeAuctionFromRaw(rootState, rootGetters, id, currency, raw) {

    const displayDecimals = rootGetters.displayDecimalsOfToken(currency)
    const amount = BigNumber(raw.lot).div(BigNumber(10).pow(18)).toFixed(displayDecimals)
    let end
    if(parseInt(raw.end) < parseInt(raw.tic) || parseInt(raw.tic) === 0) {
        end = raw.end
    } else {
        end = raw.tic
    }

    return {
        id: id,
        phase: shortPhaseToLongPhase(raw.phase, currency),
        currency: currency,
        amount: amount,
        max: BigNumber(raw.tab).div(BigNumber(10).pow(45)).toFixed(2),
        bid: BigNumber(raw.bid).div(BigNumber(10).pow(45)).toFixed(2),
        bidder: raw.guy.substring(0, 6) + '...' + raw.guy.substring(raw.guy.length - 4),
        end: moment.unix(end).fromNow(),
        lateEndDate: moment.unix(raw.end).format('MMMM Do YYYY, h:mm:ss a'),
        raw: {
            phase: raw.phase,
            lot: BigNumber(raw.lot),
            bid: BigNumber(raw.bid),
            tab: BigNumber(raw.tab),
            usr: raw.usr,
            gal: raw.gal,
            guy: raw.guy,
            tic: raw.tic,
            end: raw.end,
            isValid: raw.isValid,
        },
    }
}

function makeHistoryFromRaw(rootState, rootGetters, id, currency, raw) {

    const displayDecimals = rootGetters.displayDecimalsOfToken(currency)
    const amount = BigNumber(raw.lot).div(BigNumber(10).pow(18)).toFixed(displayDecimals)

    return {
        id: id,
        currency: currency,
        amount: amount,
        max: BigNumber(raw.tab).div(BigNumber(10).pow(45)).toFixed(2),
        bid: BigNumber(raw.bid).div(BigNumber(10).pow(45)).toFixed(2),
        bidder: raw.guy.substring(0, 6) + '...' + raw.guy.substring(raw.guy.length - 4),
        end: moment.unix(parseInt(raw.end)).fromNow(),
        raw: {
            lot: BigNumber(raw.lot),
            bid: BigNumber(raw.bid),
            tab: BigNumber(raw.tab),
            guy: raw.guy,
            end: raw.end,
        },
    }
}

function shortPhaseToLongPhase(phase, currency) {
    switch(phase) {
        case 'DAI':
            return 'BID DAI'
        case 'GEM':
            return `REDUCE ${currency}`
        case 'RES':
            return 'RESTART'
        case 'FIN':
            return 'FINISHED'
        default:
            return 'INVALID'
    }
}

export default {
    state,
    getters,
    actions,
    mutations,
}