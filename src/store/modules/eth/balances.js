import BigNumber from 'bignumber.js'

const state = {
    loading: false,
    displayDecimals: { 
        eth: 4,
        mkr: 4,
        dai: 2,
        bat: 2,
        usdc: 2,
    },
    balances : {
        eth: {
            wallet: {
                bn: BigNumber('0'),
                display: '0.0000',
            },
            deposited: {
                bn: BigNumber('0'),
                display: '0.0000',
            }
        },
        dai: {
            wallet: {
                bn: BigNumber('0'),
                display: '0.00',
            },
            deposited: {
                bn: BigNumber('0'),
                display: '0.00',
            },
        },
        bat: {
            wallet: {
                bn: BigNumber('0'),
                display: '0.00',
            },
            deposited: {
                bn: BigNumber('0'),
                display: '0.00',
            },
        },
        usdc: {
            wallet: {
                bn: BigNumber('0'),
                display: '0.0',
            },
            deposited: {
                bn: BigNumber('0'),
                display: '0.00',
            },
        },
        mkr: {
            wallet: {
                bn: BigNumber('0'),
                display: '0.0000',
            },
            deposited: {
                bn: BigNumber('0'),
                display: '0.0000',
            },
        },
    },
    allowances: {
        dai: {
            bn: BigNumber('0'),
            display: '0.00',
        },
        bat: {
            bn: BigNumber('0'),
            display: '0.00',
        },
        usdc: {
            bn: BigNumber('0'),
            display: '0.00',
        },
        mkr: {
            bn: BigNumber('0'),
            display: '0.0000',
        },
    }
}

const getters = {
    balancesLoading: (state) => state.loading,

    walletDisplayBalanceOfToken: state => token => {
        const tokenLC = token.toLowerCase()

        if(state.balances[tokenLC])
            return state.balances[tokenLC].wallet.display
    },
    walletBNBalanceOfToken: state => token => {
        const tokenLC = token.toLowerCase()

        if(state.balances[tokenLC])
            return state.balances[tokenLC].wallet.bn
    },
    depositedDisplayBalanceOfToken: state => token => {
        const tokenLC = token.toLowerCase()

        if(state.balances[tokenLC])
            return state.balances[tokenLC].deposited.display
    },
    depositedBNBalanceOfToken: state => token => {
        const tokenLC = token.toLowerCase()

        if(state.balances[tokenLC])
            return state.balances[tokenLC].deposited.bn
    },
    allowanceDisplayOfToken: state => token => {
        const tokenLC = token.toLowerCase()

        if(state.allowances[tokenLC])
            return state.allowances[tokenLC].display
    },
    allowanceBNOfToken: state => token => {
        const tokenLC = token.toLowerCase()

        if(state.allowances[tokenLC])
            return state.allowances[tokenLC].bn
    },
    totalBalanceBNOfToken: state => token => {
        const tokenLC = token.toLowerCase()
        const wallet = state.balances[tokenLC].wallet.bn
        const deposited = state.balances[tokenLC].deposited.bn
        return wallet.plus(deposited)
    },
    displayDecimalsOfToken: state => token => state.displayDecimals[token.toLowerCase()],

}

