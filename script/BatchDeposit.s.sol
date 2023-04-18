// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";

import {BatchDeposit} from "../src/BatchDeposit.sol";

contract BatchDepositScript is Script {
    function run() public {
        vm.broadcast();

        new BatchDeposit{salt: bytes32(0)}();
    }
}
