package flipparser

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/mohae/deepcopy"

	db "../../DB"
	"../../contracts"
	"../../eth"
	"../../global"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/inconshreveable/log15"
)

const (
	topicKick = "c84ce3a1"
	topicTend = "4b43ed12"
	topicDent = "5ff3a382"
	topicDeal = "c959c42b"
	topicFile = "29ae8114"

	fileTTL = "74746c0000000000000000000000000000000000000000000000000000000000"
	fileTAU = "7461750000000000000000000000000000000000000000000000000000000000"
)

// Fields must be exported to be deep-copyable
type kickEvent struct {
	ID       uint64 `json:"id"`
	Lot      string `json:"lot"`
	Bid      string `json:"bid"`
	Tab      string `json:"tab"`
	Usr      string `json:"usr"`
	Gal      string `json:"gal"`
	BlockNum uint64 `json:"blockNum"`
	TxIndex  uint64 `json:"txIndex"`
}

type bidEvent struct {
	ID       uint64 `json:"id"`
	Lot      string `json:"lot"`
	Bid      string `json:"bid"`
	Usr      string `json:"usr"`
	BlockNum uint64 `json:"blockNum"`
	TxIndex  uint64 `json:"txIndex"`
}

type ttlEvent struct {
	TTL      string `json:"ttl"`
	BlockNum uint64 `json:"blockNum"`
	TxIndex  uint64 `json:"txIndex"`
}

type tauEvent struct {
	TAU      string `json:"tau"`
	BlockNum uint64 `json:"blockNum"`
	TxIndex  uint64 `json:"txIndex"`
}

// Fields must be exported to be deep-copyable
type state struct {
	LastID    uint64 `json:"lastID"`
	LastBlock uint64 `json:"lastBlock"`

	KickEvents    map[uint64]kickEvent `json:"kickEvents"`
	LastBidEvents map[uint64]bidEvent  `json:"bidEvents"`

	TTLs []ttlEvent `json:"ttls"`
	TAUs []tauEvent `json:"taus"`
}

// FlipParser defines a flip parser
type FlipParser struct {
	log log15.Logger

	db            db.DB
	token         string
	startBlockNum *big.Int
	contract      contracts.FlipContract
	savedStates   []state
	state         state
}

// New creates a new flip parser instance
func New(
	token string,
	startBlockNum *big.Int,
	contract contracts.FlipContract,
) *FlipParser {

	// Init db

	return &FlipParser{
		log:           log15.New("module", fmt.Sprintf("flip/%s", token)),
		db:            db.New(fmt.Sprintf("flip_%s", token)),
		token:         token,
		contract:      contract,
		startBlockNum: startBlockNum,
		savedStates:   []state{},
	}
}

// Run starts the main execution routine
func (p *FlipParser) Run() {
	// Init state from disk
	dbContent := p.db.Read()
	err := json.Unmarshal([]byte(dbContent), &p.state)
	if err != nil {
		p.log.Info("could not parse db. creating default content")
		p.state = state{
			LastID: 0,

			KickEvents:    make(map[uint64]kickEvent),
			LastBidEvents: make(map[uint64]bidEvent),

			TTLs: []ttlEvent{},
			TAUs: []tauEvent{},
		}
		if global.IsWebtest() {
			p.state.LastBlock = 0
		} else {
			p.state.LastBlock = 8900000 - 1
		}
	}

	// Subscribe to new blocks
	newBlockSubChan := make(chan *types.Header)
	_, err = eth.GetWSClient().SubscribeNewHead(context.Background(), newBlockSubChan)
	if err != nil {
		p.log.Crit("could not subscribe to block headers", "err", err.Error())
		panic("")
	}

	p.onNewBlock(p.startBlockNum)
	// Listen to new blocks
	for {
		select {
		case head := <-newBlockSubChan:
			p.onNewBlock(head.Number)
		}
	}
}

