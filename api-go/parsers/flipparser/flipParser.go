package flipparser

import (
	"encoding/json"
	"fmt"

	db "../../DB"
	"../../contracts/flipper"
	"github.com/inconshreveable/log15"
)

type state struct {
}

// FlipParser defines a flip parser
type FlipParser struct {
	log log15.Logger

	db           db.DB
	token        string
	contractHTTP *flipper.Flipper
	contractWS   *flipper.Flipper

	state state
}

// New creates a new flip parser instance
func New(
	token string,
	contractHTTP *flipper.Flipper,
	contractWS *flipper.Flipper,
) *FlipParser {

	// Init db

	return &FlipParser{
		log:          log15.New("module", fmt.Sprintf("flip/%s", token)),
		db:           db.New(fmt.Sprintf("flip_%s", token)),
		token:        token,
		contractHTTP: contractHTTP,
		contractWS:   contractWS,
	}
}

// Run starts the main execution routine
func (p *FlipParser) Run() {
	// Init state
	dbContent := p.db.Read()
	err := json.Unmarshal([]byte(dbContent), &p.state)
	if err != nil {
		p.log.Info("could not parse db. creating default content")
		p.state = state{
			// todo
		}
	}
}
