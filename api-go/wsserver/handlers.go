package wsserver

import (
	"encoding/json"
	"sort"

	"../parsers/flapparser"
	"../parsers/flipparser"
	"../parsers/flopparser"
	"github.com/mohae/deepcopy"
)

func parserChannelListener() {
	for {
		select {
		case s := <-FlipETHChan:
			handleFlipUpdate(s, "ETH")
		case s := <-FlipBATChan:
			handleFlipUpdate(s, "BAT")
		case s := <-FlipUSDCChan:
			handleFlipUpdate(s, "USDC")
		case s := <-FlapChan:
			handleFlapUpdate(s)
		case s := <-FlopChan:
			handleFlopUpdate(s)
		}
	}
}

func handleFlipUpdate(state flipparser.State, token string) {
	stateLock.Lock()
	flipStates[token] = state
	stateLock.Unlock()
	hub.broadcast <- flipStateToMsg(token)
}

func flipStateToMsg(token string) []byte {

	stateLock.Lock()
	state := deepcopy.Copy(flipStates[token]).(flipparser.State)
	stateLock.Unlock()

	ids := []uint64{}
	for k := range state.Histories {
		ids = append(ids, k)
	}
	sort.Slice(ids, func(i, j int) bool {
		return ids[i] > ids[j]
	})

	histories := make(map[uint64]flipparser.History)
	for i, v := range ids {
		if i == historyLength {
			break
		}

		histories[v] = state.Histories[v]
	}

	type content struct {
		Token     string                        `json:"token"`
		Auctions  map[uint64]flipparser.Auction `json:"auctions"`
		Histories map[uint64]flipparser.History `json:"histories"`
	}

	send := struct {
		Topic   string  `json:"topic"`
		Content content `json:"content"`
	}{
		Topic: "flip",
		Content: content{
			Token:     token,
			Auctions:  state.Auctions,
			Histories: histories,
		},
	}

	b, err := json.Marshal(send)
	if err != nil {
		log.Crit("could not marshal flip state", "err", err.Error())
		panic("")
	}

	return b
}

func handleFlapUpdate(state flapparser.State) {
	stateLock.Lock()
	flapState = state
	stateLock.Unlock()

	hub.broadcast <- flapStateToMsg()
}

func flapStateToMsg() []byte {

	stateLock.Lock()
	state := deepcopy.Copy(flapState).(flapparser.State)
	stateLock.Unlock()

	ids := []uint64{}
	for k := range state.Histories {
		ids = append(ids, k)
	}
	sort.Slice(ids, func(i, j int) bool {
		return ids[i] > ids[j]
	})

	histories := make(map[uint64]flapparser.History)
	for i, v := range ids {
		if i == historyLength {
			break
		}

		histories[v] = state.Histories[v]
	}

	type content struct {
		Auctions  map[uint64]flapparser.Auction `json:"auctions"`
		Histories map[uint64]flapparser.History `json:"histories"`
	}

	send := struct {
		Topic   string  `json:"topic"`
		Content content `json:"content"`
	}{
		Topic: "flap",
		Content: content{
			Auctions:  state.Auctions,
			Histories: histories,
		},
	}

	b, err := json.Marshal(send)
	if err != nil {
		log.Crit("could not marshal flap state", "err", err.Error())
		panic("")
	}

	return b
}

func handleFlopUpdate(state flopparser.State) {
	stateLock.Lock()
	flopState = state
	stateLock.Unlock()

	hub.broadcast <- flopStateToMsg()
}

func flopStateToMsg() []byte {

	stateLock.Lock()
	state := deepcopy.Copy(flopState).(flopparser.State)
	stateLock.Unlock()

	ids := []uint64{}
	for k := range state.Histories {
		ids = append(ids, k)
	}
	sort.Slice(ids, func(i, j int) bool {
		return ids[i] > ids[j]
	})

	histories := make(map[uint64]flopparser.History)
	for i, v := range ids {
		if i == historyLength {
			break
		}

		histories[v] = state.Histories[v]
	}

	type content struct {
		Auctions  map[uint64]flopparser.Auction `json:"auctions"`
		Histories map[uint64]flopparser.History `json:"histories"`
	}

	send := struct {
		Topic   string  `json:"topic"`
		Content content `json:"content"`
	}{
		Topic: "flop",
		Content: content{
			Auctions:  state.Auctions,
			Histories: histories,
		},
	}

	b, err := json.Marshal(send)
	if err != nil {
		log.Crit("could not marshal flop state", "err", err.Error())
		panic("")
	}

	return b
}
