import BigNumber from 'bignumber.js'

const state = {
    showMoveOverlay: false,

    flipAuctionParams: undefined,
    showFlipAuctionBidOverlay: false,
    showFlipAuctionClaimOverlay: false,
}

const getters = {
    showMoveOverlay: (state) => state.showMoveOverlay,

    flipAuctionParams: (state) => state.flipAuctionParams,
    showFlipAuctionBidOverlay: (state) => state.showFlipAuctionBidOverlay,
    showFlipAuctionClaimOverlay: (state) => state.showFlipAuctionClaimOverlay,
}

const actions = {
    setShowMoveOverlay({commit}, show) {
        commit('setShowMoveOverlay', show)
    },

    setFlipAuctionParams({commit}, params) {
        commit('setFlipAuctionParams', params)
    },
    setShowFlipAuctionBidOverlay({commit}, show) {
        commit('setShowFlipAuctionBidOverlay', show)
    },
    setShowFlipAuctionClaimOverlay({commit}, show) {
        commit('setShowFlipAuctionClaimOverlay', show)
    },

    async deployProxy({rootState, dispatch}, {txCallback, finishedCallback} ) {
        
        try {
            const web3 = rootState.web3Provider.web3
            const fastGas = rootState.ethgasstation.gasFast

            await rootState.contracts.proxyManager.contract.methods.deploy().send({from: web3.eth.defaultAccount, gasPrice: fastGas})
            .on('transactionHash', function(tx) { 
                if(txCallback) {
                    txCallback(tx)
                }
            })
        } catch(ex) {
            console.log(ex)
            if(finishedCallback) 
                finishedCallback(false)

            return
        }

        dispatch('initializeProxy', finishedCallback)
    },
    async approveTokenAmount({ rootState, dispatch }, {token, amount, txCallback, finishedCallback}) {

        const tokenDefinition = getTokenDefinition(token, rootState)
        if(!tokenDefinition) {
            console.log('approveTokenAmount: did not find token ', token)
            if(finishedCallback) 
                finishedCallback(false)

            return
        }
        const amountBN = convertAmountToBN(tokenDefinition, amount, rootState)
        
        dispatch('approveTokenAmountBN', {
            token: token,
            amount: amountBN,
            txCallback: txCallback,
            finishedCallback: finishedCallback,
        })
    },
    async approveTokenMax({ rootState, dispatch }, {token, txCallback, finishedCallback}) {

        const tokenDefinition = getTokenDefinition(token, rootState)
        if(!tokenDefinition) {
            console.log('approveTokenMax: did not find token ', token)
            if(finishedCallback) 
                finishedCallback(false)

            return
        }

        const uint256max = BigNumber(2).exponentiatedBy(BigNumber(256)).minus(BigNumber(1))

        dispatch('approveTokenAmountBN', {
            token: token,
            amount: uint256max,
            txCallback: txCallback,
            finishedCallback: finishedCallback,
        })
    },
    async approveTokenAmountBN({ rootState, dispatch }, {token, amount, txCallback, finishedCallback}) {

        const tokenDefinition = getTokenDefinition(token, rootState)
        if(!tokenDefinition) {
            console.log('approveTokenAmount: did not find token ', token)
            if(finishedCallback) 
                finishedCallback(false)

            return
        }

        const web3 = rootState.web3Provider.web3
        const fastGas = rootState.ethgasstation.gasFast
        const amountBN = new web3.utils.BN(amount.toFixed(0, BigNumber.ROUND_UP))
        const proxyAddress = rootState.contracts.proxy.address

        try {
            await tokenDefinition.contract.methods.approve(proxyAddress, amountBN).send({from: web3.eth.defaultAccount, gasPrice: fastGas})
            .on('transactionHash', function(tx) { 
                if(txCallback) {
                    txCallback(tx)
                }
            })
        } catch(ex) {
            console.log(ex)
            if(finishedCallback) 
                finishedCallback(false)

            return
        }

        finishedCallback(true)
        dispatch('updateBalances')
    },
    async depositToken({ rootState, dispatch }, {token, amount, txCallback, finishedCallback}) {

        let valueBN
        let amountBN

        const web3 = rootState.web3Provider.web3
        const fastGas = rootState.ethgasstation.gasFast

        if(token === 'ETH') {
            valueBN = new web3.utils.BN(BigNumber(amount).multipliedBy(BigNumber('10').exponentiatedBy('18')).toString(10))
            amountBN = valueBN
        } else {
            valueBN = new web3.utils.BN('0')
            const tokenDefinition = getTokenDefinition(token, rootState)
            amountBN = convertAmountToBN(tokenDefinition, amount, rootState)
        }

        const bytes = getTokenBytes(token)

        try {
            await rootState.contracts.proxy.contract.methods.join(bytes, amountBN).send({from: web3.eth.defaultAccount, value: valueBN, gasPrice: fastGas})
            .on('transactionHash', function(tx) { 
                if(txCallback) {
                    txCallback(tx)
                }
            })
        } catch(ex) {
            console.log(ex)
            if(finishedCallback) 
                finishedCallback(false)

            return
        }

        finishedCallback(true)
        dispatch('updateBalances')
    },
    async withdrawToken({ rootState, dispatch }, {token, amount, txCallback, finishedCallback}) {

        let amountBN
        const web3 = rootState.web3Provider.web3
        const fastGas = rootState.ethgasstation.gasFast
        const bytes = getTokenBytes(token)

        if(token === 'ETH') {
            amountBN = new web3.utils.BN(BigNumber(amount).multipliedBy(BigNumber('10').exponentiatedBy('18')).toString(10))
        } else {
            const tokenDefinition = getTokenDefinition(token, rootState)
            amountBN = new web3.utils.BN(BigNumber(amount).multipliedBy(BigNumber('10').exponentiatedBy(tokenDefinition.decimals)).toString(10))
        }

        try {
            await rootState.contracts.proxy.contract.methods.exit(bytes, web3.eth.defaultAccount, amountBN).send({from: web3.eth.defaultAccount, gasPrice: fastGas})
            .on('transactionHash', function(tx) { 
                if(txCallback) {
                    txCallback(tx)
                }
            })
        } catch(ex) {
            
            console.log(ex)
            if(finishedCallback) 
                 finishedCallback(false)

            return
        }

        finishedCallback(true)
        dispatch('updateBalances')
    },
    async flipBidDai({ rootState, dispatch }, {auctionParams, pullBN, bidBN, txCallback, finishedCallback}) {

        const web3 = rootState.web3Provider.web3
        const bytes = getTokenBytes(auctionParams.currency)
        const fastGas = rootState.ethgasstation.gasFast
        const pull = new web3.utils.BN(pullBN.toFixed(0, BigNumber.ROUND_UP))
        const bid = new web3.utils.BN(bidBN.toFixed(0))
        const lot = new web3.utils.BN(auctionParams.raw.lot.toFixed(0))
    
        try {
            await rootState.contracts.proxy.contract.methods.flipBidDai(bytes, auctionParams.id, pull, bid, lot).send({from: web3.eth.defaultAccount, gasPrice: fastGas})
            .on('transactionHash', function(tx) { 
                if(txCallback) {
                    txCallback(tx)
                }
            })
        } catch(ex) {
            
            console.log(ex)
            if(finishedCallback) 
                 finishedCallback(false)

            return
        }

        finishedCallback(true)
        dispatch('updateBalances')
    },
    async flipReduceLot({ rootState, dispatch }, {auctionParams, pullBN, lotBN, txCallback, finishedCallback}) {

        const web3 = rootState.web3Provider.web3
        const bytes = getTokenBytes(auctionParams.currency)
        const fastGas = rootState.ethgasstation.gasFast
        const pull = new web3.utils.BN(pullBN.toFixed(0, BigNumber.ROUND_UP))
        const tab = new web3.utils.BN(auctionParams.raw.tab.toFixed(0))
        const lot = new web3.utils.BN(lotBN.toFixed(0))
        try {
            await rootState.contracts.proxy.contract.methods.flipReduceLot(bytes, auctionParams.id, pull, tab, lot).send({from: web3.eth.defaultAccount, gasPrice: fastGas})
            .on('transactionHash', function(tx) { 
                if(txCallback) {
                    txCallback(tx)
                }
            })
        } catch(ex) {
            
            console.log(ex)
            if(finishedCallback) 
                 finishedCallback(false)

            return
        }

        finishedCallback(true)
        dispatch('updateBalances')
    },
    async flipClaimAndExit({ rootState, dispatch }, {auctionParams, txCallback, finishedCallback}) {
        const web3 = rootState.web3Provider.web3
        const bytes = getTokenBytes(auctionParams.currency)
        const fastGas = rootState.ethgasstation.gasFast

        try {
            await rootState.contracts.proxy.contract.methods.flipClaimAndExit(bytes, auctionParams.id).send({from: web3.eth.defaultAccount, gasPrice: fastGas})
            .on('transactionHash', function(tx) { 
                if(txCallback) {
                    txCallback(tx)
                }
            })
        } catch(ex) {
            
            console.log(ex)
            if(finishedCallback) 
                 finishedCallback(false)

            return
        }

        finishedCallback(true)
        dispatch('updateBalances')
    }
}

