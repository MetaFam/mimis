# Contract: TinkerPop Cache Schema

The union-mount cache is a property graph reachable over the Gremlin Server
protocol (TinkerGraph in dev/test, JanusGraph in the wider Mïmis deployment).
It is **derived and disposable**: every element below is keyed by data
recomputable from the DAG plus the reader's mount configuration, and dropping
the whole graph is always recoverable via hydration. This document is the
schema contract `cache.ts` implements and tests assert.

## Vertices

| Label | Properties | Uniqueness key |
|-------|-----------|----------------|
| `Publisher` | `address` (lowercase 0x string) | `address` |
| `Update` | `cid` (CIDv1 string), `publisher`, `at` (int) | `cid` |
| `Node` | `cid` (CIDv1 string), `data` (dag-json string of the Node's `data` map, absent if none) | `cid` |
| `Stack` | `name` (reader-chosen), `hydratedAt` (int), `stale` (bool) | `name` |

`Node` vertices are shared: two Updates containing an identical subtree point
at the same `Node` rows (content addressing carries into the cache).

## Edges

| Label | From → To | Properties |
|-------|-----------|-----------|
| `LATEST` | Publisher → Update | — (exactly one per Publisher; repointed on new publish) |
| `PREV` | Update → Update | — (mirrors the Update doc's `prev` link) |
| `ROOT` | Update → Node | — (the update's top node) |
| `EDGE` | Node → Node | `name` (string), plus the DAG Edge's `props` entries as individual edge properties (the reserved key `name` MUST NOT be used as a prop name) |
| `MOUNT` | Stack → Update | `order` (int; higher = mounted later = shadows lower) |

All writes are idempotent upserts keyed by the uniqueness keys above
(`coalesce`-style merge, matching the pattern the wider Mïmis codebase uses).

## Canonical traversals

**Path resolution** (`Stack.resolve(path)` cached branch) — for segments
`s₁…sₙ`, per mounted Update in descending `order`: start at its `ROOT` node,
follow `EDGE[name=sᵢ]` stepwise; the first mount that completes all segments
wins, and its Update `cid` is reported as `via`:

```groovy
g.V().has('Stack', 'name', stack)
.outE('MOUNT')
.order().by('order', desc)
.inV()
.local(
  out('ROOT')
  .repeat(outE('EDGE').has('name', within(segments)).inV())
  .times(segments.length)
)
.limit(1)
```

(The real implementation binds each segment at its own step rather than
`within` — shown here only to fix the shape: MOUNT-order outer loop,
per-segment EDGE walk inner loop.)

**Shadow rule**: an `EDGE` in a later mount shadows the *entire* edge of the
same `name` in earlier mounts — properties are never merged across mounts
(spec edge case).

## Lifecycle contract

| Event | Cache effect |
|-------|--------------|
| `Stack.hydrate()` | Walk each mounted Update's tree from the DAG; upsert Publisher/Update/Node/edges; set `hydratedAt`, `stale=false` |
| Verified announcement for a mounted publisher | Set `stale=true` on affected Stacks; repoint `LATEST` |
| `resolve` on a stale stack | Rehydrate the affected publisher's new Update subgraph (incremental — existing `Node` rows by `cid` are reused), repoint `MOUNT`, clear `stale` |
| Cache unreachable / cleared | `resolve` falls back to the DAG walk; nothing is lost (Constitution IV justification) |

## Agreement obligation (tested)

For every stack and path exercised in tests, the cached traversal and the
cache-free reference resolver (`mount.ts`) MUST return identical `{ node,
via }` results, including `undefined` for not-present. Divergence is a
release-blocking bug, not a cache-refresh matter.
