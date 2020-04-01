const Store = artifacts.require('ProxyActionsStorage')

contract('ProxyActionsStorage', accounts => {
    
    const ethBytes = '0x4554480000000000000000000000000000000000000000000000000000000000'
    const daiBytes = '0x4441490000000000000000000000000000000000000000000000000000000000'
    const batBytes = '0x4241540000000000000000000000000000000000000000000000000000000000'
    const usdcBytes = '0x5553444300000000000000000000000000000000000000000000000000000000'
    const mkrBytes = '0x4d4b520000000000000000000000000000000000000000000000000000000000'

    let store

    beforeEach(async () => {
        store = await Store.new()
    });

    it('should have correct stored values',  async () => {

        
        // variables
        assert.equal(await store.vat.call(), '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B', 'vat')
        assert.equal(await store.flap.call(), '0xdfE0fb1bE2a52CDBf8FB962D5701d7fd0902db9f', 'flap')
        assert.equal(await store.flop.call(), '0x4D95A049d5B0b7d32058cd3F2163015747522e99', 'flop')

        // tokens
        assert.equal(await store.tokens.call(ethBytes), '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'tokens ETH')
        assert.equal(await store.tokens.call(daiBytes), '0x6B175474E89094C44Da98b954EedeAC495271d0F', 'tokens DAI')
        assert.equal(await store.tokens.call(batBytes), '0x0D8775F648430679A709E98d2b0Cb6250d2887EF', 'tokens BAT')
        assert.equal(await store.tokens.call(usdcBytes), '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'tokens USDC')
        assert.equal(await store.tokens.call(mkrBytes), '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 'tokens MKR')

        // decimals
        assert.equal(await store.decimals.call(ethBytes), '18', 'decimals ETH')
        assert.equal(await store.decimals.call(batBytes), '18', 'decimals BAT')
        assert.equal(await store.decimals.call(usdcBytes), '6', 'decimals USDC')

        // ilks
        assert.equal(
            await store.ilks.call(ethBytes),
            '0x4554482d41000000000000000000000000000000000000000000000000000000', // ETH-A
            'ilks ETH')

        assert.equal(
            await store.ilks.call(batBytes),
            '0x4241542d41000000000000000000000000000000000000000000000000000000', // BAT-A
            'ilks BAT')

        assert.equal(
            await store.ilks.call(usdcBytes),
            '0x555344432d410000000000000000000000000000000000000000000000000000', // USDC-A
            'ilks USDC')
    
        // tokenJoins
        assert.equal(await store.tokenJoins.call(ethBytes), '0x2F0b23f53734252Bda2277357e97e1517d6B042A', 'tokenJoins ETH')
        assert.equal(await store.tokenJoins.call(daiBytes), '0x9759A6Ac90977b93B58547b4A71c78317f391A28', 'tokenJoins DAI')
        assert.equal(await store.tokenJoins.call(batBytes), '0x3D0B1912B66114d4096F48A8CEe3A56C231772cA', 'tokenJoins BAT')
        assert.equal(await store.tokenJoins.call(usdcBytes), '0xA191e578a6736167326d05c119CE0c90849E84B7', 'tokenJoins USDC')

        // flips
        assert.equal(await store.flips.call(ethBytes), '0xd8a04F5412223F513DC55F839574430f5EC15531', 'flips ETH')
        assert.equal(await store.flips.call(batBytes), '0xaA745404d55f88C108A28c86abE7b5A1E7817c07', 'flips BAT')
        assert.equal(await store.flips.call(usdcBytes), '0xE6ed1d09a19Bd335f051d78D5d22dF3bfF2c28B1', 'flips USDC')
    })
})