// onNewBlock runs when a new block is received
func (p *FlipParser) onNewBlock(blockNumBig *big.Int) {

	stateCpy := deepcopy.Copy(p.state).(state)

	blockNum := blockNumBig.Uint64()
	var startParseBlock uint64
	var endParseBlock uint64
	if blockNum > p.state.LastBlock {
		startParseBlock = p.state.LastBlock + 1
		endParseBlock = blockNum
	} else {
		// Chain reorg. Revert state to 1 block before reorg
		p.log.Info("chain reorg detected", "old", p.state.LastBlock, "new", blockNum)
		p.revertState(blockNum)

		startParseBlock = blockNum
		endParseBlock = blockNum
	}

	err := p.parseBlockRange(startParseBlock, endParseBlock)
	if err != nil {
		p.log.Error("failed parsing blocks", "from", startParseBlock, "to", endParseBlock, "err", err.Error())
		p.state = stateCpy
		time.Sleep(time.Second * 2)
		p.onNewBlock(blockNumBig)
		return
	}

	// TODO: Updates, save state etc.

	p.state.LastBlock = endParseBlock
	p.saveState()
	/*updateAuctionPhases()

	  blockQueue.shift()
	  state.lastBlock = block.number

	  saveState()
	  db.write(state)
	  wsStateCallback(state)
	  printState()
	  isInitialized = true*/
}

func (p *FlipParser) parseBlockRange(startBlock uint64, endBlock uint64) error {
	// During initial parsing there will be a large range
	// Split it down to maximum of 100k blocks per request
	blockRange := endBlock - startBlock
	if blockRange > 100000 {

		err := p.parseBlockRange(startBlock, startBlock+100000-1)
		if err != nil {
			return err
		}

		err = p.parseBlockRange(startBlock+100000, endBlock)
		if err != nil {
			return err
		}
		return nil
	}

	p.log.Info("parsing blocks", "from", startBlock, "to", endBlock)

	err := p.parseEventsInBlocks(startBlock, endBlock)
	if err != nil {
		return err
	}

	return nil
}

func (p *FlipParser) parseEventsInBlocks(startBlock uint64, endBlock uint64) error {
	events, err := p.getEventsInBlocks(startBlock, endBlock)
	if err != nil {
		blockRange := endBlock - startBlock
		if blockRange == 0 {
			// we cannot reduce blockrange any further
			return fmt.Errorf("failed to parse events: %s", err.Error())
		}

		p.log.Warn("too many events in blocks")

		halfRange := blockRange / 2
		err := p.parseEventsInBlocks(startBlock, startBlock+halfRange)
		if err != nil {
			return err
		}

		err = p.parseEventsInBlocks(startBlock+halfRange+1, endBlock)
		if err != nil {
			return err
		}
	}

	// handle events
	kicks := []uint64{}
	tends := []uint64{}
	dents := []uint64{}
	deals := []uint64{}
	for _, ev := range events {
		topic := hex.EncodeToString(ev.Topics[0].Bytes())[0:8]

		if strings.Compare(topic, topicKick) == 0 {
			kicks = append(kicks, p.parseKickEvent(ev))
		} else if strings.Compare(topic, topicTend) == 0 {
			tends = append(tends, p.parseTendOrDentEvent(ev))
		} else if strings.Compare(topic, topicDent) == 0 {
			dents = append(dents, p.parseTendOrDentEvent(ev))
		} else if strings.Compare(topic, topicDeal) == 0 {
			deals = append(deals, p.parseDealEvent(ev))
		} else if strings.Compare(topic, topicFile) == 0 {
			p.parseFileEvent(ev)
		}
	}

	// CONT HERE

	return nil
}

func (p *FlipParser) getEventsInBlocks(startBlock uint64, endBlock uint64) ([]types.Log, error) {

	p.log.Info("requesting events", "from", startBlock, "to", endBlock)

	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(startBlock)),
		ToBlock:   big.NewInt(int64(endBlock)),
		Addresses: []common.Address{
			p.contract.Address,
		},
	}

	events, err := eth.GetHTTPClient().FilterLogs(context.Background(), query)
	if err != nil {
		return nil, fmt.Errorf("failed to get events: %s", err.Error())
	}
	return events, nil
}

