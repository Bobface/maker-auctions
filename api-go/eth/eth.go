package eth

import (
	"fmt"

	"../global"

	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/inconshreveable/log15"
)

var (
	log log15.Logger

	httpClient *ethclient.Client
	wsClient   *ethclient.Client
)

// GetHTTPClient returns the http client
func GetHTTPClient() *ethclient.Client {
	return httpClient
}

// GetWSClient returns the ws client
func GetWSClient() *ethclient.Client {
	return wsClient
}

// Init connects eth clients to the provider
func Init() {
	log = log15.New("module", "eth")

	http := ""
	ws := ""
	if global.IsWebtest() {
		http = "http://localhost:7545"
		ws = "ws://localhost:7545"
	} else {
		http = fmt.Sprintf("https://mainnet.infura.io/v3/%s", global.GetInfuraKey())
		ws = fmt.Sprintf("wss://mainnet.infura.io/ws/v3/%s", global.GetInfuraKey())
	}

	var err error

	httpClient, err = ethclient.Dial(http)
	if err != nil {
		log.Crit("failed to connect to http eth provider", "err", err.Error())
		panic("")
	}

	wsClient, err = ethclient.Dial(ws)
	if err != nil {
		log.Crit("failed to connect to ws eth provider", "err", err.Error())
		panic("")
	}

	log.Info("clients connected")
}
