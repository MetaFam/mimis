// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.13;

contract Mimis {
    event GraphUpdated (
        string updateCID,
        address graph
    );

    function fireUpdate(string calldata updateCID) public {
        emit GraphUpdated(updateCID, msg.sender);
    }
}