const actions = {
    async updateBalances({commit, rootState}) {

        commit('setBalancesLoading', true)
        
        const web3 = rootState.web3Provider.web3
        const contracts = rootState.contracts

        let awaits = []
        let commits = []
        // ETH - Wallet
        awaits.push(
            web3.eth.getBalance(web3.eth.defaultAccount, function(err, res) {
                if(err) {
                    return
                }

                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'ETH', bal: BigNumber(res.toString(10)), dec: 18 }})
            })
            .catch((err) => {
                console.log(err)
                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'ETH', bal: BigNumber(0), dec: 18 }})
            })
        )
        // DAI - Wallet
        awaits.push(
            contracts.dai.contract.methods.balanceOf(web3.eth.defaultAccount).call(function(err, res) {
                if(err) {
                    return
                }
                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'DAI', bal: BigNumber(res.toString(10)), dec: contracts.dai.decimals}})
            })
            .catch((err) => {
                console.log(err)
                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'DAI', bal: BigNumber(0), dec: contracts.dai.decimals}})
            })
        )
        // BAT - Wallet
        awaits.push(
            contracts.bat.contract.methods.balanceOf(web3.eth.defaultAccount).call(function(err, res) {
                if(err) {
                    return
                }
                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'BAT', bal: BigNumber(res.toString(10)), dec: contracts.bat.decimals}})
            })
            .catch((err) => {
                console.log(err)
                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'BAT', bal: BigNumber(0), dec: contracts.bat.decimals}})
            })
        )
        // USDC - Wallet
        awaits.push(
            contracts.usdc.contract.methods.balanceOf(web3.eth.defaultAccount).call(function(err, res) {
                if(err) {
                    return
                }
                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'USDC', bal: BigNumber(res.toString(10)), dec: contracts.usdc.decimals}})
            })
            .catch((err) => {
                console.log(err)
                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'USDC', bal: BigNumber(0), dec: contracts.usdc.decimals}})
            })
        )
        // MKR - Wallet
        awaits.push(
            contracts.mkr.contract.methods.balanceOf(web3.eth.defaultAccount).call(function(err, res) {
                if(err) {
                    return
                }
                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'MKR', bal: BigNumber(res.toString(10)), dec: contracts.mkr.decimals}})
            })
            .catch((err) => {
                console.log(err)
                commits.push({ mutation: 'setWalletBalanceBN', params: { token: 'MKR', bal: BigNumber(0), dec: contracts.mkr.decimals}})
            })
        )
        if(contracts.proxy.isDeployed) {
            // ETH - Deposited
            awaits.push(
                contracts.vat.contract.methods.gem('0x4554482d41000000000000000000000000000000000000000000000000000000', contracts.proxy.address).call(function(err, res) {
                    if(err) {
                        return
                    }
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'ETH', bal: BigNumber(res.toString(10)), dec: 18}})
                })
                .catch((err) => {
                    console.log(err)
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'ETH', bal: BigNumber(0), dec: 18}})
                })
            )
            // DAI - Deposited
            awaits.push(
                contracts.vat.contract.methods.dai(contracts.proxy.address).call(function(err, res) {
                    if(err) {
                        return
                    }
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'DAI', bal: BigNumber(res.toString(10)), dec: 45}})
                })
                .catch((err) => {
                    console.log(err)
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'DAI', bal: BigNumber(0), dec: 45}})
                })
            )
            // BAT - Deposited
            awaits.push(
                contracts.vat.contract.methods.gem('0x4241542d41000000000000000000000000000000000000000000000000000000', contracts.proxy.address).call(function(err, res) {
                    if(err) {
                        return
                    }
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'BAT', bal: BigNumber(res.toString(10)), dec: 18}})
                })
                .catch((err) => {
                    console.log(err)
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'BAT', bal: BigNumber(0), dec: 18}})
                })
            )
            // USDC - Deposited
            awaits.push(
                contracts.vat.contract.methods.gem('0x555344432d410000000000000000000000000000000000000000000000000000', contracts.proxy.address).call(function(err, res) {
                    if(err) {
                        return
                    }
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'USDC', bal: BigNumber(res.toString(10)), dec: 18}})
                })
                .catch((err) => {
                    console.log(err)
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'USDC', bal: BigNumber(0), dec: 18}})
                })
            )
            // MKR - Deposited
            awaits.push(
                contracts.mkr.contract.methods.balanceOf(contracts.proxy.address).call(function(err, res) {
                    if(err) {
                        return
                    }
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'MKR', bal: BigNumber(res.toString(10)), dec: 18}})
                })
                .catch((err) => {
                    console.log(err)
                    commits.push({ mutation: 'setDepositedBalanceBN', params: { token: 'MKR', bal: BigNumber(0), dec: 18}})
                })
            )
            // DAI - Allowance
            awaits.push(
                contracts.dai.contract.methods.allowance(web3.eth.defaultAccount, contracts.proxy.address).call(function(err, res) {
                    if(err) {
                        return
                    }
                    commits.push({ mutation: 'setAllowanceBN', params: { token: 'DAI', bal: BigNumber(res.toString(10)), dec: contracts.dai.decimals}})
                })
                .catch((err) => {
                    console.log(err)
                    commits.push({ mutation: 'setAllowanceBN', params: { token: 'DAI', bal: BigNumber(0), dec: contracts.dai.decimals}})
                })
            )
            // BAT - Allowance
            awaits.push(
                contracts.bat.contract.methods.allowance(web3.eth.defaultAccount, contracts.proxy.address).call(function(err, res) {
                    if(err) {
                        return
                    }
                    commits.push({ mutation: 'setAllowanceBN', params: { token: 'BAT', bal: BigNumber(res.toString(10)), dec: contracts.bat.decimals}})
                })
                .catch((err) => {
                    console.log(err)
                    commits.push({ mutation: 'setAllowanceBN', params: { token: 'BAT', bal: BigNumber(0), dec: contracts.bat.decimals}})
                })
            )
            // USDC - Allowance
            awaits.push(
                contracts.usdc.contract.methods.allowance(web3.eth.defaultAccount, contracts.proxy.address).call(function(err, res) {
                    if(err) {
                        return
                    }
                    commits.push({ mutation: 'setAllowanceBN', params: { token: 'USDC', bal: BigNumber(res.toString(10)), dec: contracts.usdc.decimals}})
                })
                .catch((err) => {
                    console.log(err)
                    commits.push({ mutation: 'setAllowanceBN', params: { token: 'USDC', bal: BigNumber(0), dec: contracts.usdc.decimals}})
                })
            )
            // MKR - Allowance
            awaits.push(
                contracts.mkr.contract.methods.allowance(web3.eth.defaultAccount, contracts.proxy.address).call(function(err, res) {
                    if(err) {
                        return
                    }
                    commits.push({ mutation: 'setAllowanceBN', params: { token: 'MKR', bal: BigNumber(res.toString(10)), dec: contracts.mkr.decimals}})
                })
                .catch((err) => {
                    console.log(err)
                    commits.push({ mutation: 'setAllowanceBN', params: { token: 'MKR', bal: BigNumber(0), dec: contracts.mkr.decimals}})
                })
            )
        }
        
        
        for(let i = 0; i < awaits.length; i++) {
            await awaits[i]
        }

        for(let i = 0; i < commits.length; i++) {
            commit(commits[i].mutation, commits[i].params)
        }

        commit('setBalancesLoading', false)
    },
    setBalancesLoading({commit}, b) {
        commit('setBalancesLoading', b)
    },
}

