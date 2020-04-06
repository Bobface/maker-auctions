const BigNumber = require('bignumber.js')
const moment = require('moment')

const state = {
    flipAuctions: {
        ETH: [],
        BAT: [],
        USDC: [],
    },
    flipAuctionsInitialized: false,
}

const getters = {
    getFlipAuctions: state => token => (state.flipAuctions[token]),
    getNumTotalFlipAuctions: () => state.flipAuctions.ETH.length + state.flipAuctions.BAT.length + state.flipAuctions.USDC.length,
    flipAuctionsInitialized: state => (state.flipAuctionsInitialized),
}

const actions = {
    setFlipAuctionsFromWS({ commit, rootState, rootGetters }, auctions) {
        const parsed = {
            'ETH': [],
            'BAT': [],
            'USDC': [],
        }

        Object.keys(auctions).forEach(function(token) {
            Object.keys(auctions[token].auctions).forEach(function(id) {
                parsed[token].push(makeAuctionFromRaw(rootState, rootGetters, id, token, auctions[token].auctions[id]))
            })
        })

        // Check for invalid entries
        Object.keys(parsed).forEach(function(token) {
            for(let i = 0; i < parsed[token].length; i++) {

                const check = parsed[token][i]
                if(check.raw.isValid) {
                    continue
                }
                
                let prev
                // Do we have a previous valid entry?
                for(let c = 0; c < state.flipAuctions[token].length; c++) {
                    if(state.flipAuctions[token][c].id === check.id) {
                        prev = state.flipAuctions[token][c]
                        break
                    }
                }

                if(prev) {
                    parsed[token][i] = prev
                }
            }

            // desc
            parsed[token].sort((lhs, rhs) => {return parseInt(rhs.id) - parseInt(lhs.id)})
        })

        commit('setFlipAuctionsInitialized', true)
        commit('setFlipAuctions', parsed)
    }
}

const mutations = {
    setFlipAuctions: (state, auctions) => (state.flipAuctions = auctions),
    setFlipAuctionsInitialized: (state, b) => (state.flipAuctionsInitialized = b),
}

function makeAuctionFromRaw(rootState, rootGetters, id, currency, raw) {

    if(!raw.isValid) {
        // Invalid. Check if initialized at least
        if(raw.lot === undefined) {
            return {
                id: id,
                phase: 'INV',
                raw: raw,
            }
        }
    }

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