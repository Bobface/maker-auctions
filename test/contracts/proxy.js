const truffleAssert = require('truffle-assertions')

const MockVat = artifacts.require('MockVat')
const MockDai = artifacts.require('MockDai')
const MockERC20 = artifacts.require('MockERC20')
const MockWETH = artifacts.require('MockWETH')
const MockDSToken = artifacts.require('MockDSToken')
const MockDaiJoin = artifacts.require('MockDaiJoin')
const MockGemJoin = artifacts.require('MockGemJoin')
const MockGemJoinWithDecimals = artifacts.require('MockGemJoinWithDecimals')
const MockFlip = artifacts.require('MockFlipper')
const MockFlap = artifacts.require('MockFlapper')
const MockFlop = artifacts.require('MockFlopper')
const ProxyManager = artifacts.require('ProxyManager')
const ProxyActions = artifacts.require('ProxyActions')
const MockProxyActionsStorage = artifacts.require('MockProxyActionsStorage')

contract('ProxyActions', accounts => {
    
    const ethBytes = '0x4554480000000000000000000000000000000000000000000000000000000000'
    const daiBytes = '0x4441490000000000000000000000000000000000000000000000000000000000'
    const batBytes = '0x4241540000000000000000000000000000000000000000000000000000000000'
    const usdcBytes = '0x5553444300000000000000000000000000000000000000000000000000000000'
    const mkrBytes = '0x4d4b520000000000000000000000000000000000000000000000000000000000'

    const ethIlk = '0x4554482d41000000000000000000000000000000000000000000000000000000'
    const batIlk = '0x4241542d41000000000000000000000000000000000000000000000000000000'
    const usdcIlk = '0x555344432d410000000000000000000000000000000000000000000000000000'

    const user = accounts[0]
    const admin = accounts[1]
    const attacker = accounts[2]
    const otherUser = accounts[3]

    let mockVat
    let mockWETH
    let mockDai
    let mockBat
    let mockUsdc
    let mockMkr
    let mockJoins = {}
    let mockFlips = {}
    let mockFlap
    let mockFlop

    let manager
    let actions
    let store
    let proxy
    let otherUserProxy

    beforeEach(async () => {

        // Mock dss
        mockVat = await MockVat.new({from: admin})
        let promises = []
        promises.push(async () => { await mockVat.init(ethIlk, {from: admin}) })
        promises.push(async () => { await mockVat.init(batIlk, {from: admin}) })
        promises.push(async () => { await mockVat.init(usdcIlk, {from: admin}) })
        Promise.all(promises)

        mockWETH = await MockWETH.new({from: admin})
        mockDai = await MockDai.new(0, {from: admin}) // ignore chainId param
        mockBat = await MockERC20.new(18, {from: admin})
        mockUsdc = await MockERC20.new(6, {from: admin})
        mockMkr = await MockDSToken.new(18, {from: admin})
        
        mockJoins[ethBytes] = await MockGemJoin.new(mockVat.address, ethIlk, mockWETH.address, {from: admin})
        mockJoins[daiBytes] = await MockDaiJoin.new(mockVat.address, mockDai.address, {from: admin})
        mockJoins[batBytes] = await MockGemJoin.new(mockVat.address, batIlk, mockBat.address, {from: admin})
        mockJoins[usdcBytes] = await MockGemJoinWithDecimals.new(mockVat.address, usdcIlk, mockUsdc.address, {from: admin})

        mockFlips[ethBytes] = await MockFlip.new(mockVat.address, ethIlk, {from: admin})
        mockFlips[batBytes] = await MockFlip.new(mockVat.address, batIlk, {from: admin})
        mockFlips[usdcBytes] = await MockFlip.new(mockVat.address, usdcIlk, {from: admin})

        mockFlap = await MockFlap.new(mockVat.address, mockMkr.address, {from: admin})
        mockFlop = await MockFlop.new(mockVat.address, mockMkr.address, {from: admin})

        promises = []
        promises.push(mockVat.rely(mockJoins[ethBytes].address, {from: admin}))
        promises.push(mockVat.rely(mockJoins[batBytes].address, {from: admin}))
        promises.push(mockVat.rely(mockJoins[usdcBytes].address, {from: admin}))
        promises.push(mockVat.hope(mockFlap.address, {from: admin}))
        promises.push(mockDai.rely(mockJoins[daiBytes].address, {from: admin}))
        // Mint 10k (10k * 10**45) in vat for dai join - this way we dont have to generate them first by depositing eth
        promises.push(mockVat.mockMintDai(mockJoins[daiBytes].address, new web3.utils.BN('10000000000000000000000000000000000000000000000000')))
        Promise.all(promises)

        // Mock proxy
        actions = await ProxyActions.new({from: admin})
        store = await MockProxyActionsStorage.new({from: admin})
    
        // Setting mock values for storage
        promises = []
        promises.push(store.mockSetVat(mockVat.address, {from: admin}))
        promises.push(store.mockSetToken(ethBytes, mockWETH.address, {from: admin}))
        promises.push(store.mockSetToken(daiBytes, mockDai.address, {from: admin}))
        promises.push(store.mockSetToken(batBytes, mockBat.address, {from: admin}))
        promises.push(store.mockSetToken(usdcBytes, mockUsdc.address, {from: admin}))
        promises.push(store.mockSetToken(mkrBytes, mockMkr.address, {from: admin}))
        promises.push(store.mockSetFlip(ethBytes, mockFlips[ethBytes].address, {from: admin}))
        promises.push(store.mockSetFlip(batBytes, mockFlips[batBytes].address, {from: admin}))
        promises.push(store.mockSetFlip(usdcBytes, mockFlips[usdcBytes].address, {from: admin}))
        promises.push(store.mockSetFlap(mockFlap.address, {from: admin}))
        promises.push(store.mockSetFlop(mockFlop.address, {from: admin}))
        promises.push(store.mockSetTokenJoin(ethBytes, mockJoins[ethBytes].address, {from: admin}))
        promises.push(store.mockSetTokenJoin(daiBytes, mockJoins[daiBytes].address, {from: admin}))
        promises.push(store.mockSetTokenJoin(batBytes, mockJoins[batBytes].address, {from: admin}))
        promises.push(store.mockSetTokenJoin(usdcBytes, mockJoins[usdcBytes].address, {from: admin}))
        Promise.all(promises)

        // Deploy proxy manager and proxy
        manager = await ProxyManager.new(actions.address, store.address, {from: admin})
        await manager.deploy()
        proxy = await ProxyActions.at(await manager.proxies.call(user))
        await manager.deploy({from: otherUser})
        otherUserProxy = await ProxyActions.at(await manager.proxies.call(otherUser))

        // Allowances
        promises = []
        const uint256max = new web3.utils.BN('2').pow(new web3.utils.BN('256')).sub(new web3.utils.BN('1'))
        promises.push(mockDai.approve(proxy.address, uint256max))
        promises.push(mockBat.approve(proxy.address, uint256max))
        promises.push(mockUsdc.approve(proxy.address, uint256max))
        promises.push(mockMkr.approve(proxy.address, uint256max))

        promises.push(mockDai.approve(otherUserProxy.address, uint256max, {from: otherUser}))
        promises.push(mockBat.approve(otherUserProxy.address, uint256max, {from: otherUser}))
        promises.push(mockUsdc.approve(otherUserProxy.address, uint256max, {from: otherUser}))
        promises.push(mockMkr.approve(otherUserProxy.address, uint256max, {from: otherUser}))
        Promise.all(promises)
    })

    it('should have correct version', async () => {
        assert.equal(await proxy.version.call(), 1, 'wrong version')
    })

    it('should have correct owner', async () => {
        assert.equal(await proxy.owner.call(), user, 'wrong owner')
    })

    it('only owner can call', async () => {

        await truffleAssert.reverts(
            proxy.setup(
                {from: attacker}
            ),
            "VM Exception while processing transaction: revert ProxyActions / setup: not allowed"
        );

        await truffleAssert.reverts(
            proxy.flapClaim(
                0,
                {from: attacker}
            ),
            "VM Exception while processing transaction: revert ProxyActions / onlyOwner: not allowed"
        );
    })

    it('can join and exit', async () => {
        const amount = 100000000

        // Since the owner also pays gas, we need a seperate eth wallet to verify the amount
        const ethReceiver = web3.eth.accounts.create().address;

        await proxy.join(ethBytes, amount, {value: amount})
        assert.equal(await mockVat.gem.call(ethIlk, proxy.address), amount, 'eth wrong amount join')
        await proxy.exit(ethBytes, ethReceiver, amount)
        assert.equal(await web3.eth.getBalance(ethReceiver), amount, 'eth wrong amount exit')

        await mockDai.mockMint(user, amount)
        await proxy.join(daiBytes, amount)
        assert.equal((await mockVat.dai.call(proxy.address)).div(new web3.utils.BN('10').pow(new web3.utils.BN('27'))), amount, 'dai wrong amount join')
        await proxy.exit(daiBytes, user, amount);
        assert.equal(await mockDai.balanceOf.call(user), amount, 'dai wrong amount exit')

        await mockBat.mockMint(user, amount)
        await proxy.join(batBytes, amount)
        assert.equal(await mockVat.gem.call(batIlk, proxy.address), amount, 'bat wrong amount join')
        await proxy.exit(batBytes, user, amount);
        assert.equal(await mockBat.balanceOf.call(user), amount, 'bat wrong amount exit')

        await mockUsdc.mockMint(user, amount)
        await proxy.join(usdcBytes, amount)
        assert.equal((await mockVat.gem.call(usdcIlk, proxy.address)).div(new web3.utils.BN('10').pow(new web3.utils.BN('12'))), amount, 'usdc wrong amount join')
        await proxy.exit(usdcBytes, user, amount);
        assert.equal(await mockUsdc.balanceOf.call(user), amount, 'usdc wrong amount exit')
    
        await mockMkr.mockMint(user, amount)
        await proxy.join(mkrBytes, amount)
        assert.equal(await mockMkr.balanceOf.call(proxy.address), amount, 'mkr wrong amount join')
        await proxy.exit(mkrBytes, user, amount);
        assert.equal(await mockMkr.balanceOf.call(user), amount, 'mkr wrong amount exit')
    
    })

    it('can win eth flip auction', async () => {

        const id = 1
        const flip = mockFlips[ethBytes]
        const initialLot = new web3.utils.BN('10').pow(new web3.utils.BN('18')) // 1 eth
        const tab = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const tab18 = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 dai
        // To make final balance calculation easier
        const ethReceiver = web3.eth.accounts.create().address;

        // Deposit eth over admin account
        const ethJoin = mockJoins[ethBytes]
        await mockVat.hope(flip.address, {from: admin})
        await mockWETH.deposit({from: admin, value: initialLot})
        await mockWETH.approve(ethJoin.address, initialLot, {from: admin})
        await ethJoin.join(admin, initialLot, {from: admin})
        await flip.kick(
            '0x0000000000000000000000000000000000000001', // usr,
            '0x0000000000000000000000000000000000000002', // gal,
            tab,
            initialLot,
            0, // initial bid
            {from: admin}
        )

        await mockDai.mockMint(user, tab18.mul(new web3.utils.BN('2')))
        await proxy.flipBidDai(ethBytes, id, tab18, tab, initialLot)
        const updatedLot = initialLot.div(new web3.utils.BN('2'))
        await proxy.flipReduceLot(ethBytes, id, tab18, tab, updatedLot)
        await flip.mockSetEnded(id, {from: admin})
        await proxy.flipClaim(ethBytes, id)
        await proxy.exit(ethBytes, ethReceiver, updatedLot)

        assert.equal((await mockVat.dai.call(proxy.address)).toString(), tab.toString(), 'wrong dai balance')
        assert.equal((await web3.eth.getBalance(ethReceiver)).toString(), updatedLot.toString(), 'wrong eth balance')
    })

    it('can lose eth flip auction', async () => {

        const id = 1
        const flip = mockFlips[ethBytes]
        const initialLot = new web3.utils.BN('10').pow(new web3.utils.BN('18')) // 1 eth
        const tab = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const tab18 = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 dai
        // To make final balance calculation easier
        const ethReceiver = web3.eth.accounts.create().address;

        // Deposit eth over admin account
        const ethJoin = mockJoins[ethBytes]
        await mockVat.hope(flip.address, {from: admin})
        await mockWETH.deposit({from: admin, value: initialLot})
        await mockWETH.approve(ethJoin.address, initialLot, {from: admin})
        await ethJoin.join(admin, initialLot, {from: admin})
        await flip.kick(
            '0x0000000000000000000000000000000000000001', // usr,
            '0x0000000000000000000000000000000000000002', // gal,
            tab,
            initialLot,
            0, // initial bid
            {from: admin}
        )

        await mockDai.mockMint(user, tab18)
        await mockDai.mockMint(otherUser, tab18)
        await proxy.flipBidDai(ethBytes, id, tab18, tab, initialLot)
        const userStartBal = await web3.eth.getBalance(user)
        const updatedLot = initialLot.div(new web3.utils.BN('2'))
        await otherUserProxy.flipReduceLot(ethBytes, id, tab18, tab, updatedLot, {from: otherUser})
        await flip.mockSetEnded(id, {from: admin})
        await otherUserProxy.flipClaim(ethBytes, id, {from: otherUser})
        await otherUserProxy.exit(ethBytes, ethReceiver, updatedLot, {from: otherUser})

        assert.equal((await mockVat.dai.call(proxy.address)).toString(), tab.toString(), 'wrong dai balance')
        assert.equal((await web3.eth.getBalance(user)).toString(), userStartBal, 'wrong eth balance')
        assert.equal((await mockVat.dai.call(otherUserProxy.address)).toString(), '0', 'wrong dai balance')
        assert.equal((await web3.eth.getBalance(ethReceiver)).toString(), updatedLot, 'wrong eth balance')
    })

    it('can win bat flip auction', async () => {

        const bytes = batBytes
        const token = mockBat

        const id = 1
        const flip = mockFlips[bytes]
        const initialLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 bat
        const tab = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const tab18 = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 dai
        const uint256max = new web3.utils.BN('2').pow(new web3.utils.BN('256')).sub(new web3.utils.BN('1'))

        const join = mockJoins[bytes]
        await mockVat.hope(flip.address, {from: admin})
        await token.mockMint(admin, initialLot)
        await token.approve(join.address, uint256max, {from: admin})
        await join.join(admin, initialLot, {from: admin})
        await flip.kick(
            '0x0000000000000000000000000000000000000001', // usr,
            '0x0000000000000000000000000000000000000002', // gal,
            tab,
            initialLot,
            0, // initial bid
            {from: admin}
        )

        await mockDai.mockMint(user, tab18.mul(new web3.utils.BN('2')))
        await proxy.flipBidDai(bytes, id, tab18, tab, initialLot)
        const updatedLot = initialLot.div(new web3.utils.BN('2'))
        await proxy.flipReduceLot(bytes, id, tab18, tab, updatedLot)
        await flip.mockSetEnded(id, {from: admin})
        await proxy.flipClaimAndExit(bytes, id)

        assert.equal((await mockVat.dai.call(proxy.address)).toString(), tab.toString(), 'wrong bat balance')
        assert.equal((await token.balanceOf.call(user)).toString(), updatedLot.toString(), 'wrong bat balance')
    })

    it('can lose bat flip auction', async () => {

        const bytes = batBytes
        const token = mockBat

        const id = 1
        const flip = mockFlips[bytes]
        const initialLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 bat
        const tab = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const tab18 = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 dai
        const uint256max = new web3.utils.BN('2').pow(new web3.utils.BN('256')).sub(new web3.utils.BN('1'))

        const join = mockJoins[bytes]
        await mockVat.hope(flip.address, {from: admin})
        await token.mockMint(admin, initialLot)
        await token.approve(join.address, uint256max, {from: admin})
        await join.join(admin, initialLot, {from: admin})
        await flip.kick(
            '0x0000000000000000000000000000000000000001', // usr,
            '0x0000000000000000000000000000000000000002', // gal,
            tab,
            initialLot,
            0, // initial bid
            {from: admin}
        )

        await mockDai.mockMint(user, tab18)
        await mockDai.mockMint(otherUser, tab18)
        await proxy.flipBidDai(bytes, id, tab18, tab, initialLot)
        const updatedLot = initialLot.div(new web3.utils.BN('2'))
        await otherUserProxy.flipReduceLot(bytes, id, tab18, tab, updatedLot, {from: otherUser})
        await flip.mockSetEnded(id, {from: admin})
        await otherUserProxy.flipClaimAndExit(bytes, id, {from: otherUser})

        assert.equal((await mockVat.dai.call(proxy.address)).toString(), tab.toString(), 'wrong user bat balance')
        assert.equal((await token.balanceOf.call(user)).toString(), '0', 'wrong user bat balance')

        assert.equal((await mockVat.dai.call(otherUser)).toString(), '0', 'wrong other user bat balance')
        assert.equal((await token.balanceOf.call(otherUser)).toString(), updatedLot.toString(), 'wrong other user bat balance')
    })

    it('can win usdc flip auction', async () => {

        const bytes = usdcBytes
        const token = mockUsdc

        const id = 1
        const flip = mockFlips[bytes]
        const initialLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 usdc
        const initialLot6 = initialLot.div(new web3.utils.BN('10').pow(new web3.utils.BN('12')))
        const tab = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const tab18 = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 dai
        const uint256max = new web3.utils.BN('2').pow(new web3.utils.BN('256')).sub(new web3.utils.BN('1'))

        const join = mockJoins[bytes]
        await mockVat.hope(flip.address, {from: admin})
        await token.mockMint(admin, initialLot6)
        await token.approve(join.address, uint256max, {from: admin})
        await join.join(admin, initialLot6, {from: admin})
        await flip.kick(
            '0x0000000000000000000000000000000000000001', // usr,
            '0x0000000000000000000000000000000000000002', // gal,
            tab,
            initialLot,
            0, // initial bid
            {from: admin}
        )

        await mockDai.mockMint(user, tab18.mul(new web3.utils.BN('2')))
        await proxy.flipBidDai(bytes, id, tab18, tab, initialLot)
        const updatedLot = initialLot.div(new web3.utils.BN('2'))
        await proxy.flipReduceLot(bytes, id, tab18, tab, updatedLot)
        await flip.mockSetEnded(id, {from: admin})
        await proxy.flipClaimAndExit(bytes, id)

        assert.equal((await mockVat.dai.call(proxy.address)).toString(), tab.toString(), 'wrong usdc balance')
        assert.equal((await token.balanceOf.call(user)).toString(), updatedLot.div(new web3.utils.BN('10').pow(new web3.utils.BN('12'))).toString(), 'wrong usdc balance')
    })

    it('can lose usdc flip auction', async () => {

        const bytes = usdcBytes
        const token = mockUsdc

        const id = 1
        const flip = mockFlips[bytes]
        const initialLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 usdc
        const initialLot6 = initialLot.div(new web3.utils.BN('10').pow(new web3.utils.BN('12')))
        const tab = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const tab18 = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 dai
        const uint256max = new web3.utils.BN('2').pow(new web3.utils.BN('256')).sub(new web3.utils.BN('1'))

        const join = mockJoins[bytes]
        await mockVat.hope(flip.address, {from: admin})
        await token.mockMint(admin, initialLot6)
        await token.approve(join.address, uint256max, {from: admin})
        await join.join(admin, initialLot6, {from: admin})
        await flip.kick(
            '0x0000000000000000000000000000000000000001', // usr,
            '0x0000000000000000000000000000000000000002', // gal,
            tab,
            initialLot,
            0, // initial bid
            {from: admin}
        )

        await mockDai.mockMint(user, tab18)
        await mockDai.mockMint(otherUser, tab18)
        await proxy.flipBidDai(bytes, id, tab18, tab, initialLot)
        const updatedLot = initialLot.div(new web3.utils.BN('2'))
        await otherUserProxy.flipReduceLot(bytes, id, tab18, tab, updatedLot, {from: otherUser})
        await flip.mockSetEnded(id, {from: admin})
        await otherUserProxy.flipClaimAndExit(bytes, id, {from: otherUser})

        assert.equal((await mockVat.dai.call(proxy.address)).toString(), tab.toString(), 'wrong user usdc balance')
        assert.equal((await token.balanceOf.call(user)).toString(), '0', 'wrong user usdc balance')

        assert.equal((await mockVat.dai.call(otherUser)).toString(), '0', 'wrong other user usdc balance')
        assert.equal((await token.balanceOf.call(otherUser)).toString(), updatedLot.div(new web3.utils.BN('10').pow(new web3.utils.BN('12'))).toString(), 'wrong other user usdc balance')
    })

    it('can win flap auction', async () => {

        const lot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const expectUser = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18')))
        const bid = 34985345823
        const id = 1

        // lot will be taken from msg.sender
        await mockVat.mockMintDai(admin, lot)
        await mockFlap.kick(lot, 0, {from: admin})

        await mockMkr.mockMint(user, bid)
        await proxy.flapBidMkr(id, bid, bid, lot)
        await mockFlap.mockSetEnded(id, {from: admin})
        await proxy.flapClaimAndExit(id)

        assert.equal((await mockMkr.balanceOf.call(user)).toString(), '0', 'wrong mkr balance')
        assert.equal((await mockDai.balanceOf.call(user)).toString(), expectUser.toString(), 'wrong dai balance')
    })

    it('can lose flap auction', async () => {

        const lot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const expectOtherUser = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18')))
        const userBid = new web3.utils.BN('34985345823')
        const otherUserBid = userBid.mul(new web3.utils.BN('2'))
        const id = 1
        
        // lot will be taken from msg.sender
        await mockVat.mockMintDai(admin, lot)
        await mockFlap.kick(lot, 0, {from: admin})

        await mockMkr.mockMint(user, userBid)
        await mockMkr.mockMint(otherUser, otherUserBid)

        await proxy.flapBidMkr(id, userBid, userBid, lot)
        await otherUserProxy.flapBidMkr(id, otherUserBid, otherUserBid, lot, {from: otherUser})
        await mockFlap.mockSetEnded(id, {from: admin})
        await otherUserProxy.flapClaimAndExit(id, {from: otherUser})

        assert.equal((await mockMkr.balanceOf.call(proxy.address)).toString(), userBid.toString(), 'wrong user mkr balance')
        assert.equal((await mockDai.balanceOf.call(user)).toString(), '0', 'wrong user dai balance')

        assert.equal((await mockMkr.balanceOf.call(otherUser)).toString(), '0', 'wrong other user mkr balance')
        assert.equal((await mockDai.balanceOf.call(otherUser)).toString(), expectOtherUser.toString(), 'wrong other user dai balance')
    })

    it('can win flop auction', async () => {

        const initialLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 mkr
        const bid = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const pull = bid.div(new web3.utils.BN('10').pow(new web3.utils.BN('27')))
        const lot = initialLot.div(new web3.utils.BN('2')) // 5 mkr
        const id = 1

        await mockFlop.kick('0x0000000000000000000000000000000000000001', initialLot, bid, {from: admin})

        await mockDai.mockMint(user, pull)
        await proxy.flopReduceMkr(id, pull, bid, lot)
        await mockFlop.mockSetEnded(id, {from: admin})
        await proxy.flopClaimAndExit(id)

        assert.equal((await mockMkr.balanceOf.call(user)).toString(), lot.toString(), 'wrong mkr balance')
        assert.equal((await mockDai.balanceOf.call(user)).toString(), '0', 'wrong dai balance')
    })

    it('can lose flop auction', async () => {

        const initialLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 mkr
        const bid = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        const pull = bid.div(new web3.utils.BN('10').pow(new web3.utils.BN('27')))
        const userLot = initialLot.div(new web3.utils.BN('2')) // 5 mkr
        const otherUserLot = userLot.div(new web3.utils.BN('2')) // 2.5 mkr
        const id = 1

        await mockFlop.kick('0x0000000000000000000000000000000000000001', initialLot, bid, {from: admin})

        await mockDai.mockMint(user, pull)
        await mockDai.mockMint(otherUser, pull)

        await proxy.flopReduceMkr(id, pull, bid, userLot)
        await otherUserProxy.flopReduceMkr(id, pull, bid, otherUserLot, {from: otherUser})
        await mockFlop.mockSetEnded(id, {from: admin})
        await otherUserProxy.flopClaimAndExit(id, {from: otherUser})

        assert.equal((await mockVat.dai.call(proxy.address)).toString(), bid.toString(), 'wrong user dai balance')
        assert.equal((await mockMkr.balanceOf.call(user)).toString(), '0', 'wrong other user mkr balance')

        assert.equal((await mockMkr.balanceOf.call(otherUser)).toString(), otherUserLot.toString(), 'wrong other user mkr balance')
        assert.equal((await mockDai.balanceOf.call(otherUser)).toString(), '0', 'wrong other user dai balance')
    })
})
