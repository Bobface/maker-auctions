package main

import (
	"context"
	"time"

	"./contracts"
	"./discord"
	"./eth"
	"./global"
	"./parsers/flapparser"
	"./parsers/flipparser"
	"./parsers/flopparser"
	"./wsserver"
	"github.com/inconshreveable/log15"
)

func main() {
	log := log15.New("module", "main")

	global.Init()
	eth.Init()
	con := contracts.New()

	wsserver.Run()
	discord.Run()

	latestBlock, err := eth.GetHTTPClient().BlockByNumber(context.Background(), nil)
	if err != nil {
		log.Crit("failed to get latest block", "err", err.Error())
		panic("")
	}
	log.Info("received initial block number", "num", latestBlock.Number().String())

	ethFlipParser := flipparser.New("ETH", latestBlock.Number(), con.ETHFlip, wsserver.FlipETHChan, discord.FlipETHChan)
	go ethFlipParser.Run()
	batFlipParser := flipparser.New("BAT", latestBlock.Number(), con.BATFlip, wsserver.FlipBATChan, discord.FlipBATChan)
	go batFlipParser.Run()
	usdcFlipParser := flipparser.New("USDC", latestBlock.Number(), con.USDCFlip, wsserver.FlipUSDCChan, discord.FlipUSDCChan)
	go usdcFlipParser.Run()

	flapParser := flapparser.New(latestBlock.Number(), con.Flap, wsserver.FlapChan, discord.FlapChan)
	go flapParser.Run()

	flopParser := flopparser.New(latestBlock.Number(), con.Flop, wsserver.FlopChan, discord.FlopChan)
	go flopParser.Run()

	for {
		// Todo: wait for exit event
		time.Sleep(time.Second)
	}
}
