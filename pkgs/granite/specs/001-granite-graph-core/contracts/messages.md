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
| `sig` | bytes | EIP-191 signature (65 bytes) — see below |

Maximum encoded size: 1 KiB; larger messages are dropped without decode.

## Signing

`sig` is an EIP-191 `personal_sign` signature by the publisher's key over the
UTF-8 string:

```text
granite:1:<publisher>:<root-cid-string>:<prev-cid-string-or-empty>:<at>
```

CID strings use their canonical base32 CIDv1 text form; `publisher` is the
lowercase hex address. (String-form preimage keeps signatures reproducible
independent of CBOR map ordering.)

## Verification (subscriber MUST, in order)

1. Decode dag-cbor; any shape violation of the table above ⇒ drop.
2. `granite !== 1` ⇒ drop (future versions use a different topic anyway).
3. Recover the EIP-191 signer from `sig` and the reconstructed preimage;
   recovered address ≠ `publisher` ⇒ drop.
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
