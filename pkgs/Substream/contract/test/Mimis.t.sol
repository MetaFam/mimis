// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.13;

import { Test} from "forge-std/Test.sol";
import { Mimis } from "../src/Mimis.sol";

contract MimisTest is Test {
    Mimis public mimis;

    function setUp() public {
        mimis = new Mimis();
    }

    function test_Increment() public {
        mimis.increment();
        assertEq(mimis.number(), 1);
    }

    function testFuzz_SetNumber(uint256 x) public {
        mimis.setNumber(x);
        assertEq(mimis.number(), x);
    }
}
