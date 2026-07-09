# Contract: Gossipsub Announcement Messages

The transient broadcast that lets live subscribers learn a new update root
without polling (FR-008, SC-003). Announcements are a convenience layer over
the registry: anything learnable here is eventually learnable there.

## Topic

```text
/granite/1/announce
```

Single global topic; the `1` is the protocol version — breaking payload
changes bump it rather than mutating this schema. Published and subscribed
through Kubo's pubsub RPC (`kubo-rpc-client` `pubsub.publish/subscribe`).

## Payload

dag-cbor encoded map (binary on the wire):

| Field | Type | Rules |
| ----- | ---- | ----- |
| `granite` | int | Protocol version, `1` |
| `publisher` | string | Lowercase 0x address of the publishing key |
| `root` | bytes | CIDv1 bytes of the new Update document |
| `prev` | bytes (optional) | CIDv1 bytes of the prior Update; absent on first publish |
| `at` | int | Unix seconds |
| `sig` | bytes | EIP-712 typed-data signature (65 bytes) — see below |

Maximum encoded size: 1 KiB; larger messages are dropped without decode.

## Signing

`sig` is an EIP-712 typed-data signature by the publisher's key — the
structured fields are signed directly, with no ad-hoc string preimage.

Domain: `{ name: "granite", version: "1" }` (no `chainId` — announcements
are chain-agnostic). Primary type:

```text
Announcement(address publisher,bytes root,bytes prev,uint64 at)
```

`root` and `prev` are the raw CIDv1 bytes; an absent `prev` signs as empty
bytes (`0x`). EIP-712 gives canonical hashing of the fields themselves
(independent of CBOR map ordering), domain separation against cross-protocol
replay, and payloads any Ethereum wallet can render for signing — the same
key and machinery (viem `signTypedData` / `recoverTypedDataAddress`) already
used for the registry.

## Verification (subscriber MUST, in order)

1. Decode dag-cbor; any shape violation of the table above ⇒ drop.
2. `granite !== 1` ⇒ drop (future versions use a different topic anyway).
3. Recover the EIP-712 signer from `sig` over the reconstructed typed data
   (same domain and primary type); recovered address ≠ `publisher` ⇒ drop.
4. Deliver `{ publisher, root, prev, at }` to `follow` handlers.

Drops are logged, never thrown — gossip input is expected to be dirty
(contrast with FR-012's throw-on-malformed for content the reader *chose* to
fetch).

## Consistency with the registry

Announcement and registry may briefly disagree (spec edge case): the
announcement usually arrives before the registry transaction is mined.
Subscribers MAY act on either; both converge on the same latest root. The
cache layer treats a verified announcement as sufficient to mark stacks stale
and repoint `LATEST` (cache-schema.md): spoofing is excluded by signature
verification, and a registry write that never lands only delays convergence —
it cannot corrupt anything, because hydration always re-reads real DAG
content by CID.

## Contract tests

1. Round trip: publish → subscriber receives payload decoding to the exact
   fields published, signature verifies.
2. Tampered `root` ⇒ dropped (recovered signer mismatch).
3. Wrong-shape payload ⇒ dropped without throwing.
4. First-publish announcement omits `prev` and verifies.
