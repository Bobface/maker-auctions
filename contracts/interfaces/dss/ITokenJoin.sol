pragma solidity 0.5.17;

interface ITokenJoin {
    function join(address usr, uint wad) external;
    function exit(address usr, uint wad) external;
}