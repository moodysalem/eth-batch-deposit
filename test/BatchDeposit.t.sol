// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {BatchDeposit} from "../src/BatchDeposit.sol";

contract BatchDepositTest is Test {
    BatchDeposit public batchDeposit;

    function setUp() public {
        batchDeposit = new BatchDeposit();
    }
}
