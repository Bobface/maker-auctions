package global

import (
	"flag"
	"os"

	"github.com/inconshreveable/log15"
	"github.com/joho/godotenv"
)

var (
	log     log15.Logger
	local   bool
	webtest bool

	infura string

	discord string
)

// IsLocal returns wether we are running in local mode or live
func IsLocal() bool {
	return local
}

// IsWebtest returns wether we are running in webtest mode
func IsWebtest() bool {
	return webtest
}

// GetInfuraKey returns the infura key
func GetInfuraKey() string {
	return infura
}

// GetDiscordKey returns the discord key
func GetDiscordKey() string {
	return discord
}

// Init loads environment files and reads cmd args
func Init() {
	log = log15.New("module", "global")

	flag.BoolVar(&local, "local", false, "local mode")
	flag.BoolVar(&webtest, "webtest", false, "webtest mode")
	flag.Parse()
	log.Info("loaded command-line arguments", "local", local, "webtest", webtest)

	err := godotenv.Load(".env")
	if err != nil {
		log.Crit("failed to load .env", "err", err.Error())
		panic("")
	}

	infura = os.Getenv("INFURA_KEY")
	log.Info("loaded infura key", "token", infura)
	discord = os.Getenv("DISCORD_TOKEN")
	log.Info("loaded discord token", "token", discord)
}
