pragma solidity 0.5.17;

import "../interfaces/proxy/IProxyActionsStorage.sol";
import "../interfaces/token/IERC20.sol";
import "../interfaces/token/IWETH.sol";
import "../interfaces/dss/IVat.sol";


contract ProxyActions {

    /*
        !! IMPORTANT !!
        - The ordering of variables must not be modified
        - The types of variables must not be modified
        - Existing variables must not be removed
        - New variables must be appended at the end
    */

    // proxyManager is the manager address in Proxy
    address private proxyManager;
    // proxyActionsStorage set by ctor in Proxy
    IProxyActionsStorage private store;

    // owner is the owner address in Proxy
    address public owner;

    uint public version;

    modifier onlyOwner {
        require(msg.sender == owner, "ProxyActions / onlyOwner: not allowed");
        _;
    }

    function setup() external {
        require(msg.sender == proxyManager, "ProxyActions / setup: not allowed");

        version = 1;

        IVat vat = store.vat();
        address daiJoin = address(store.tokenJoins("DAI"));
        address flap = address(store.flap());
        address flop = address(store.flop());

        vat.hope(daiJoin);

        vat.hope(address(store.flips("ETH")));
        vat.hope(address(store.flips("BAT")));
        vat.hope(address(store.flips("USDC")));

        vat.hope(flap);
        vat.hope(flop);

        require(store.tokens("ETH").approve(address(store.tokenJoins("ETH")), uint(-1)));
        require(store.tokens("DAI").approve(daiJoin, uint(-1)));
        require(store.tokens("BAT").approve(address(store.tokenJoins("BAT")), uint(-1)));
        require(store.tokens("USDC").approve(address(store.tokenJoins("USDC")), uint(-1)));

        require(store.tokens("MKR").approve(flap, uint(-1)));
        require(store.tokens("DAI").approve(flop, uint(-1)));
    }

    /*
        FLIP methods
    */

    function flipClaimAndExit(bytes32 what, uint id) external onlyOwner {
        uint claimed = flipClaimInternal(what, id);
        exitInternal(what, owner, claimed);
    }

    function flipClaim(bytes32 what, uint id) external onlyOwner {
        flipClaimInternal(what, id);
    }

    function flipClaimInternal(bytes32 what, uint id) private returns (uint) {
        IFlip flip = store.flips(what);
        require(address(flip) != address(0), "ProxyActions / flipClaimInternal: invalid what");

        uint decimals = store.decimals(what);
        uint beforeBalance = store.vat().gem(store.ilks(what), address(this)) / (10**(18 - decimals));
        flip.deal(id);
        uint afterBalance = store.vat().gem(store.ilks(what), address(this)) / (10**(18 - decimals));

        require(afterBalance >= beforeBalance, "ProxyActions / flipClaimInternal: overflow");
        return afterBalance - beforeBalance;
    }

    function flipReduceLot(bytes32 what, uint id, uint pull, uint bid, uint lot) external onlyOwner {

        // pull: 10**18
        // lot: 10**45

        IFlip flip = store.flips(what);
        require(address(flip) != address(0), "ProxyActions / flipReduceLotInternal: invalid what");

        if(pull > 0) {
            joinInternal("DAI", pull);
        }

        flip.dent(id, lot, bid);
    }

    function flipBidDai(bytes32 what, uint id, uint pull, uint bid, uint lot) external onlyOwner {

        // pull: 10**18
        // lot: 10**45

        IFlip flip = store.flips(what);
        require(address(flip) != address(0), "ProxyActions / flipBidDai: invalid what");

        if(pull > 0) {
            joinInternal("DAI", pull);
        }

        flip.tend(id, lot, bid);
    }

    /*
        FLAP methods
    */

    function flapClaimAndExit(uint id) external onlyOwner {
        uint claimed = flapClaimInternal(id);
        exitInternal("DAI", owner, claimed);
    }

    function flapClaim(uint id) external onlyOwner {
        flapClaimInternal(id);
    }

    function flapClaimInternal(uint id) private returns (uint) {
        // dai is stored as 10**45 in the vat
        uint beforeBalance = store.vat().dai(address(this)) / (10**27);
        store.flap().deal(id);
        uint afterBalance = store.vat().dai(address(this)) / (10**27);

        require(afterBalance >= beforeBalance, "ProxyActions / flapClaimInternal: overflow");
        return afterBalance - beforeBalance;
    }

    function flapBidMkr(uint id, uint pull, uint bid, uint lot) external onlyOwner {

        if(pull > 0) {
            joinInternal("MKR", pull);
        }

        store.flap().tend(id, lot, bid);
    }

    /*
        FLOP methods
    */

    function flopClaimAndExit(uint id) external onlyOwner {
        uint claimed = flopClaimInternal(id);
        exitInternal("MKR", owner, claimed);
    }

    function flopClaim(uint id) external onlyOwner {
        flopClaimInternal(id);
    }

    function flopClaimInternal(uint id) private returns (uint) {
        uint beforeBalance = store.tokens("MKR").balanceOf(address(this));
        store.flop().deal(id);
        uint afterBalance = store.tokens("MKR").balanceOf(address(this));

        require(afterBalance >= beforeBalance, "ProxyActions / flopClaim: overflow");
        return afterBalance - beforeBalance;
    }

    function flopReduceMkr(uint id, uint pull, uint bid, uint lot) external onlyOwner {

        // pull: 10**18
        // bid: 10**45

        if(pull > 0) {
            joinInternal("DAI", pull);
        }

        store.flop().dent(id, lot, bid);
    }

    /*
        JOIN methods
    */

    function join(bytes32 what, uint amount) public payable onlyOwner {
        joinInternal(what, amount);
    }

    function joinInternal(bytes32 what, uint amount) private {
        require(what == bytes32("ETH") || msg.value == 0, "ProxyActions / join: either eth or no value");

        IERC20 token = store.tokens(what);
        if(what == bytes32("ETH")) {
            require(amount == msg.value, "ProxyActions / join: msg.value and amount do not match");
            IWETH(address(token)).deposit.gas(gasleft()).value(msg.value)();
        } else if(what == bytes32("MKR")) {
            require(store.tokens("MKR").transferFrom(owner, address(this), amount), "ProxyActions / join: MKR transfer failed");
            return;
        }

        ITokenJoin tokenJoin = store.tokenJoins(what);
        require(address(tokenJoin) != address(0) && address(token) != address(0), "ProxyActions / join: invalid what");

        if(what != bytes32("ETH")) {
            require(token.transferFrom(owner, address(this), amount), "ProxyActions / joinTokenInternal: token transfer failed");
        }

        tokenJoin.join(address(this), amount);
    }

    /*
        EXIT methods
    */

    function exit(bytes32 what, address receiver, uint amount) public onlyOwner {
        exitInternal(what, receiver, amount);
    }

    function exitInternal(bytes32 what, address receiver, uint amount) private {
        if(what == bytes32("MKR")) {
            store.tokens("MKR").transfer(receiver, amount);
            return;
        }

        ITokenJoin tokenJoin = store.tokenJoins(what);
        require(address(tokenJoin) != address(0), "ProxyActions / exit: invalid what");

        if(what == bytes32("ETH")) {
            tokenJoin.exit(address(this), amount);
            IWETH(address(store.tokens(what))).withdraw(amount);
            address(uint160(receiver)).transfer(amount);
        } else {
            tokenJoin.exit(receiver, amount);
        }
    }
}