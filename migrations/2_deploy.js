const fs = require('fs')

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
const MockProxyActionsStorage = artifacts.require('MockProxyActionsStorage')

const ProxyManager = artifacts.require('ProxyManager')
const ProxyActions = artifacts.require('ProxyActions')
const ProxyActionsStorage = artifacts.require('ProxyActionsStorage')

const ethBytes = '0x4554480000000000000000000000000000000000000000000000000000000000'
const daiBytes = '0x4441490000000000000000000000000000000000000000000000000000000000'
const batBytes = '0x4241540000000000000000000000000000000000000000000000000000000000'
const usdcBytes = '0x5553444300000000000000000000000000000000000000000000000000000000'
const mkrBytes = '0x4d4b520000000000000000000000000000000000000000000000000000000000'

const ethIlk = '0x4554482d41000000000000000000000000000000000000000000000000000000'
const batIlk = '0x4241542d41000000000000000000000000000000000000000000000000000000'
const usdcIlk = '0x555344432d410000000000000000000000000000000000000000000000000000'


module.exports = async function(deployer, network, accounts) {

    console.log(network);
    if(network === 'mainnet' || network === 'mainnet-fork') {
        await deployer.deploy(ProxyActionsStorage)
        await deployer.deploy(ProxyActions)
        await deployer.deploy(ProxyManager, ProxyActions.address, ProxyActionsStorage.address)
    } else if(network === 'webtest') {

        // Vat
        await deployer.deploy(MockVat)
        const mockVat = await MockVat.at(MockVat.address)
        await mockVat.init(ethIlk)
        await mockVat.init(batIlk)
        await mockVat.init(usdcIlk)

        // Tokens
        await deployer.deploy(MockWETH)
        const mockWETH = await MockWETH.at(MockWETH.address)

        await deployer.deploy(MockDai, 0)
        const mockDai = await MockDai.at(MockDai.address) 

        await deployer.deploy(MockERC20, 18)
        const mockBat = await MockERC20.at(MockERC20.address)

        await deployer.deploy(MockERC20, 6)
        const mockUsdc = await MockERC20.at(MockERC20.address)
        
        await deployer.deploy(MockDSToken, 18)
        const mockMkr = await MockDSToken.at(MockDSToken.address)

        // Joins
        await deployer.deploy(MockGemJoin, mockVat.address, ethIlk, mockWETH.address)
        const mockEthJoin = await MockGemJoin.at(MockGemJoin.address)

        await deployer.deploy(MockDaiJoin, mockVat.address, mockDai.address)
        const mockDaiJoin = await MockDaiJoin.at(MockDaiJoin.address)

        await deployer.deploy(MockGemJoin, mockVat.address, batIlk, mockBat.address)
        const mockBatJoin = await MockGemJoin.at(MockGemJoin.address)

        await deployer.deploy(MockGemJoinWithDecimals, mockVat.address, usdcIlk, mockUsdc.address)
        const mockUsdcJoin = await MockGemJoinWithDecimals.at(MockGemJoinWithDecimals.address)

        // Flips
        await deployer.deploy(MockFlip, mockVat.address, ethIlk)
        const mockEthFlip = await MockFlip.at(MockFlip.address)

        await deployer.deploy(MockFlip, mockVat.address, batIlk)
        const mockBatFlip = await MockFlip.at(MockFlip.address)

        await deployer.deploy(MockFlip, mockVat.address, usdcIlk)
        const mockUsdcFlip = await MockFlip.at(MockFlip.address)

        // Set flip begs to mainnet value
        await mockEthFlip.file('0x6265670000000000000000000000000000000000000000000000000000000000', new web3.utils.BN('1030000000000000000'))
        await mockBatFlip.file('0x6265670000000000000000000000000000000000000000000000000000000000', new web3.utils.BN('1030000000000000000'))
        await mockUsdcFlip.file('0x6265670000000000000000000000000000000000000000000000000000000000', new web3.utils.BN('1030000000000000000'))

        // Set flip tau
        const flipTau = 120
        await mockEthFlip.file('0x7461750000000000000000000000000000000000000000000000000000000000', flipTau)
        await mockBatFlip.file('0x7461750000000000000000000000000000000000000000000000000000000000', flipTau)
        await mockUsdcFlip.file('0x7461750000000000000000000000000000000000000000000000000000000000', flipTau)

        // Flap
        await deployer.deploy(MockFlap, mockVat.address, mockMkr.address)
        const mockFlap = await MockFlap.at(MockFlap.address)

        // Flop
        await deployer.deploy(MockFlop, mockVat.address, mockMkr.address)
        const mockFlop = await MockFlop.at(MockFlop.address)

        // Rely & Hope
        await mockVat.rely(mockEthJoin.address)
        await mockVat.rely(mockBatJoin.address)
        await mockVat.rely(mockUsdcJoin.address)
        await mockDai.rely(mockDaiJoin.address)
        await mockVat.hope(mockFlap.address)

        // Mint 10k (10k * 10**45) in vat for dai join - this way we dont have to generate them first by depositing eth
        await mockVat.mockMintDai(mockDaiJoin.address, new web3.utils.BN('10000000000000000000000000000000000000000000000000'))

        // Proxy
        await deployer.deploy(MockProxyActionsStorage)
        const mockStorage = await MockProxyActionsStorage.at(MockProxyActionsStorage.address)

        await deployer.deploy(ProxyActions)
        const actions = await ProxyActions.at(ProxyActions.address)

        // Set mock values for storage
        await mockStorage.mockSetVat(mockVat.address)
        await mockStorage.mockSetToken(ethBytes, mockWETH.address)
        await mockStorage.mockSetToken(daiBytes, mockDai.address)
        await mockStorage.mockSetToken(batBytes, mockBat.address)
        await mockStorage.mockSetToken(usdcBytes, mockUsdc.address)
        await mockStorage.mockSetToken(mkrBytes, mockMkr.address)
        await mockStorage.mockSetFlip(ethBytes, mockEthFlip.address)
        await mockStorage.mockSetFlip(batBytes, mockBatFlip.address)
        await mockStorage.mockSetFlip(usdcBytes, mockUsdcFlip.address)
        await mockStorage.mockSetFlap(mockFlap.address)
        await mockStorage.mockSetFlop(mockFlop.address)
        await mockStorage.mockSetTokenJoin(ethBytes, mockEthJoin.address)
        await mockStorage.mockSetTokenJoin(daiBytes, mockDaiJoin.address)
        await mockStorage.mockSetTokenJoin(batBytes, mockBatJoin.address)
        await mockStorage.mockSetTokenJoin(usdcBytes, mockUsdcJoin.address)

        // Proxy Manager
        await deployer.deploy(ProxyManager, actions.address, mockStorage.address)
        const manager = await ProxyManager.at(ProxyManager.address)

        // Mint some tokens
        await mockWETH.deposit({value: new web3.utils.BN('50').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18')))})
        await mockDai.mockMint(accounts[0], new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))))
        await mockBat.mockMint(accounts[0], new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))))
        await mockUsdc.mockMint(accounts[0], new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('6'))))
        await mockMkr.mockMint(accounts[0], new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))))

        // User
        await mockDai.mockMint(accounts[1], new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))))
        await mockBat.mockMint(accounts[1], new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))))
        await mockUsdc.mockMint(accounts[1], new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('6'))))
        await mockMkr.mockMint(accounts[1], new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))))

        // Start flip auctions
        const flipAuctionArray = [
            {
                token: mockWETH,
                join: mockEthJoin,
                flip: mockEthFlip,
            },
            {
                token: mockBat,
                join: mockBatJoin,
                flip: mockBatFlip,
            },
            {
                token: mockUsdc,
                join: mockUsdcJoin,
                flip: mockUsdcFlip,
            },
        ]

        const uint256max = new web3.utils.BN('2').pow(new web3.utils.BN('256')).sub(new web3.utils.BN('1'))
        for(let i = 0; i < flipAuctionArray.length; i++) {

            const obj = flipAuctionArray[i]
            const token = obj.token
            const join = obj.join
            const flip = obj.flip

            const lot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18')))
            const tab = new web3.utils.BN('100').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45')))

            let deposit = lot
            if(token.address === mockUsdc.address) {
                deposit = deposit.div(new web3.utils.BN('10').pow(new web3.utils.BN('12')))
            }

            // Normally funds would be taken from the cat.
            // However for testing we kick ourselves, 
            // so we need to allow the flip to access our funds in the vat.
            await mockVat.hope(flip.address)
            await token.approve(join.address, uint256max)
            
            // No bid yet
            await join.join(accounts[0], deposit)
            await flip.kick(
                '0x0000000000000000000000000000000000000001', // usr,
                '0x0000000000000000000000000000000000000002', // gal,
                tab,
                lot,
                0
            )

            // Second phase
            await join.join(accounts[0], deposit)
            await flip.kick(
                '0x0000000000000000000000000000000000000001', // usr,
                '0x0000000000000000000000000000000000000002', // gal,
                tab,
                lot,
                tab,
            )
        }



        // Start flap auction
        const flapLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        await mockVat.mockMintDai(accounts[0], flapLot)
        await mockFlap.kick(flapLot, 0)

        // Start flop auction
        const flopLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 mkr
        await mockMkr.mockMint(accounts[0], flopLot)
        await mockFlop.kick('0x0000000000000000000000000000000000000001', flopLot, 0)

        // Truffle does not store the addresses of multiple instances of the same contract.
        // Therefore we store them ourselves.
        const webtestDeployedAddresses = {
            vat: mockVat.address,
            weth: mockWETH.address,
            dai: mockDai.address,
            bat: mockBat.address,
            usdc: mockUsdc.address,
            mkr: mockMkr.address,
            ethJoin: mockEthJoin.address,
            daiJoin: mockDaiJoin.address,
            batJoin: mockBatJoin.address,
            usdcJoin: mockUsdcJoin.address,
            ethFlip: mockEthFlip.address,
            batFlip: mockBatFlip.address,
            usdcFlip: mockUsdcFlip.address,
            flap: mockFlap.address,
            flop: mockFlop.address,
            storage: mockStorage.address,
            actions: actions.address,
            manager: manager.address,
        }

        const path = '../build/webtest/addresses.json'
        fs.writeFileSync(path, JSON.stringify(webtestDeployedAddresses))
    }
}