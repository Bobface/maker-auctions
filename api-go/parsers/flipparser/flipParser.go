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

	"../../contracts"
	"../../db"
	"../../eth"
	"../../global"
	"../../util"
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

// KickEvent defines a kick event
type KickEvent struct {
	ID       uint64 `json:"id"`
	Lot      string `json:"lot"`
	Bid      string `json:"bid"`
	Tab      string `json:"tab"`
	Usr      string `json:"usr"`
	Gal      string `json:"gal"`
	BlockNum uint64 `json:"blockNum"`
	TxIndex  uint64 `json:"txIndex"`
}

// BidEvent defines a bid event
type BidEvent struct {
	ID       uint64 `json:"id"`
	Lot      string `json:"lot"`
	Bid      string `json:"bid"`
	Usr      string `json:"usr"`
	BlockNum uint64 `json:"blockNum"`
	TxIndex  uint64 `json:"txIndex"`
}

// TTLEvent defines a ttl change
type TTLEvent struct {
	TTL      string `json:"ttl"`
	BlockNum uint64 `json:"blockNum"`
	TxIndex  uint64 `json:"txIndex"`
}

// TAUEvent defines a tau change
type TAUEvent struct {
	TAU      string `json:"tau"`
	BlockNum uint64 `json:"blockNum"`
	TxIndex  uint64 `json:"txIndex"`
}

// Auction defines an auction
type Auction struct {
	ID    uint64 `json:"id"`
	Phase string `json:"phase"`
	Lot   string `json:"lot"`
	Bid   string `json:"bid"`
	Tab   string `json:"tab"`
	Guy   string `json:"guy"`
	Tic   uint64 `json:"tic"`
	End   uint64 `json:"end"`
	Usr   string `json:"usr"`
	Gal   string `json:"gal"`
}

// History defines an auction history
type History struct {
	ID  uint64 `json:"id"`
	Lot string `json:"lot"`
	Bid string `json:"bid"`
	Tab string `json:"tab"`
	Guy string `json:"guy"`
	End uint64 `json:"end"`
}

// State defines the state of the flip parser
type State struct {
	LastBlock uint64 `json:"lastBlock"`

	Auctions  map[uint64]Auction `json:"auctions"`
	Histories map[uint64]History `json:"histories"`

	KickEvents    map[uint64]KickEvent `json:"kickEvents"`
	LastBidEvents map[uint64]BidEvent  `json:"bidEvents"`

	TTLs []TTLEvent `json:"ttls"`
	TAUs []TAUEvent `json:"taus"`
}

// FlipParser defines a flip parser
type FlipParser struct {
	log log15.Logger

	db            db.DB
	token         string
	isInitialized bool
	startBlockNum *big.Int
	contract      contracts.FlipContract
	savedStates   []State
	state         State

	stateChan chan State
	kickChan  chan KickEvent
}

// New creates a new flip parser instance
func New(
	token string,
	startBlockNum *big.Int,
	contract contracts.FlipContract,
	stateChan chan State,
	kickChan chan KickEvent,
) *FlipParser {
	return &FlipParser{
		log:           log15.New("module", fmt.Sprintf("flip/%s", token)),
		db:            db.New(fmt.Sprintf("flip_%s", token)),
		token:         token,
		isInitialized: false,
		contract:      contract,
		startBlockNum: startBlockNum,
		savedStates:   []State{},

		stateChan: stateChan,
		kickChan:  kickChan,
	}
}

