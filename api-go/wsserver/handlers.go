package wsserver

import (
	"encoding/json"
	"sort"

	"../parsers/flipparser"
)

func parserChannelListener() {
	for {
		select {
		case s := <-flipETHChan:
			handleFlipUpdate(s, "ETH")
		case s := <-flipBATChan:
			handleFlipUpdate(s, "BAT")
		case s := <-flipUSDCChan:
			handleFlipUpdate(s, "USDC")
		}
	}
}

func handleFlipUpdate(state flipparser.State, token string) {
	flipStates[token] = state
	hub.broadcast <- flipStateToMsg(token)
}

func flipStateToMsg(token string) []byte {

	state := flipStates[token]

	ids := make([]uint64, len(state.Histories))
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
		Auctions  map[uint64]flipparser.Auction `json:"auctions"`
		Histories map[uint64]flipparser.History `json:"histories"`
	}

	send := struct {
		Topic   string  `json:"topic"`
		Content content `json:"content"`
	}{
		Topic: "flip",
		Content: content{
			Auctions:  state.Auctions,
			Histories: histories,
		},
	}

	b, err := json.Marshal(send)
	if err != nil {
		log.Crit("could not marshal flip state", "err", err.Error())
	}

	return b
}
