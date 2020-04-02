pragma solidity 0.5.17;

import "../interfaces/proxy/IProxyManager.sol";
import "../interfaces/proxy/IProxyActions.sol";
import "../interfaces/proxy/IProxyActionsStorage.sol";

/*
    A per-user delegatecall proxy.
    When called with data it delegatecalls into ProxyActions.
    Authentication checks are performed in ProxyActions.
 */
contract Proxy {

    IProxyManager private manager;
    IProxyActionsStorage private store;
    address private owner;

    /*
        Constructor is called by ProxyManager.
        After the constructor is done, ProxyManager will call setup()
        which delegatecalls into the actions contract
    */
    constructor(address _owner) public {
        manager = IProxyManager(msg.sender);
        store = IProxyActionsStorage(manager.proxyActionsStorage());
        owner = _owner;
    }

    /*
        When called with data the current addresses for actions and storage
        are requested from ProxyManager. Afterwards a delegatecall is performed
        into the actions contract. In case the delegatecall fails the contract reverts.
    */
    function() external payable {
        if(msg.data.length != 0) {
            address target = manager.proxyActions();
            store = IProxyActionsStorage(manager.proxyActionsStorage());

            // solium-disable-next-line security/no-inline-assembly
            assembly {
                calldatacopy(0, 0, calldatasize())
                let result := delegatecall(gas, target, 0, calldatasize(), 0, 0)
                returndatacopy(0, 0, returndatasize())
                switch result
                case 0 { revert(0, returndatasize()) }
                default { return (0, returndatasize()) }
            }
        }
    }
}