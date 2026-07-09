# Data Model: Granite Core Graph

**Date**: 2026-07-09 | **Plan**: [plan.md](./plan.md)

Two layers: the **DAG layer** (source of truth, immutable dag-cbor documents
on IPFS) and the **cache layer** (a TinkerPop property graph derived from the
DAG, disposable). Every cache fact must be re-derivable from the DAG plus the
reader's mount configuration.

## DAG layer (dag-cbor documents)

All documents are dag-cbor, CIDv1, sha2-256. Links are real CIDs (tag 42).
Per the constitution, decoding anything that violates these shapes MUST
throw, identifying the offending CID; only *absence* (a path that names no
edge) is a non-error.

### Node

One document per graph node.

| Field | Type | Rules |
|-------|------|-------|
| `data` | map (optional) | The node's own properties; arbitrary CBOR-encodable values |
| `edges` | map: name → Edge | May be empty; names are non-empty strings, MUST NOT contain `/` (reserved as the path separator) |
| `mounts` | array of NodeMount (optional) | Publisher-side composition — see NodeMount below (FR-014) |

### Edge (inline in `Node.edges`)

| Field | Type | Rules |
|-------|------|-------|
| `props` | map (optional) | Edge properties (the README's "relationships containing the properties of the edge") |
| `child` | CID link | MUST reference a Node document |

Identical subtrees deduplicate automatically — same content, same CID.

### NodeMount (inline in `Node.mounts`, FR-014)

| Field | Type | Rules |
|-------|------|-------|
| `source` | CID link \| string | A Node CID (mount that subtree) or a lowercase publisher address (mount that publisher's effective graph — their chain union) |
| `order` | int | Precedence among this node's mounts: higher order shadows lower |

**Resolution semantics**: the effective children of a node are its own
`edges` unioned with the effective children of each mounted root; the node's
own edges always shadow mounted content, and mounts shadow one another by
`order`. Mount traversal is bounded by `maxMountDepth` (config, default 8):
content beyond the bound is not visible — bounded and deterministic, so
mount cycles terminate without error. A never-published address mount
contributes nothing; an unretrievable CID mount target throws
`UnreachableNodeError`.

### Update (the root document of a publish)

The unit of publication; "an update's CID" means this document's CID.

| Field | Type | Rules |
|-------|------|-------|
| `granite` | int | Format version; `1` for this feature |
| `publisher` | string | Lowercase `0x…` Ethereum address of the publishing key |
| `root` | CID link | Top Node of this update's tree, relative to the publisher's universal root (FR-006) |
| `prev` | CID link (optional) | The publisher's previous Update; ABSENT (not null) on the first update (FR-003) |
| `at` | int | Unix seconds at publish time (informational; ordering authority is the `prev` chain) |

**Partial snapshots (FR-013)**: an Update asserts only the paths it contains.
The publisher's effective graph is the union mount of their entire chain,
newest shadowing oldest — `root` is the top of this update's *asserted*
subtree relative to the universal root, not necessarily the whole tree.
Fall-through past an unreachable `prev` link MUST fail loudly: with partial
snapshots, "absent" cannot be distinguished from "defined below the break".

**State transitions**: none — Updates are created and never change (FR-004).
The publisher-level state is the chain head, advanced only by publishing a
new Update whose `prev` is the current head.

### Registry entry (on-chain)

`mapping(address => bytes) latest` — full CIDv1 bytes of the publisher's
latest Update; empty bytes ⇒ never published (spec US3 scenario 4).
See [contracts/registry.sol.md](./contracts/registry.sol.md).

### Announcement (Gossipsub payload)

`{ publisher, root, prev, at }` + EIP-191 signature; transient, never stored.
See [contracts/messages.md](./contracts/messages.md).

## Reader-side configuration (not persisted in the DAG)

### Mount stack

An ordered list of mount sources; later entries shadow earlier ones (FR-009).

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Reader-chosen label for the stack (cache lookup key) |
| `mounts` | array of Mount | Order is significant; index = mount order |

### Mount

| Field | Type | Rules |
|-------|------|-------|
| `source` | CID \| address | A pinned Update CID, or a publisher address meaning "that publisher's entire update chain, expanded newest-first from latest" (FR-013) |

Resolving an address-mount consults the registry (or a fresher announcement —
either is acceptable per the spec's convergence edge case), then walks `prev`
links to expand the chain; within the expansion, newer updates shadow older
ones, and the whole expansion occupies that mount's position relative to the
stack's other mounts.

## Cache layer (TinkerPop property graph)

Full schema and traversal contracts:
[contracts/cache-schema.md](./contracts/cache-schema.md). Summary:

| Element | Kind | Key properties | Derived from |
|---------|------|----------------|--------------|
| `Publisher` | vertex | `address` (unique) | Registry / announcements |
| `Update` | vertex | `cid` (unique), `publisher`, `at` | Update documents |
| `Node` | vertex | `cid` (unique — shared across updates that contain identical content; structure only, node `data` is fetched from the DAG by cid) | Node documents |
| `Stack` | vertex | `key` (unique — hash derived from the ordered mount sources), optional `name` alias | Reader mount configuration |
| `LATEST` | edge Publisher→Update | — | Registry entry |
| `PREV` | edge Update→Update | — | `Update.prev` |
| `ROOT` | edge Update→Node | — | `Update.root` |
| `EDGE` | edge Node→Node | `name`, plus the Edge's `props` flattened under the `'mïm ⊫ '` prefix (trailing space included) | `Node.edges` |
| `MOUNT` | edge Stack→Update, Node→Node, or Node→Publisher | `order` (int) | Mount stack config (Stack→Update); published NodeMounts (Node→Node for CID sources, Node→Publisher for address sources) |

**Cache lifecycle**: hydration is incremental (FR-015) — resolution fetches
only the documents along the paths it consults, upserting each visited node
(fetch-on-miss, write-back), so the cache holds exactly what queries have
touched. `granite hydrate` is an optional eager warm-up that walks whole
mounted trees for traversal-style workloads. An announcement or registry
change affecting a mounted publisher marks dependent stacks stale;
rehydration layers the new Update and repoints `LATEST`/`MOUNT`. Dropping
the entire graph is always safe — lazy resolution rebuilds what it needs
(the invariant behind Constitution IV's justification).

**Agreement invariant**: for any stack and path, cache-backed resolution MUST
return the same result as the cache-free reference resolver over the same
mount stack (`mount.ts`); this is a standing unit-test obligation (SC-004).

## Validation rules (enforced at the codec boundary)

- Update/Node/Edge documents failing the shape tables above ⇒ throw with the
  offending CID and field (FR-012).
- `publisher` must parse as an Ethereum address; announcements whose
  recovered signer ≠ `publisher` are dropped (logged, not thrown — network
  input is expected to be dirty).
- Path syntax: `/`-separated non-empty edge names; the empty path resolves to
  the stack's merged root.
- Absent path ⇒ `undefined` (legitimate cardinality variance, per the
  project's error-handling convention); unreachable `child` CID during a walk
  ⇒ throw (spec edge case: hard failure naming the unreachable reference).
