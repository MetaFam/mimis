# Contract: GraniteRegistry (Ethereum)

The durable public map from publisher identity to latest Update root
(FR-007). Deliberately the smallest thing that satisfies the constitution's
"durable update pointers" role.

## Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GraniteRegistry {
  mapping(address => bytes) public latest;   // full CIDv1 bytes; empty ⇒ never published

  event Published(address indexed publisher, bytes root);

  function publish(bytes calldata root) external {
    latest[msg.sender] = root;
    emit Published(msg.sender, root);
  }
}
```

## Semantics

- **Identity**: `msg.sender` is the publisher — no registration, no admin,
  no ownership surface. Anyone may publish under exactly their own address
  (Principle V).
- **Value**: complete CIDv1 bytes (multibase-less binary form), preserving
  codec/multihash self-description; clients decode with `multiformats`
  `CID.decode`. Clients MUST throw `MalformedDocumentError` on bytes that do
  not decode to a CIDv1 dag-cbor CID.
- **Empty bytes** ⇒ "never published" — surfaced as `undefined` by
  `Granite.latest` (spec US3, scenario 4).
- **No history on-chain**: prior roots are reachable by walking `prev` links
  in the DAG (FR-011); the `Published` event log is a convenience, not an
  authority.
- **No delete/pause/upgrade**: append-only ethos; a publisher "moves on" by
  publishing a new root.

## Deployment

- Development/CI: anvil (foundry), deployed by the integration-test harness
  from bytecode compiled with `solc` ≥ 0.8.24 (contract has zero external
  imports, so `solc --bin --abi` suffices; no framework needed).
- v1 public target: Sepolia; the deployed address ships in documentation and
  is supplied to clients via `GraniteConfig.chain.registry` — never
  hardcoded.

## Contract tests (integration, against anvil)

1. `latest(addr)` is empty before any publish.
2. `publish(root)` stores exactly the bytes sent and emits `Published` with
   the sender and those bytes.
3. A second `publish` overwrites `latest` for the sender only.
4. Two accounts' entries do not interfere.
