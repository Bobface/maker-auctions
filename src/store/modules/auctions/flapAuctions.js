const BigNumber = require('bignumber.js')
const moment = require('moment')

const state = {
    flapAuctions: [],
    flapAuctionsInitialized: false,
}

const getters = {
    getFlapAuctions: () => (state.flapAuctions),
    flapAuctionsInitialized: () => (state.flapAuctionsInitialized),
}

const actions = {
    setFlapAuctionsFromWS({ commit, rootState }, msg) {

        let parsed = []

        if(msg.auctions) {
            Object.keys(msg.auctions).forEach(function(id) {
                parsed.push(makeAuctionFromRaw(rootState, id, msg.auctions[id]))
            });
        }

        // Check for invalid entries
        for(let i = 0; i < parsed.length; i++) {

            const check = parsed[i]
            if(check.raw.isValid) {
                continue
            }
            
            let prev
            // Do we have a previous valid entry?
            for(let c = 0; c < state.flapAuctions.length; c++) {
                if(state.flapAuctions[c].id === check.id) {
                    prev = state.flapAuctions[c]
                    break
                }
            }

            if(prev) {
                parsed[i] = prev
            }
        }

        // desc
        parsed.sort((lhs, rhs) => {return parseInt(rhs.id) - parseInt(lhs.id)})

        commit('setFlapAuctionsInitialized', true)
        commit('setFlapAuctions', parsed)
    }
}

const mutations = {
    setFlapAuctions: (state, auctions) => (state.flapAuctions = auctions),
    setFlapAuctionsInitialized: (state, b) => (state.flapAuctionsInitialized = b),
}

function makeAuctionFromRaw(rootState, id, raw) {

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

    let amount = BigNumber(raw.lot).div(BigNumber(10).pow(45)).toFixed(2)
    let end
    if(parseInt(raw.end) < parseInt(raw.tic) || parseInt(raw.tic) === 0) {
        end = raw.end
    } else {
        end = raw.tic
    }

    return {
        id: id,
        phase: shortPhaseToLongPhase(raw.phase),
        amount: amount,
        bid: BigNumber(raw.bid).div(BigNumber(10).pow(rootState.contracts.mkr.decimals)).toFixed(4),
        bidder: raw.guy.substring(0, 6) + '...' + raw.guy.substring(raw.guy.length - 4),
        end: moment.unix(end).fromNow(),
        raw: {
            phase: raw.phase,
            lot: BigNumber(raw.lot),
            bid: BigNumber(raw.bid),
            usr: raw.usr,
            gal: raw.gal,
            guy: raw.guy,
            tic: raw.tic,
            end: raw.end,
            isValid: raw.isValid,
        },
    }
}

function shortPhaseToLongPhase(phase) {
    switch(phase) {
        case 'RUN':
            return 'RUNNING'
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