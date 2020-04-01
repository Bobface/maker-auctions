exports.isWebtest = function() {
    if(process.argv.length > 2) {
        if(process.argv.length !== 3) {
            console.log('unknown command line option count')
            process.exit()
        }
        const param = process.argv[2]
        if(param === '--webtest') {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

exports.isLocal = function() {
    if(process.argv.length > 2) {
        if(process.argv.length !== 3) {
            console.log('unknown command line option count')
            process.exit()
        }
        const param = process.argv[2]
        if(param === '--local') {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}