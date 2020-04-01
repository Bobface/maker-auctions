const truffleAssert = require('truffle-assertions')

const Manager = artifacts.require('ProxyManager')
const Actions = artifacts.require('ProxyActions')
const Store = artifacts.require('ProxyActionsStorage')

contract('ProxyManager', accounts => {
    
    let manager
    let timelockDuration = 60 * 60 * 24 * 3 // 3 days
    let actions
    let store

    beforeEach(async () => {
        store = await Store.new()
        actions = await Actions.new()
        manager = await Manager.new(actions.address, store.address)
    });


    it('should be owner',  async () => {
        assert.equal(await manager.owner.call(), accounts[0], 'wrong owner')
    })

    it('should be correct initial state',  async () => {
        assert.equal(await manager.timelockDuration.call(), timelockDuration, 'wrong timelock duration')
        assert.equal(await manager.proxyActions.call(), actions.address, 'wrong actions')
        assert.equal(await manager.proxyActionsStorage.call(), store.address, 'wrong storage')
    })

    it('should set values via timelock', async () => {
        assert.equal(await manager.currentTimelock.call(), 0, 'wrong currentTimelock at beginning')

        const pendingTimelock = 123
        const pendingActions = web3.eth.accounts.create().address
        const pendingStorage = web3.eth.accounts.create().address
        await manager.submitTimelockValues(pendingTimelock, pendingActions, pendingStorage)

        assert.notEqual(await manager.currentTimelock.call(), 0, 'wrong currentTimelock after submit')
        assert.equal(await manager.pendingTimelockDuration.call(), pendingTimelock, 'wrong pending timelock')
        assert.equal(await manager.pendingProxyActions.call(), pendingActions, 'wrong pending actions')
        assert.equal(await manager.pendingProxyActionsStorage.call(), pendingStorage, 'wrong pending storage')

        await truffleAssert.reverts(
            manager.implementTimelockValues(),
            'VM Exception while processing transaction: revert ProxyManager / implementTimelockValues: timelock not over'
        )
    })
})