// Run starts the main execution routine
func (p *FlipParser) Run() {
	// Init state from disk
	dbContent := p.db.Read()
	err := json.Unmarshal([]byte(dbContent), &p.state)
	if err != nil {
		p.log.Info("could not parse db. creating default content")
		p.state = State{

			Auctions:  make(map[uint64]Auction),
			Histories: make(map[uint64]History),

			KickEvents:    make(map[uint64]KickEvent),
			LastBidEvents: make(map[uint64]BidEvent),

			TTLs: []TTLEvent{
				TTLEvent{
					TTL:      "10800",
					BlockNum: 0,
					TxIndex:  0,
				},
			},
			TAUs: []TAUEvent{
				TAUEvent{
					TAU:      "172800",
					BlockNum: 0,
					TxIndex:  0,
				},
			},
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

	stateCpy := deepcopy.Copy(p.state).(State)

	blockNum := blockNumBig.Uint64()
	var startParseBlock uint64
	var endParseBlock uint64

	if blockNum > p.state.LastBlock {
		startParseBlock = p.state.LastBlock + 1
		endParseBlock = blockNum
	} else {
		if blockNum != p.startBlockNum.Uint64() {
			// Chain reorg. Revert state to 1 block before reorg
			p.log.Info("chain reorg detected", "old", p.state.LastBlock, "new", blockNum)
			p.revertState(blockNum)
		}

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

	p.updateAuctionPhases()
	p.state.LastBlock = endParseBlock
	p.isInitialized = true
	p.saveState()
	p.stateChan <- deepcopy.Copy(p.state).(State)
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

	updates := []uint64{}
	deals := []uint64{}
	for _, ev := range events {
		topic := hex.EncodeToString(ev.Topics[0].Bytes())[0:8]

		if strings.Compare(topic, topicKick) == 0 {
			updates = append(updates, p.parseKickEvent(ev))
		} else if strings.Compare(topic, topicTend) == 0 {
			updates = append(updates, p.parseTendOrDentEvent(ev))
		} else if strings.Compare(topic, topicDent) == 0 {
			updates = append(updates, p.parseTendOrDentEvent(ev))
		} else if strings.Compare(topic, topicDeal) == 0 {
			deals = append(deals, p.parseDealEvent(ev))
		} else if strings.Compare(topic, topicFile) == 0 {
			p.parseFileEvent(ev)
		}
	}

	updates = util.FilterUint64(updates, func(index int, elem uint64) bool {
		return util.IndexOfUint64(updates, elem) == index && util.IndexOfUint64(deals, elem) == -1
	})

	deals = util.FilterUint64(deals, func(index int, elem uint64) bool {
		return util.IndexOfUint64(deals, elem) == index
	})

	err = p.updateAuctions(updates)
	if err != nil {
		return err
	}

	err = p.makeAuctionsHistory(deals)
	if err != nil {
		return err
	}

	return nil
}

func (p *FlipParser) updateAuctions(ids []uint64) error {
	maxUpdates := 100
	for i := 0; i < len(ids); i += maxUpdates {

		ch := make(chan error)
		for j := 0; j < maxUpdates && i+j < len(ids); j++ {
			id := ids[i+j]
			go func() { ch <- p.updateAuction(uint64(id)) }()
		}

		var err error = nil
		for j := 0; j < maxUpdates && i+j < len(ids); j++ {
			e := <-ch
			if e != nil {
				err = e
			}
		}

		if err != nil {
			return err
		}
	}

	return nil
}

func (p *FlipParser) updateAuction(id uint64) error {
	p.log.Info("updating auction", "id", id)

	auc, err := p.contract.ContractWS.Bids(nil, new(big.Int).SetUint64(id))
	if err != nil {
		return fmt.Errorf("failed to update auction %d: %s", id, err.Error())
	}

	a := Auction{
		Lot: auc.Lot.String(),
		Bid: auc.Bid.String(),
		Tab: auc.Tab.String(),
		Guy: auc.Guy.String(),
		Tic: auc.Tic.Uint64(),
		End: auc.End.Uint64(),
		Usr: auc.Usr.String(),
		Gal: auc.Gal.String(),
	}

	a.Phase = p.makeAuctionPhase(a)
	p.state.Auctions[id] = a

	return nil
}

func (p *FlipParser) makeAuctionsHistory(ids []uint64) error {
	maxUpdates := 100
	for i := 0; i < len(ids); i += maxUpdates {

		ch := make(chan error)
		for j := 0; j < maxUpdates && i+j < len(ids); j++ {
			id := ids[i+j]
			go func() { ch <- p.makeAuctionHistory(uint64(id)) }()
		}

		var err error = nil
		for j := 0; j < maxUpdates && i+j < len(ids); j++ {
			e := <-ch
			if e != nil {
				err = e
			}
		}

		if err != nil {
			return err
		}
	}

	return nil
}

func (p *FlipParser) makeAuctionHistory(id uint64) error {
	p.log.Info("making history", "id", id)

	kickEvent, ok := p.state.KickEvents[id]
	if !ok {
		panic(fmt.Sprintf("have no kick event for auction %d", id))
	}
	kickBlock := kickEvent.BlockNum
	kickTxIndex := kickEvent.TxIndex

	lastBidEvent, ok := p.state.LastBidEvents[id]
	if !ok {
		panic(fmt.Sprintf("have no last bid event for auction %d", id))
	}
	lastBidEventBlock := lastBidEvent.BlockNum
	lastBidEventTxIndex := lastBidEvent.TxIndex

	tau := p.getTAUAtTx(kickBlock, kickTxIndex)
	ttl := p.getTTLAtTx(lastBidEventBlock, lastBidEventTxIndex)

	tauBlock, err := eth.GetWSClient().BlockByNumber(context.Background(), new(big.Int).SetUint64(kickBlock))
	if err != nil {
		return fmt.Errorf("could not request tau block: %s", err.Error())
	}
	tauTS := new(big.Int).SetUint64(tauBlock.Header().Time)

	ttlBlock, err := eth.GetWSClient().BlockByNumber(context.Background(), new(big.Int).SetUint64(lastBidEventBlock))
	if err != nil {
		return fmt.Errorf("could not request ttl block timestamp: %s", err.Error())
	}
	ttlTS := new(big.Int).SetUint64(ttlBlock.Header().Time)

	var end *big.Int
	if new(big.Int).Add(tauTS, tau).Cmp(new(big.Int).Add(ttlTS, ttl)) < 0 {
		end = new(big.Int).Add(tauTS, tau)
	} else {
		end = new(big.Int).Add(ttlTS, ttl)
	}

	p.state.Histories[id] = History{
		ID:  id,
		Lot: lastBidEvent.Lot,
		Bid: lastBidEvent.Bid,
		Tab: kickEvent.Tab,
		Guy: lastBidEvent.Usr,
		End: end.Uint64(),
	}

	delete(p.state.Auctions, id)
	delete(p.state.LastBidEvents, id)
	delete(p.state.KickEvents, id)

	return nil
}

func (p *FlipParser) getEventsInBlocks(startBlock uint64, endBlock uint64) ([]types.Log, error) {

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

	parsed := KickEvent{
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

	if p.isInitialized {
		p.kickChan <- parsed
	}

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

	parsed := BidEvent{
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
		p.state.TTLs = append(p.state.TTLs, TTLEvent{
			TTL:      valueBig.String(),
			BlockNum: event.BlockNumber,
			TxIndex:  uint64(event.TxIndex),
		})
	} else if strings.Compare(what, fileTTL) == 0 {
		p.state.TAUs = append(p.state.TAUs, TAUEvent{
			TAU:      valueBig.String(),
			BlockNum: event.BlockNumber,
			TxIndex:  uint64(event.TxIndex),
		})
	}
}

func (p *FlipParser) updateAuctionPhases() {
	for k := range p.state.Auctions {
		auc := p.state.Auctions[k]
		auc.Phase = p.makeAuctionPhase(auc)
		p.state.Auctions[k] = auc
	}
}

func (p *FlipParser) makeAuctionPhase(auc Auction) string {
	phase := "DAI"
	if strings.Compare(auc.Bid, auc.Tab) == 0 {
		phase = "GEM"
	}

	currentTS := uint64(time.Now().Unix())
	if auc.End == 0 {
		phase = "DEL"
	} else if auc.Tic != 0 && (auc.End < currentTS || auc.Tic < currentTS) {
		phase = "FIN"
	} else if auc.Tic == 0 && auc.End < currentTS {
		phase = "RES"
	}

	return phase
}

func (p *FlipParser) saveState() {
	lastBlock := p.state.LastBlock
	filtered := []State{}

	for i, s := range p.savedStates {
		if s.LastBlock < lastBlock && s.LastBlock+10 >= lastBlock {
			filtered = append(filtered, p.savedStates[i])
		}
	}

	filtered = append(filtered, deepcopy.Copy(p.state).(State))
	p.savedStates = filtered

	p.db.WriteJSON(p.state)
}

func (p *FlipParser) revertState(blockNum uint64) {
	for i, s := range p.savedStates {
		if s.LastBlock == blockNum-1 {
			p.log.Info("reverting state", "to", s.LastBlock)
			p.state = deepcopy.Copy(p.savedStates[i]).(State)
			return
		}
	}

	p.log.Crit("could not revert state", "block", p.state.LastBlock, "revert", blockNum)
	panic("")
}

func (p *FlipParser) getTTLAtTx(blockNum uint64, txIndex uint64) *big.Int {
	bestTTL := new(big.Int).SetInt64(0)
	bestBlockNum := -1
	bestTxIndex := -1
	for _, v := range p.state.TTLs {
		if v.BlockNum < blockNum ||
			(v.BlockNum == blockNum && v.TxIndex < txIndex) {
			if int(v.BlockNum) > bestBlockNum ||
				(int(v.BlockNum) == bestBlockNum && int(v.TxIndex) > bestTxIndex) {
				var ok bool

				bestTTL, ok = new(big.Int).SetString(v.TTL, 10)
				if !ok {
					panic("could not create big int from ttl")
				}
				bestBlockNum = int(v.BlockNum)
				bestTxIndex = int(v.TxIndex)
			}
		}
	}

	return bestTTL
}

func (p *FlipParser) getTAUAtTx(blockNum uint64, txIndex uint64) *big.Int {
	bestTAU := new(big.Int).SetInt64(0)
	bestBlockNum := -1
	bestTxIndex := -1
	for _, v := range p.state.TAUs {
		if v.BlockNum < blockNum ||
			(v.BlockNum == blockNum && v.TxIndex < txIndex) {
			if int(v.BlockNum) > bestBlockNum ||
				(int(v.BlockNum) == bestBlockNum && int(v.TxIndex) > bestTxIndex) {
				var ok bool

				bestTAU, ok = new(big.Int).SetString(v.TAU, 10)
				if !ok {
					panic("could not create big int from tau")
				}
				bestBlockNum = int(v.BlockNum)
				bestTxIndex = int(v.TxIndex)
			}
		}
	}

	return bestTAU
}
