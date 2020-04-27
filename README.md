<p align="center">
  <img height="350" src="https://raw.githubusercontent.com/Bobface/maker-auctions/master/src/assets/logo/Design2Render1Text.png">
</p>

# Maker Auctions
Official repository for [maker-auctions.io](https://maker-auctions.io)

Maker Auctions provides an interface for the MakerDAO auctions running on the Ethereum blockchain. 

## Dev
#### /api
Contains the Websocket backend serving auction data. The way auctions are stored on-chain requires some amount of parsing and state-keeping which hinders user experience. The backend keeps track of all running auctions and their state.

#### /contracts
Contains the Solidity contract source code including mocks for various parts of the MakerDAO system and surrounding smart contracts.

#### /migrations
Contains truffle migrations for mainnet and local testnet with test auctions (webtest).

#### /scripts
Contains utility scripts
- `webtest.js` deploys a local testnet with test auctions

#### /src
Contains Vue frontend source

#### /test/contracts
Contains truffle contract unit tests
