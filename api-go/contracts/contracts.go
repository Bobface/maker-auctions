package contracts

import (
	"encoding/json"
	"io/ioutil"
	"strings"

	"../eth"
	"../global"
	"./flapper"
	"./flipper"
	"./flopper"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/inconshreveable/log15"
)

// FlipContract defines a flip contract
type FlipContract struct {
	Address      common.Address
	ABI          abi.ABI
	ContractHTTP *flipper.Flipper
	ContractWS   *flipper.Flipper
}

// FlapContract defines a flap contract
type FlapContract struct {
	Address      common.Address
	ABI          abi.ABI
	ContractHTTP *flapper.Flapper
	ContractWS   *flapper.Flapper
}

// FlopContract defines a flop contract
type FlopContract struct {
	Address      common.Address
	ABI          abi.ABI
	ContractHTTP *flopper.Flopper
	ContractWS   *flopper.Flopper
}

// Contracts defines the contracts used by the backend
type Contracts struct {
	ETHFlip  FlipContract
	BATFlip  FlipContract
	USDCFlip FlipContract

	Flap FlapContract

	Flop FlopContract
}

// New returns new contracts
func New() Contracts {

	log := log15.New("module", "contracts")

	flipperABI, err := abi.JSON(strings.NewReader(string(flipper.FlipperABI)))
	if err != nil {
		log.Crit("failed to load flip abi", "err", err.Error())
		panic("")
	}

	flapperABI, err := abi.JSON(strings.NewReader(string(flapper.FlapperABI)))
	if err != nil {
		log.Crit("failed to load flap abi", "err", err.Error())
		panic("")
	}

	flopperABI, err := abi.JSON(strings.NewReader(string(flopper.FlopperABI)))
	if err != nil {
		log.Crit("failed to load flop abi", "err", err.Error())
		panic("")
	}

	var ethFlipAddr common.Address
	var batFlipAddr common.Address
	var usdcFlipAddr common.Address
	var flapAddr common.Address
	var flopAddr common.Address

	if global.IsWebtest() {
		b, err := ioutil.ReadFile("../build/webtest/addresses.json")
		if err != nil {
			panic(err)
		}

		addresses := struct {
			ETHFlip  string `json:"ethFlip"`
			BATFlip  string `json:"batFlip"`
			USDCFlip string `json:"usdcFlip"`
			Flap     string `json:"flap"`
			Flop     string `json:"flop"`
		}{}

		err = json.Unmarshal(b, &addresses)
		if err != nil {
			panic(err)
		}

		ethFlipAddr = common.HexToAddress(addresses.ETHFlip)
		batFlipAddr = common.HexToAddress(addresses.BATFlip)
		usdcFlipAddr = common.HexToAddress(addresses.USDCFlip)
		flapAddr = common.HexToAddress(addresses.Flap)
		flopAddr = common.HexToAddress(addresses.Flop)

	} else {
		ethFlipAddr = common.HexToAddress("0xd8a04F5412223F513DC55F839574430f5EC15531")
		batFlipAddr = common.HexToAddress("0xaA745404d55f88C108A28c86abE7b5A1E7817c07")
		usdcFlipAddr = common.HexToAddress("0xE6ed1d09a19Bd335f051d78D5d22dF3bfF2c28B1")
		flapAddr = common.HexToAddress("0xdfE0fb1bE2a52CDBf8FB962D5701d7fd0902db9f")
		flopAddr = common.HexToAddress("0x4D95A049d5B0b7d32058cd3F2163015747522e99")
	}

	var ethFlipHTTP *flipper.Flipper
	var ethFlipWS *flipper.Flipper
	var batFlipHTTP *flipper.Flipper
	var batFlipWS *flipper.Flipper
	var usdcFlipHTTP *flipper.Flipper
	var usdcFlipWS *flipper.Flipper
	var flapHTTP *flapper.Flapper
	var flapWS *flapper.Flapper
	var flopHTTP *flopper.Flopper
	var flopWS *flopper.Flopper

	ethFlipHTTP, err = flipper.NewFlipper(ethFlipAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create eth flip http contract", "err", err.Error())
		panic("")
	}
	ethFlipWS, err = flipper.NewFlipper(ethFlipAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create eth flip ws contract", "err", err.Error())
		panic("")
	}

	batFlipHTTP, err = flipper.NewFlipper(batFlipAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create bat flip http contract", "err", err.Error())
		panic("")
	}
	batFlipWS, err = flipper.NewFlipper(batFlipAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create bat flip ws contract", "err", err.Error())
		panic("")
	}

	usdcFlipHTTP, err = flipper.NewFlipper(usdcFlipAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create usdc flip http contract", "err", err.Error())
		panic("")
	}
	usdcFlipWS, err = flipper.NewFlipper(usdcFlipAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create usdc flip ws contract", "err", err.Error())
		panic("")
	}

	flapHTTP, err = flapper.NewFlapper(flapAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create flap http contract", "err", err.Error())
		panic("")
	}
	flapWS, err = flapper.NewFlapper(flapAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create flap ws contract", "err", err.Error())
		panic("")
	}

	flopHTTP, err = flopper.NewFlopper(flopAddr, eth.GetHTTPClient())
	if err != nil {
		log.Crit("failed to create flop http contract", "err", err.Error())
		panic("")
	}
	flopWS, err = flopper.NewFlopper(flopAddr, eth.GetWSClient())
	if err != nil {
		log.Crit("failed to create flop ws contract", "err", err.Error())
		panic("")
	}

	log.Info("contracts loaded")

	return Contracts{
		ETHFlip: FlipContract{
			Address:      ethFlipAddr,
			ABI:          flipperABI,
			ContractHTTP: ethFlipHTTP,
			ContractWS:   ethFlipWS,
		},
		BATFlip: FlipContract{
			Address:      batFlipAddr,
			ABI:          flipperABI,
			ContractHTTP: batFlipHTTP,
			ContractWS:   batFlipWS,
		},
		USDCFlip: FlipContract{
			Address:      usdcFlipAddr,
			ABI:          flipperABI,
			ContractHTTP: usdcFlipHTTP,
			ContractWS:   usdcFlipWS,
		},

		Flap: FlapContract{
			Address:      flapAddr,
			ABI:          flapperABI,
			ContractHTTP: flapHTTP,
			ContractWS:   flapWS,
		},

		Flop: FlopContract{
			Address:      flopAddr,
			ABI:          flopperABI,
			ContractHTTP: flopHTTP,
			ContractWS:   flopWS,
		},
	}
}
