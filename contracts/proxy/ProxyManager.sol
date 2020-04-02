pragma solidity 0.5.17;

import "./Proxy.sol";

/*
    Manages and deploys user's proxies.
    Stores actions and storage contracts.

    Storage and actions can be upgraded
    but have to go through a timelock first.
*/
contract ProxyManager {

    address public owner;
    address public proxyActions;
    address public proxyActionsStorage;

    uint public timelockDuration;
    uint public currentTimelock;

    uint public pendingTimelockDuration;
    address public pendingProxyActions;
    address public pendingProxyActionsStorage;

    mapping(address => address) public proxies;

    event ValuesSubmittedForTimelock(uint pendingTimelockDuration, address pendingProxyActions, address pendingProxyActionsStorage);
    event NewTimelockDuration(uint old, uint updated);
    event NewProxyActions(address old, address updated);
    event NewProxyActionsStorage(address old, address updated);


    modifier onlyOwner {
        require(msg.sender == owner, "ProxyManager / onlyOwner: not allowed");
        _;
    }

    constructor(address _proxyActions, address _proxyActionsStorage) public {
        owner = msg.sender;
        proxyActions = _proxyActions;
        proxyActionsStorage = _proxyActionsStorage;
        timelockDuration = 3 days;

        emit NewTimelockDuration(0, timelockDuration);
        emit NewProxyActions(address(0), _proxyActions);
        emit NewProxyActionsStorage(address(0), _proxyActionsStorage);
    }

    /*
        Submit new values for the timelock.
    */
    function submitTimelockValues(
        uint _pendingTimelockDuration,
        address _pendingProxyActions,
        address _pendingProxyActionsStorage
    ) external onlyOwner {
        require(_pendingTimelockDuration <= 7 days, "ProxyManager / submitTimelockValues: duration too high");

        pendingTimelockDuration = _pendingTimelockDuration;
        pendingProxyActions = _pendingProxyActions;
        pendingProxyActionsStorage = _pendingProxyActionsStorage;

        // solium-disable-next-line security/no-block-members
        currentTimelock = now + timelockDuration;

        emit ValuesSubmittedForTimelock(_pendingTimelockDuration, _pendingProxyActions, _pendingProxyActionsStorage);
    }

    /*
        Implement the values which have
        gone through the timelock.
    */
    function implementTimelockValues() external onlyOwner {
        // solium-disable-next-line security/no-block-members
        require(now > currentTimelock, "ProxyManager / implementTimelockValues: timelock not over");

        if(pendingTimelockDuration != 0) {
            emit NewTimelockDuration(timelockDuration, pendingTimelockDuration);
            timelockDuration = pendingTimelockDuration;
            pendingTimelockDuration = 0;
        }

        if(pendingProxyActions != address(0)) {
            emit NewProxyActions(proxyActions, pendingProxyActions);
            proxyActions = pendingProxyActions;
            pendingProxyActions = address(0);
        }

        if(pendingProxyActionsStorage != address(0)) {
            emit NewProxyActionsStorage(proxyActionsStorage, pendingProxyActionsStorage);
            proxyActionsStorage = pendingProxyActionsStorage;
            pendingProxyActionsStorage = address(0);
        }

        currentTimelock = 0;
    }

    /*
        Deploy a proxy for a user
        and initialize it.
    */
    function deploy() external {
        require(proxies[msg.sender] == address(0), "ProxyManager / deploy: already deployed");
        address newProxy = address(new Proxy(msg.sender));
        proxies[msg.sender] = newProxy;
        IProxyActions(newProxy).setup();
    }
}