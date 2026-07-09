# Contract: TinkerPop Cache Schema

The union-mount cache is a property graph reachable over the Gremlin Server protocol (TinkerGraph in dev/test, JanusGraph in the wider Mïmis deployment).
It is **derived and disposable**: every element below is keyed by data recomputable from the DAG plus the reader's mount  configuration, and dropping the whole graph is always recoverable via hydration. This document is the schema contract `cache.ts` implements and tests assert.

## Vertices

| Label | Properties | Uniqueness key |
|-------|-----------|----------------|
| `Publisher` | `address` (lowercase 0x string) | `address` |
| `Update` | `cid` (CIDv1 string), `publisher`, `at` (int) | `cid` |
| `Node` | `cid` (CIDv1 string), `expanded` (bool — true once the document's `edges`/`mounts` have been upserted; distinguishes "not yet fetched" from "has no such edge") — structure only: the Node's `data` map is NOT cached; `resolve` fetches the winning document from the DAG by `cid` | `cid` |
| `Stack` | `key` (hash of the ordered mount sources — see below), `name` (optional reader-chosen alias), `hydratedAt` (int), `stale` (bool) | `key` |

`Node` vertices are shared: two Updates containing an identical subtree point at the same `Node` rows (content addressing carries into the cache).

## Edges

| Label | From → To | Properties |
|-------|-----------|-----------|
| `LATEST` | Publisher → Update | — (exactly one per Publisher; repointed on new publish) |
| `PREV` | Update → Update | — (mirrors the Update doc's `prev` link) |
| `ROOT` | Update → Node | — (the update's top node) |
| `CONTAINS` | Node → Node | `path` (string — the single edge-name segment, matching the wider Mïmis JanusGraph `CONTAINS.path`), plus the DAG Edge's `props` entries flattened as individual edge properties under the `'mïm ⊫ '` prefix — note the trailing space (`title` → `'mïm ⊫ title'`); scalar values stored natively, non-scalar values JSON-stringified. The prefix marks provenance (property asserted by the published document) and leaves no reserved keys — publishers may use any prop name, including `path` |
| `MOUNT` | Stack → Update | `order` (int; higher = mounted later = shadows lower) — reader-side stack config |
| `MOUNT` | Node → Node | `order` (int) — published NodeMount with a CID source (FR-014); same label as the wider Mïmis JanusGraph MOUNT (Spot→Spot), distinguished by endpoints |
| `MOUNT` | Node → Publisher | `order` (int), optional `path` (string) — published NodeMount with an address source; resolution expands through the Publisher's chain at query time, and when `path` is present it first resolves that path within the publisher's graph and mounts the node found there (Spot → Spot between users' graphs) |

All writes are idempotent upserts keyed by the uniqueness keys above (`coalesce`-style merge, matching the pattern the wider Mïmis codebase uses).

## Stack identity & chain expansion

**Stack key**: `sha256` over the ordered, newline-joined mount source strings (canonical CID text or lowercase address) as configured — *before* expansion.
Identical mount lists therefore dedupe to one Stack vertex, and the key is recomputable by any process holding only the mount list — no prior contact with the cache, and stable across cache wipes (element `id()`s are neither, so they serve only as intra-session handles after the initial key lookup). `name` is a cosmetic alias for humans.

**Chain expansion (FR-013)**: because updates are partial snapshots, an address mount expands at hydration time into that publisher's entire update chain (walk `prev` from latest). The flattened expansion defines `MOUNT` `order`: expansions/CIDs earlier in the configured list get lower order ranges; within one publisher's expansion, older updates get lower order than
newer ones. Fall-through past an unreachable `prev` link fails loudly (`UnreachableNodeError`) — absence cannot be asserted across a broken chain.

## Canonical traversals

**Path resolution** (`Stack.resolve(path)` cached branch) — for segments `s₁…sₙ`, per mounted Update in descending `order`: start at its `ROOT` node, follow `CONTAINS[path=sᵢ]` stepwise; the first mount that completes all segments wins, and its Update `cid` is reported as `via`:

```groovy
g.V().has('Stack', 'key', stackKey)
.outE('MOUNT')
.order().by('order', desc)
.inV()
.local(
  out('ROOT')
  .repeat(outE('CONTAINS').has('path', within(segments)).inV())
  .times(segments.length)
)
.limit(1)
```

(The real implementation binds each segment at its own step rather than `within` — shown here only to fix the shape: MOUNT-order outer loop, per-segment EDGE walk inner loop.)

**Shadow rule**: a `CONTAINS` in a later mount shadows the *entire* edge of the same `path` in earlier mounts — properties are never merged across mounts (spec edge case).

**Node mounts**: at each step, a node's effective children are its own `CONTAINS` edges unioned with the children of anything reachable over its outgoing node-level `MOUNT` edges — own edges shadow mounted content, mounts shadow each other by `order`. The traversal repeats over `MOUNT` at every position, bounded by `maxMountDepth` (config, default 8) so cycles terminate — the same `repeat().until(maxMountDepth)` discipline the wider Mïmis JanusGraph traversals use; content beyond the bound is not visible, deterministically.

## Incremental retrieval (FR-015)

Resolution is lazy end-to-end: the traversal walks cached structure while it exists and, on reaching a Node that is missing or `expanded=false`, fetches *exactly that document* from the store, upserts its `EDGE`/`MOUNT` rows, marks it `expanded=true`, and continues. A search therefore loads as few nodes as possible for the query to complete — fetch counts scale with path length and consulted layers, never with graph size (SC-007). Absence is only asserted from `expanded=true` nodes.

## Lifecycle contract

| Event | Cache effect |
|-------|--------------|
| Resolve visits a missing/unexpanded Node | Fetch that single document; upsert its Node + `EDGE`/`MOUNT` rows; mark `expanded=true`; continue |
| `Stack.hydrate()` (optional eager warm-up) | Walk each mounted Update's tree from the DAG; upsert Publisher/Update/Node/edges; set `hydratedAt`, `stale=false` — for traversal-style queries that want the full view resident |
| Verified announcement for a mounted publisher | Set `stale=true` on affected Stacks — both stack-mounted publishers and publishers reached via node-level `MOUNT` edges in a hydrated subgraph; repoint `LATEST`; the new Update becomes the top layer of that publisher's chain expansion |
| `resolve` on a stale stack | Rehydrate the affected publisher's new Update subgraph (incremental — existing `Node` rows by `cid` are reused), repoint `MOUNT`, clear `stale` |
| Cache unreachable / cleared | `resolve` falls back to the DAG walk; nothing is lost (Constitution IV justification) |

## Agreement obligation (tested)

For every stack and path exercised in tests, the cached traversal and the cache-free reference resolver (`mount.ts`) MUST return identical `{ node, via }` results, including `undefined` for not-present. Divergence is a release-blocking bug, not a cache-refresh matter.
