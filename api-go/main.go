package main

import (
	"context"

	"./contracts"
	"./eth"
	"./global"
	"./parsers/flipparser"
	"./wsserver"
	"github.com/inconshreveable/log15"
)

func main() {
	log := log15.New("module", "main")

	global.Init()
	eth.Init()
	con := contracts.New()

	latestBlock, err := eth.GetHTTPClient().BlockByNumber(context.Background(), nil)
	if err != nil {
		log.Crit("failed to get latest block", "err", err.Error())
		panic("")
	}
	log.Info("received initial block number", "num", latestBlock.Number().String())

	ethFlipParser := flipparser.New("ETH", latestBlock.Number(), con.ETHFlip)
	go ethFlipParser.Run()

	wsserver.Run()
}
