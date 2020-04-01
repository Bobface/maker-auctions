pragma solidity 0.5.17;

import "../dss/IVat.sol";

import "../dss/IETHJoin.sol";
import "../dss/ITokenJoin.sol";

import "../dss/IFlip.sol";
import "../dss/IFlap.sol";
import "../dss/IFlop.sol";

import "../token/IERC20.sol";

interface IProxyActionsStorage  {

    function vat() external view returns (IVat);
    function flap() external view returns (IFlap);
    function flop() external view returns (IFlop);

    function tokens(bytes32) external view returns (IERC20);
    function decimals(bytes32) external view returns (uint);
    function ilks(bytes32) external view returns (bytes32);
    function tokenJoins(bytes32) external view returns (ITokenJoin);
    function flips(bytes32) external view returns (IFlip);
}