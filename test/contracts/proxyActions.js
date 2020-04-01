const Actions = artifacts.require('ProxyActions')

contract('ProxyActions', accounts => {
    
    let actions

    before(() => {
        let bytecodeSize = Actions.bytecode.length / 2
        var deployedSize = Actions.deployedBytecode.length / 2

        if(bytecodeSize > 24000 || deployedSize > 24000) {
            console.log("size of bytecode in bytes = ", bytecodeSize)
            console.log("size of deployed in bytes = ", deployedSize)
            
            throw "Contract is too large"
        }
    })

    beforeEach(async () => {
        actions = await Actions.new()
    });

    it('should not be too big', () => {
        // We need a test so that the size calculation runs
    })
})
