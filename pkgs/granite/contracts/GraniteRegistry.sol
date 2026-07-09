// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// The durable public map from publisher identity to latest Update root.
/// Anyone may publish under exactly their own address; no admin, no
/// deletion — a publisher moves on by publishing a new root.
contract GraniteRegistry {
  mapping(address => bytes) public latest;

  event Published(address indexed publisher, bytes root);

  function publish(bytes calldata root) external {
    latest[msg.sender] = root;
    emit Published(msg.sender, root);
  }
}
