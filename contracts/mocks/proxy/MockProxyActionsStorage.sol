pragma solidity 0.5.17;

import "../../proxy/ProxyActionsStorage.sol";

contract MockProxyActionsStorage is ProxyActionsStorage {

    function mockSetVat(address _vat) external {
        vat = IVat(_vat);
    }

    function mockSetFlap(address _flap) external {
        flap = IFlap(_flap);
    }

    function mockSetFlop(address _flop) external {
        flop = IFlop(_flop);
    }

    function mockSetToken(bytes32 what, address _token) external {
        tokens[what] = IERC20(_token);
    }

    function mockSetIlk(bytes32 what, bytes32 ilk) external {
        ilks[what] = ilk;
    }

    function mockSetTokenJoin(bytes32 what, address _tokenJoin) external {
        tokenJoins[what] = ITokenJoin(_tokenJoin);
    }

    function mockSetFlip(bytes32 what, address _flip) external {
        flips[what] = IFlip(_flip);
    }
}