func (p *FlipParser) parseKickEvent(event types.Log) uint64 {

	usr := common.HexToAddress("0x" + hex.EncodeToString(event.Topics[1].Bytes())[24:]).String()
	gal := common.HexToAddress("0x" + hex.EncodeToString(event.Topics[2].Bytes())[24:]).String()

	encodedData := hex.EncodeToString(event.Data)

	idBig, ok := new(big.Int).SetString(encodedData[0:64], 16)
	if !ok {
		panic("failed to parse kick id to big")
	}
	lotBig, ok := new(big.Int).SetString(encodedData[64:128], 16)
	if !ok {
		panic("failed to parse kick lot to big")
	}
	bidBig, ok := new(big.Int).SetString(encodedData[128:192], 16)
	if !ok {
		panic("failed to parse kick bid to big")
	}
	tabBig, ok := new(big.Int).SetString(encodedData[192:256], 16)
	if !ok {
		panic("failed to parse kick tab to big")
	}

	parsed := kickEvent{
		ID:       idBig.Uint64(),
		Lot:      lotBig.String(),
		Bid:      bidBig.String(),
		Tab:      tabBig.String(),
		Usr:      usr,
		Gal:      gal,
		BlockNum: event.BlockNumber,
		TxIndex:  uint64(event.TxIndex),
	}

	p.state.KickEvents[parsed.ID] = parsed
	return parsed.ID
}

func (p *FlipParser) parseTendOrDentEvent(event types.Log) uint64 {

	usr := common.HexToAddress("0x" + hex.EncodeToString(event.Topics[1].Bytes())[24:]).String()
	idHex := hex.EncodeToString(event.Topics[2].Bytes())
	lotHex := hex.EncodeToString(event.Topics[3].Bytes())

	encodedData := hex.EncodeToString(event.Data)

	idBig, ok := new(big.Int).SetString(idHex, 16)
	if !ok {
		panic("failed to parse tend/dent id to big")
	}
	lotBig, ok := new(big.Int).SetString(lotHex, 16)
	if !ok {
		panic("failed to parse tend/dent lot to big")
	}
	bidBig, ok := new(big.Int).SetString(encodedData[8+256:8+256+64], 16)
	if !ok {
		panic("failed to parse tend/dent bid to big")
	}

	parsed := bidEvent{
		ID:       idBig.Uint64(),
		Lot:      lotBig.String(),
		Bid:      bidBig.String(),
		Usr:      usr,
		BlockNum: event.BlockNumber,
		TxIndex:  uint64(event.TxIndex),
	}

	lastEvent, has := p.state.LastBidEvents[parsed.ID]
	if !has ||
		lastEvent.BlockNum < parsed.BlockNum ||
		(lastEvent.BlockNum == parsed.BlockNum && lastEvent.TxIndex < parsed.TxIndex) {
		p.state.LastBidEvents[parsed.ID] = parsed
	}
	return parsed.ID
}

func (p *FlipParser) parseDealEvent(event types.Log) uint64 {

	idHex := hex.EncodeToString(event.Topics[2].Bytes())

	idBig, ok := new(big.Int).SetString(idHex, 16)
	if !ok {
		panic("failed to parse deal id to big")
	}

	return idBig.Uint64()
}

func (p *FlipParser) parseFileEvent(event types.Log) {

	what := hex.EncodeToString(event.Topics[2].Bytes())

	valueHex := hex.EncodeToString(event.Topics[3].Bytes())
	valueBig, ok := new(big.Int).SetString(valueHex, 16)
	if !ok {
		panic("failed to parse file value to big")
	}

	if strings.Compare(what, fileTTL) == 0 {
		p.state.TTLs = append(p.state.TTLs, ttlEvent{
			TTL:      valueBig.String(),
			BlockNum: event.BlockNumber,
			TxIndex:  uint64(event.TxIndex),
		})
	} else if strings.Compare(what, fileTTL) == 0 {
		p.state.TAUs = append(p.state.TAUs, tauEvent{
			TAU:      valueBig.String(),
			BlockNum: event.BlockNumber,
			TxIndex:  uint64(event.TxIndex),
		})
	}
}

func (p *FlipParser) saveState() {
	lastBlock := p.state.LastBlock
	filtered := []state{}

	for i, s := range p.savedStates {
		if s.LastBlock < lastBlock && s.LastBlock+10 >= lastBlock {
			filtered = append(filtered, p.savedStates[i])
		}
	}

	filtered = append(filtered, deepcopy.Copy(p.state).(state))

	p.db.WriteJSON(p.state)
}

func (p *FlipParser) revertState(blockNum uint64) {
	for i, s := range p.savedStates {
		if s.LastBlock == blockNum-1 {
			p.log.Info("reverting state", "to", s.LastBlock)
			p.state = deepcopy.Copy(p.savedStates[i]).(state)
			return
		}
	}

	p.log.Crit("could not revert state", "block", p.state.LastBlock, "revert", blockNum)
	panic("")
}
