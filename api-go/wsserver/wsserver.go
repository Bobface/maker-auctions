package wsserver

import (
	"sync"

	"../global"
	"../parsers/flapparser"
	"../parsers/flipparser"
	"../parsers/flopparser"

	"net/http"

	"github.com/inconshreveable/log15"
)

var (
	hub *Hub
	log log15.Logger

	historyLength int

	// FlipETHChan is the channel for flip eth state updates
	FlipETHChan chan flipparser.State
	// FlipBATChan is the channel for flip bat state updates
	FlipBATChan chan flipparser.State
	// FlipUSDCChan is the channel for flip usdc state updates
	FlipUSDCChan chan flipparser.State

	// FlapChan is the channel for flap state updates
	FlapChan chan flapparser.State

	// FlopChan is the channel for flap state updates
	FlopChan chan flopparser.State

	stateLock  sync.Mutex
	flipStates map[string]flipparser.State
	flapState  flapparser.State
	flopState  flopparser.State
)

// Run starts the websocket server
func Run() {

	log = log15.New("module", "wsserver")

	historyLength = 20
	FlipETHChan = make(chan flipparser.State)
	FlipBATChan = make(chan flipparser.State)
	FlipUSDCChan = make(chan flipparser.State)
	FlapChan = make(chan flapparser.State)
	FlopChan = make(chan flopparser.State)
	flipStates = make(map[string]flipparser.State)

	hub = newHub()
	go hub.run()

	go parserChannelListener()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	log.Info("listening for connections")
	if global.IsWebtest() || global.IsLocal() {
		go func() {
			err := http.ListenAndServe(":8000", nil)
			if err != nil {
				panic(err)
			}
		}()
	} else {
		go func() {
			err := http.ListenAndServeTLS(":8000", "/etc/letsencrypt/live/maker-auctions.io/fullchain.pem", "/etc/letsencrypt/live/maker-auctions.io/privkey.pem", nil)
			if err != nil {
				panic(err)
			}
		}()
	}
}
