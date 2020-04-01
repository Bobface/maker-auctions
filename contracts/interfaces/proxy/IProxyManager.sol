pragma solidity 0.5.17;

interface IProxyManager {
    function proxyActions() external view returns (address);
    function proxyActionsStorage() external view returns (address);
}
