package wsserver

import (
	"encoding/json"
	"sort"
	"strings"

	"../parsers/flapparser"
	"../parsers/flipparser"
	"../parsers/flopparser"
	"../util"
	"github.com/mohae/deepcopy"
)

func handleIncomingMessage(c *Client, b []byte) {
	topic := struct {
		Topic string `json:"topic"`
	}{}

	err := json.Unmarshal(b, &topic)
	if err != nil {
		log.Error("could not unmarshal client request", "err", err.Error())
		return
	}

	log.Info("received request", "topic", topic.Topic)
	if strings.Compare(topic.Topic, "flipHistory") == 0 {
		handleFlipHistoryRequest(c, b)
	} else if strings.Compare(topic.Topic, "flapHistory") == 0 {
		handleFlapHistoryRequest(c, b)
	} else if strings.Compare(topic.Topic, "flopHistory") == 0 {
		handleFlopHistoryRequest(c, b)
	} else {
		log.Error("unknown request topic", "topic", topic.Topic)
	}
}

func handleFlipHistoryRequest(c *Client, b []byte) {
	type content struct {
		Token  string `json:"token"`
		LastID uint64 `json:"lastID"`
	}

	request := struct {
		Content content `json:"content"`
	}{}

	err := json.Unmarshal(b, &request)
	if err != nil {
		log.Error("could not unmarshal flipHistory request", "err", err.Error())
		return
	}

	stateLock.Lock()
	stateElem, ok := flipStates[request.Content.Token]
	if !ok {
		log.Error("unknown token in flipHistory request", "token", request.Content.Token)
		stateLock.Unlock()
		return
	}
	state := deepcopy.Copy(stateElem).(flipparser.State)
	stateLock.Unlock()

	ids := []uint64{}
	for k := range state.Histories {
		ids = append(ids, k)
	}
	ids = util.FilterUint64(ids, func(index int, elem uint64) bool { return elem < request.Content.LastID })
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

	type responseContent struct {
		Token     string                        `json:"token"`
		Histories map[uint64]flipparser.History `json:"histories"`
	}

	send := struct {
		Topic   string          `json:"topic"`
		Content responseContent `json:"content"`
	}{
		Topic: "flipHistory",
		Content: responseContent{
			Token:     request.Content.Token,
			Histories: histories,
		},
	}

	r, err := json.Marshal(send)
	if err != nil {
		log.Crit("could not marshal flip history response", "err", err.Error())
		panic("")
	}

	c.send <- r
}

func handleFlapHistoryRequest(c *Client, b []byte) {
	type content struct {
		LastID uint64 `json:"lastID"`
	}

	request := struct {
		Content content `json:"content"`
	}{}

	err := json.Unmarshal(b, &request)
	if err != nil {
		log.Error("could not unmarshal flapHistory request", "err", err.Error())
		return
	}

	stateLock.Lock()
	state := deepcopy.Copy(flapState).(flapparser.State)
	stateLock.Unlock()

	ids := []uint64{}
	for k := range state.Histories {
		ids = append(ids, k)
	}
	ids = util.FilterUint64(ids, func(index int, elem uint64) bool { return elem < request.Content.LastID })
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

	type responseContent struct {
		Histories map[uint64]flapparser.History `json:"histories"`
	}

	send := struct {
		Topic   string          `json:"topic"`
		Content responseContent `json:"content"`
	}{
		Topic: "flapHistory",
		Content: responseContent{
			Histories: histories,
		},
	}

	r, err := json.Marshal(send)
	if err != nil {
		log.Crit("could not marshal flap history response", "err", err.Error())
		panic("")
	}

	c.send <- r
}

func handleFlopHistoryRequest(c *Client, b []byte) {
	type content struct {
		LastID uint64 `json:"lastID"`
	}

	request := struct {
		Content content `json:"content"`
	}{}

	err := json.Unmarshal(b, &request)
	if err != nil {
		log.Error("could not unmarshal flopHistory request", "err", err.Error())
		return
	}

	stateLock.Lock()
	state := deepcopy.Copy(flopState).(flopparser.State)
	stateLock.Unlock()

	ids := []uint64{}
	for k := range state.Histories {
		ids = append(ids, k)
	}
	ids = util.FilterUint64(ids, func(index int, elem uint64) bool { return elem < request.Content.LastID })
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

	type responseContent struct {
		Histories map[uint64]flopparser.History `json:"histories"`
	}

	send := struct {
		Topic   string          `json:"topic"`
		Content responseContent `json:"content"`
	}{
		Topic: "flopHistory",
		Content: responseContent{
			Histories: histories,
		},
	}

	r, err := json.Marshal(send)
	if err != nil {
		log.Crit("could not marshal flop history response", "err", err.Error())
		panic("")
	}

	c.send <- r
}
