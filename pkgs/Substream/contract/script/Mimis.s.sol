// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script } from "forge-std/Script.sol";
import { Mimis } from "../src/Mimis.sol";

contract MimisScript is Script {
    Mimis public mimis;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        mimis = new Mimis();

        vm.stopBroadcast();
    }
}