const mutations = {
    setBalancesLoading: (state, loading) => (state.loading = loading),

    setWalletBalanceBN: (state, {token, bal, dec}) => {
        const tokenLC = token.toLowerCase()
        const displayDecimals = state.displayDecimals[tokenLC]

        // Higher display accuracy
        const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
        const bn = BN45(bal).multipliedBy(BN45(10).exponentiatedBy(BN45(18 - dec)))
        
        state.balances[tokenLC].wallet.bn = bn
        state.balances[tokenLC].wallet.display = bn.dividedBy(BigNumber(10).exponentiatedBy(BigNumber(18))).toFormat(displayDecimals, BigNumber.ROUND_DOWN)
    },
    setDepositedBalanceBN: (state, {token, bal, dec}) => {
        const tokenLC = token.toLowerCase()
        const displayDecimals = state.displayDecimals[tokenLC]

        // Higher display accuracy
        const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
        const bn = BN45(bal).multipliedBy(BN45(10).exponentiatedBy(BN45(18 - dec)))

        state.balances[tokenLC].deposited.bn = bn
        state.balances[tokenLC].deposited.display = bn.dividedBy(BigNumber(10).exponentiatedBy(BigNumber(18))).toFormat(displayDecimals, BigNumber.ROUND_DOWN)
    },
    setAllowanceBN: (state, {token, bal, dec}) => {
        const tokenLC = token.toLowerCase()
        const displayDecimals = state.displayDecimals[tokenLC]

        // Higher display accuracy
        const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
        const bn = BN45(bal).multipliedBy(BN45(10).exponentiatedBy(BN45(18 - dec)))

        state.allowances[tokenLC].bn = bn
        state.allowances[tokenLC].display = bn.dividedBy(BigNumber(10).exponentiatedBy(BigNumber(18))).toFormat(displayDecimals, BigNumber.ROUND_DOWN)
    },
}

export default {
    state,
    getters,
    actions,
    mutations
}