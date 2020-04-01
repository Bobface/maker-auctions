const { exec } = require("child_process");

/*
    - 1. Start a local ganache instance
    - 2. Start the 'webtest' migration which sets up test auctions
    - 3. Start api in webtest mode 
    - 4. Start local node webserver
*/

// Dont worry, this private key is used for ganache testing only
const testAdminPrivateKey = '0x2f37606fcbf08753c96189ce822a22ef08d90d9fa85ed1ca6034424640e22231'
const testUserPrivateKey = '0x05fd5f19cd79d828d98b6e7ad687932f00229981c4c5286068730e18fc4fcfb0'

const ethBalance = '1000000000000000000000' // 1000 eth

console.log('--- Starting ganache')
const ganache = exec(`ganache-cli -p 7545 --account "${testAdminPrivateKey},${ethBalance}" --account "${testUserPrivateKey},${ethBalance}"`)
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
})