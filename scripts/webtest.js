const { exec } = require("child_process");
const Web3 = require('web3')

/*
    - 1. Start a local ganache instance
    - 2. Start the 'webtest' migration which sets up test auctions
    - 3. Start api in webtest mode 
    - 4. Start local node webserver
*/

// Dont worry, this private key is used for ganache testing only
const userOnePrivateKey = '0x2f37606fcbf08753c96189ce822a22ef08d90d9fa85ed1ca6034424640e22231'
const userTwoPrivateKey = '0x05fd5f19cd79d828d98b6e7ad687932f00229981c4c5286068730e18fc4fcfb0'

const ethBalance = '1000000000000000000000' // 1000 eth

console.log('--- Starting ganache')
const ganache = exec(`ganache-cli -p 7545 --account "${userOnePrivateKey},${ethBalance}" --account "${userTwoPrivateKey},${ethBalance}"`)
ganache.stdout.pipe(process.stdout)

console.log('--- Starting truffle migrations')
const truffle = exec('truffle migrate --reset --network webtest')
truffle.stdout.pipe(process.stdout)
truffle.on('exit', function() {

    console.log('--- Starting api')
    const api = exec('node ../api/main.js --webtest', {cwd: '../api/'})
    api.stdout.pipe(process.stdout)

    console.log('--- Starting node webserver')
    const serve = exec('npm run serve', {cwd: '../'})
    serve.stdout.pipe(process.stdout)

    // Deploy more auctions
    setTimeout(async () => {

        // web3 setup
        const web3 = new Web3('http://localhost:7545')
        const account = '0x229877f2da86150da3a24F6A1C965B337e12eb7C' // user one
        const addresses = require('../build/webtest/addresses.json')


        const mockVat = new web3.eth.Contract(require('../build/contracts/MockVat.json').abi, addresses.vat)
        const mockFlap = new web3.eth.Contract(require('../build/contracts/MockFlapper.json').abi, addresses.flap)
        const mockFlop = new web3.eth.Contract(require('../build/contracts/MockFlopper.json').abi, addresses.flop)
        const mockMkr = new web3.eth.Contract(require('../build/contracts/MockDSToken.json').abi, addresses.mkr)

        const mockWETH = new web3.eth.Contract(require('../build/contracts/MockWETH.json').abi, addresses.weth)
        const mockEthJoin = new web3.eth.Contract(require('../build/contracts/MockGemJoin.json').abi, addresses.ethJoin)
        const mockEthFlip = new web3.eth.Contract(require('../build/contracts/MockFlipper.json').abi, addresses.ethFlip)
        
        const mockBat = new web3.eth.Contract(require('../build/contracts/MockERC20.json').abi, addresses.bat)
        const mockBatJoin = new web3.eth.Contract(require('../build/contracts/MockGemJoin.json').abi, addresses.batJoin)
        const mockBatFlip = new web3.eth.Contract(require('../build/contracts/MockFlipper.json').abi, addresses.batFlip)

        const mockUsdc = new web3.eth.Contract(require('../build/contracts/MockERC20.json').abi, addresses.usdc)
        const mockUsdcJoin = new web3.eth.Contract(require('../build/contracts/MockGemJoinWithDecimals.json').abi, addresses.usdcJoin)
        const mockUsdcFlip = new web3.eth.Contract(require('../build/contracts/MockFlipper.json').abi, addresses.usdcFlip)

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

        await mockWETH.methods.deposit().send({from: account, value: new web3.utils.BN('50').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18')))})
        await mockBat.methods.mockMint(account, new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18')))).send({from: account})
        await mockUsdc.methods.mockMint(account, new web3.utils.BN('10000').mul(new web3.utils.BN('10').pow(new web3.utils.BN('6')))).send({from: account})

        const uint256max = new web3.utils.BN('2').pow(new web3.utils.BN('256')).sub(new web3.utils.BN('1'))
        for(let i = 0; i < flipAuctionArray.length; i++) {

            const obj = flipAuctionArray[i]
            const token = obj.token
            const join = obj.join
            const flip = obj.flip

            const lot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18')))
            const tab = new web3.utils.BN('100').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45')))

            let deposit = lot
            if(token.options.address === mockUsdc.options.address) {
                deposit = deposit.div(new web3.utils.BN('10').pow(new web3.utils.BN('12')))
            }

            // Normally funds would be taken from the cat.
            // However for testing we kick ourselves, 
            // so we need to allow the flip to access our funds in the vat.
            await mockVat.methods.hope(flip.options.address).send({from: account})
            await token.methods.approve(join.options.address, uint256max).send({from: account})
            
            // No bid yet
            await join.methods.join(account, deposit).send({from: account})
            await flip.methods.kick(
                '0x0000000000000000000000000000000000000001', // usr,
                '0x0000000000000000000000000000000000000002', // gal,
                tab,
                lot,
                0
            ).send({from: account, gas: 2000000})
        }

        // Start flap auction
        const flapLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('45'))) // 10 dai
        await mockVat.methods.mockMintDai(account, flapLot).send({from: account})
        await mockFlap.methods.kick(flapLot, 0).send({from: account, gas: 2000000})

        // Start flop auction
        const flopLot = new web3.utils.BN('10').mul(new web3.utils.BN('10').pow(new web3.utils.BN('18'))) // 10 mkr
        await mockMkr.methods.mockMint(account, flopLot).send({from: account})
        await mockFlop.methods.kick('0x0000000000000000000000000000000000000001', flopLot, 0).send({from: account})

    }, 10000)//90000)
})