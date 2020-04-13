package contracts

import (
	"../eth"
	"../global"
	"./flapper"
	"./flipper"
	"./flopper"
	"github.com/ethereum/go-ethereum/common"
	"github.com/inconshreveable/log15"
)

// Contracts defines contracts used by the backend
type Contracts struct {
	ETHFlip   *flipper.Flipper
	ETHFlipWS *flipper.Flipper

	BATFlip   *flipper.Flipper
	BATFlipWS *flipper.Flipper

	USDCFlip   *flipper.Flipper
	USDCFlipWS *flipper.Flipper

	Flap   *flapper.Flapper
	FlapWS *flapper.Flapper

	Flop   *flopper.Flopper
	FlopWS *flopper.Flopper
}

// New returns new contracts
func New() Contracts {

	log := log15.New("module", "contracts")

	var ethFlipAddr common.Address
	var batFlipAddr common.Address
	var usdcFlipAddr common.Address
	var flapAddr common.Address
	var flopAddr common.Address

	if global.IsWebtest() {

	} else {
		ethFlipAddr = common.HexToAddress("0xd8a04F5412223F513DC55F839574430f5EC15531")
		batFlipAddr = common.HexToAddress("0xaA745404d55f88C108A28c86abE7b5A1E7817c07")
		usdcFlipAddr = common.HexToAddress("0xE6ed1d09a19Bd335f051d78D5d22dF3bfF2c28B1")
		flapAddr = common.HexToAddress("0xdfE0fb1bE2a52CDBf8FB962D5701d7fd0902db9f")
		flopAddr = common.HexToAddress("0x4D95A049d5B0b7d32058cd3F2163015747522e99")
	}

	var err error
	var ethFlip *flipper.Flipper
	var ethFlipWS *flipper.Flipper
	var batFlip *flipper.Flipper
	var batFlipWS *flipper.Flipper
	var usdcFlip *flipper.Flipper
	var usdcFlipWS *flipper.Flipper
	var flap *flapper.Flapper
	var flapWS *flapper.Flapper
	var flop *flopper.Flopper
	var flopWS *flopper.Flopper

	ethFlip, err = flipper.NewFlipper(ethFlipAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create eth flip http contract", "err", err.Error())
		panic("")
	}
	ethFlipWS, err = flipper.NewFlipper(ethFlipAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create eth flip ws contract", "err", err.Error())
		panic("")
	}

	batFlip, err = flipper.NewFlipper(batFlipAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create bat flip http contract", "err", err.Error())
		panic("")
	}
	batFlipWS, err = flipper.NewFlipper(batFlipAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create bat flip ws contract", "err", err.Error())
		panic("")
	}

	usdcFlip, err = flipper.NewFlipper(usdcFlipAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create usdc flip http contract", "err", err.Error())
		panic("")
	}
	usdcFlipWS, err = flipper.NewFlipper(usdcFlipAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create usdc flip ws contract", "err", err.Error())
		panic("")
	}

	flap, err = flapper.NewFlapper(flapAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create flap http contract", "err", err.Error())
		panic("")
	}
	flapWS, err = flapper.NewFlapper(flapAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create flap ws contract", "err", err.Error())
		panic("")
	}

	flop, err = flopper.NewFlopper(flopAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create flop http contract", "err", err.Error())
		panic("")
	}
	flopWS, err = flopper.NewFlopper(flopAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create flop ws contract", "err", err.Error())
		panic("")
	}

	log.Info("loaded contracts")

	return Contracts{
		ETHFlip:    ethFlip,
		ETHFlipWS:  ethFlipWS,
		BATFlip:    batFlip,
		BATFlipWS:  batFlipWS,
		USDCFlip:   usdcFlip,
		USDCFlipWS: usdcFlipWS,

		Flap:   flap,
		FlapWS: flapWS,

		Flop:   flop,
		FlopWS: flopWS,
	}
}
