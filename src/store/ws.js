let store

function connect() {
    if(process.env.VUE_APP_IS_WEBTEST === 'TRUE' || process.env.VUE_APP_USE_LIVE === 'FALSE') {
        store.dispatch('init', 'ws://localhost:8000')
    } else {
        store.dispatch('init', 'wss://maker-auctions.io:8000')
    }
}

exports.init = (st) => {
    store = st
    connect()
}