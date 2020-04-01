pragma solidity 0.5.17;

interface IETHJoin {
    function join(address usr) external payable;
    function exit(address payable usr, uint wad) external;
}