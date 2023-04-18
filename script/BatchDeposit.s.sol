// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";

import {BatchDeposit} from "../src/BatchDeposit.sol";

contract BatchDepositScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        BatchDeposit bd = new BatchDeposit();

        vm.stopBroadcast();
    }
}