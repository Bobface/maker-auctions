package main

import (
	"./contracts"
	"./eth"
	"./global"
	"./parsers/flipparser"
)

func main() {
	global.Init()
	eth.Init()
	con := contracts.New()

	ethFlipParser := flipparser.New("ETH", con.ETHFlip, con.ETHFlipWS)
	ethFlipParser.Run()
}
