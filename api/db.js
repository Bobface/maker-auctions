const fs = require('fs');
const conf = require('./config')

function readDB(path) {
    if (!fs.existsSync(path)) {
        fs.appendFileSync(path, '')
        return undefined
    }

    return JSON.parse(fs.readFileSync(path))
}

function writeDB(path, content) {
    fs.writeFileSync(path, JSON.stringify(content))
}

exports.getDB = (name) => {

    if(conf.isWebtest()) {
        // If webtest, add _webtest to all dbs
        // and clear them 

        name = name + '_webtest'
        path = './db/' + name + '.json'
        if (fs.existsSync(path)) {
            fs.unlinkSync(path)
        }
    }

    return {
        write: (content) => {
            writeDB('./db/' + name + '.json', content)
        },
        read: () => {
            return readDB('./db/' + name + '.json')
        },
    }
}