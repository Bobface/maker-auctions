package wsserver

import (
	"../global"
	"../parsers/flipparser"

	"net/http"

	"github.com/inconshreveable/log15"
)

var (
	hub *Hub
	log log15.Logger

	historyLength int

	flipETHChan  chan flipparser.State
	flipBATChan  chan flipparser.State
	flipUSDCChan chan flipparser.State
	flipStates   map[string]flipparser.State
)

// Run starts the websocket server
func Run() {

	log = log15.New("module", "wsserver")

	historyLength = 20
	flipETHChan = make(chan flipparser.State)
	flipBATChan = make(chan flipparser.State)
	flipUSDCChan = make(chan flipparser.State)
	flipStates = make(map[string]flipparser.State)

	hub = newHub()
	go hub.run()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	var err error
	log.Info("listening for connections")
	if global.IsWebtest() || global.IsLocal() {
		err = http.ListenAndServe(":8000", nil)
	} else {
		err = http.ListenAndServeTLS(":8000", "/etc/letsencrypt/live/maker-auctions.io/fullchain.pem", "/etc/letsencrypt/live/maker-auctions.io/privkey.pem", nil)
	}
	if err != nil {
		log.Crit("failed to run wsserver", "err", err.Error())
		panic("")
	}
}