const mutations = {
    setShowMoveOverlay: (state, show) => (state.showMoveOverlay = show),

    setFlipAuctionParams: (state, params) => (state.flipAuctionParams = params),
    setShowFlipAuctionBidOverlay: (state, show) => (state.showFlipAuctionBidOverlay = show),
    setShowFlipAuctionClaimOverlay: (state, show) => (state.showFlipAuctionClaimOverlay = show),
}

function getTokenDefinition(token, rootState) {
    switch(token) {
        case 'DAI':
            return rootState.contracts.dai
        case 'BAT':
            return rootState.contracts.bat
        case 'USDC':
            return rootState.contracts.usdc
        case 'MKR':
            return rootState.contracts.mkr
        default:
            return undefined
    }
}

function getTokenBytes(token) {
    switch(token) {
        case 'ETH':
            return '0x4554480000000000000000000000000000000000000000000000000000000000'
        case 'DAI':
            return '0x4441490000000000000000000000000000000000000000000000000000000000'
        case 'BAT':
            return '0x4241540000000000000000000000000000000000000000000000000000000000'
        case 'USDC':
            return '0x5553444300000000000000000000000000000000000000000000000000000000'
        case 'MKR':
            return '0x4d4b520000000000000000000000000000000000000000000000000000000000'
        default:
            return undefined
    }
}

function convertAmountToBN(tokenDefinition, amount, rootState) {
    const web3 = rootState.web3Provider.web3
    const bn = BigNumber(amount).multipliedBy(BigNumber('10').exponentiatedBy(BigNumber(tokenDefinition.decimals)))

    return new web3.utils.BN(bn.toString(10))
}

export default {
    state,
    getters,
    actions,
    mutations
}