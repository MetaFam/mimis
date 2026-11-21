# Contract: Published documents

This is the public interface of this feature. Anyone holding an Update's CID can read these documents from IPFS without the local graph. They are implemented in `src/lib/updates.ts` (types, typed data, encoding) and `src/lib/mst.ts` (index trees), so the same code serves the browser, the server, and the rebuild reader.

## Common rules

- **Codec**: DAG-CBOR (`0x71`), CIDv1, sha2-256. Each document's CID is computed locally and compared with the one Kubo returns, throwing on a mismatch.
- **UUIDs**: canonical lowercase 36-character strings.
- **Links**: every field typed `CID` below is a CID link (CBOR tag 42), never a string. The signed typed data is the only place CIDs appear as strings (base32).
- **Absent fields**: left out, never `null` and never an empty array. DAG-CBOR forbids `undefined`, and omitting gives each version a single encoding.
- **Entry order**: each entry array is sorted by its key (`uuid`, `target`, or `tombstone`), with UTF-8 byte order.
- **Tombstones**: `{ tombstone: <key> }` records that the entry with that key, published in an earlier version, no longer exists. An array never holds an entry and a tombstone with the same key.
- **Replacement**: an entry whose key was published in an earlier version replaces that entry. This is how an edit, such as a renamed link or a mount's new order, is published.
- **Size**: every block is at most 1,048,576 bytes. A version that would be larger is published as a chain of versions in the same Update, each naming the one before as `previous`. Entries are split in key order, and only the last link is indexed or targeted (see “Version chains” in [data-model.md](../data-model.md#version-chains-fr-032)).

## `Update`

```ts
interface Update {
  device: string          // the publishing Device's uuid
  sequence: number        // 1 for a device's first Update
  spots: CID              // MST root: Spot uuid → Spot version
  contents: CID           // MST root: Content uuid → Content version
  previous?: CID          // the device's prior Update; absent iff sequence is 1
  signature: Uint8Array   // 65 bytes: r ‖ s ‖ v, EIP-712 over the typed data below
  createdAt: string       // ISO 8601; unsigned, informational
  comment?: string        // unsigned, informational; absent if none was given
}
```

### Signed typed data

```ts
{
  domain: { name: 'Mïmis Graph', version: '1' },
  primaryType: 'Update',
  types: { Update: [
    { name: 'device', type: 'string' },
    { name: 'sequence', type: 'uint64' },
    { name: 'spots', type: 'string' },
    { name: 'contents', type: 'string' },
    { name: 'previous', type: 'string' },
  ] },
  message: {
    device, sequence: BigInt(sequence),
    spots: spots.toString(), contents: contents.toString(),
    previous: previous?.toString() ?? '',
  },
}
```

- **Author**: `recoverTypedDataAddress({ ...typedData, signature })` from viem.
- **Digest**: `hashTypedData(typedData)`. Updates with equal digests are the same Update (FR-026).
- **Malformed**: a missing or mistyped signed field, a `signature` that isn't 65 bytes, a `sequence` that isn't a positive safe integer, `previous` present with `sequence` 1 or absent with `sequence` > 1, or a recovery error.

## MST node (`spots`, `contents`)

This is atproto's repository MST, version 3: <https://atproto.com/specs/repository#mst-structure>.

```ts
interface Node {
  l: CID | null                    // subtree of keys before e[0]
  e: Array<{
    p: number                      // bytes shared with the previous entry's key
    k: Uint8Array                  // the rest of the key (UTF-8)
    v: CID                         // the Spot or Content version
    t: CID | null                  // subtree of keys between this entry and the next
  }>
}
```

- **Key**: the Spot's or Content's uuid.
- **Layer**: `floor(leadingZeroBits(sha256(utf8(key))) / 2)`, so fanout 4.
- **Empty tree**: `{ l: null, e: [] }`.
- **Scope**: a tree holds only its own Update's entries. Which versions get an entry is in [data-model.md](../data-model.md#index-membership).

## `Spot` version

```ts
interface Spot {
  uuid: string
  previous?: CID                   // this Spot's prior version; absent for its first
  root?: true                      // only on the user's root's first version (the first link, if chained)
  contains?: Array<
    | { uuid: string, path: string, target: CID }   // uuid: the link's own (the CONTAINS edge's)
    | { tombstone: string }                          // a link uuid
  >
  mounts?: Array<
    | { target: string, creator?: string, order: number }  // creator: 0x… lowercase, only outside the user's tree
    | { tombstone: string }                                  // a target Spot uuid
  >                                                          // a Spot mounts a given target at most once
  contents?: Array<
    | { uuid: string, order: number, type: string }  // a Content uuid
    | { tombstone: string }                          // a Content uuid
  >
}
```

- A version lists only entries that changed since `previous`. A version with none is valid only as a Spot's first, such as a new empty Spot.
- `contains[].target` is the child's version when the entry was written. Readers find the child's latest version by its `uuid`, read from that target (FR-011).
- `path` is published exactly as it is stored, in any script, and including `/`.

## `Content` version

```ts
interface Content {
  uuid: string
  previous?: CID
  blobs?: Array<
    | { uuid: string, cid: CID, size: number, type: string }  // uuid: the representation's (the IS edge's)
    | { tombstone: string }                                     // a representation uuid
  >
}
```

- A Content has a single type, and different types are separate Contents (FR-031). Every `blobs` entry's `type` is that type, and a reader rejects a Content whose entries disagree.
- `blobs[].cid` links the file data already in Kubo from upload. It isn't stored again.

## Reading (FR-018)

1. **Find the root**: follow `previous` from the given Update to sequence 1. That Update's `spots` tree has exactly one entry. Following `previous` from its version back to the first version must reach one with `root: true`.
2. **Latest version of a Spot or Content** with a given uuid: look the uuid up in each Update's matching tree, newest first, and take the first hit. With no hit, the version a link points at is the latest.
3. **Current state**: fold versions from the first (no `previous`) to the latest. An entry sets its key, and a tombstone deletes it.
4. **Children**: a Spot's children are its current `contains` entries, each resolved by step 2 from the uuid in its `target`.
