# Implementation Plan: Granite Core Graph

**Branch**: `master` (spec directory: `001-granite-graph-core`) | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-granite-graph-core/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build the minimal Mïmis Granite core: publishers write trees of dag-cbor
documents to IPFS (each node its own document, edges carrying properties plus
the child's CID), publish each tree as an immutable update whose root document
links to the publisher's previous update, record the latest root per publisher
in a tiny Ethereum registry contract, and announce new roots over Gossipsub
with EIP-712-signed payloads. Updates are partial snapshots: a publisher's
effective graph is the union of their whole chain, newest shadowing oldest.
Readers union-mount an ordered set of updates and resolve paths with
later-shadows-earlier semantics — honoring publisher-declared node mounts
(FR-014) — and the mounted view is materialized into a TinkerPop-compatible
graph database as a disposable cache so path resolution and traversal are
single queries instead of per-node IPFS round trips. The
IPFS DAG remains the sole source of truth — the cache is rebuildable from it
at any time. Delivered as an ESM TypeScript library with a thin CLI, leaning
on an external Kubo daemon for all IPFS/libp2p machinery.

## Technical Context

**Language/Version**: TypeScript (ESM), executed via Node.js ≥ 24 native
type-stripping — no build step for dev/test; `tsc` emits types only for
library consumers

**Primary Dependencies**: `kubo-rpc-client` (IPFS + pubsub via external Kubo
daemon), `@ipld/dag-cbor` + `multiformats` (encoding, CIDs), `viem` (Ethereum
registry reads/writes), `gremlin` (TinkerPop client for the union-mount
cache; same version line as the sibling Gremlin package). No other runtime
dependencies.

**Storage**:
- Source of truth: IPFS dag-cbor blocks via a local Kubo daemon
- Registry: Ethereum contract (`mapping(address => bytes)` latest root per
  publisher) on a test network; local anvil chain for development
- Cache: any TinkerPop-compatible database reached over the Gremlin Server
  protocol — Gremlin Server + in-memory TinkerGraph for dev/test, JanusGraph
  in the broader Mïmis deployment. Cache contents are derived and disposable.

**Testing**: `node:test` (built-in runner, zero test dependencies); in-memory
fakes behind the blockstore/registry/announcement/cache ports for unit tests;
live Kubo + anvil + Gremlin Server (TinkerGraph) for integration tests

**Target Platform**: Linux/macOS developer machines running a Kubo daemon and
a Gremlin Server; library importable by other Mïmis packages (e.g. Gremlin)

**Project Type**: Library with a thin CLI (`granite` bin)

**Performance Goals**: Publish→announcement received < 60 s (SC-003); path
resolution over a 10-deep mount stack deterministic and correct (SC-004), and
served from the cache without touching IPFS once the path is resident;
retrieval is incremental — fetches scale with path length and consulted
layers, never graph size (FR-015, SC-007); no tuning for graphs beyond
thousands of nodes (per spec assumptions)

**Constraints**: Append-only, content-addressed, no central services;
publisher identity = secp256k1 Ethereum account; the cache MUST be
reconstructible from the mount stack alone and MUST never be consulted as an
authority when it disagrees with the DAG; graphs public (no encryption or
access control in v1)

**Scale/Scope**: Single-developer v1; updates up to thousands of nodes;
5 runtime dependencies; one Solidity contract of ~20 lines

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Radical Minimalism | ⚠️ JUSTIFIED | 5 runtime deps; `gremlin` + a Gremlin Server instance exceed the bare IPFS/libp2p/Ethereum stack — justified in Complexity Tracking (row 1) |
| II | Content Addressing | ✅ PASS | Every node is its own dag-cbor document addressed by CID; edges hold properties + child CID; nothing mutable inside a published update |
| III | Append-Only Updates | ✅ PASS | Update root doc carries `prev` link to publisher's prior root (absent on first); no rewrite/delete APIs; cache mutations never touch published content |
| IV | Union-Mount Composition | ⚠️ JUSTIFIED | Resolution semantics are defined by the mount stack, but a materialized merged view exists as a cache — justified in Complexity Tracking (row 2); cache is derived, disposable, and non-authoritative |
| V | Sovereign Publishing Keys | ✅ PASS | Registry keyed by Ethereum address; announcements signed by that key; Gossipsub + registry are the only discovery surfaces; Kubo and Gremlin Server are node-local infrastructure, not central services |

**Post-Phase-1 re-check (2026-07-09)**: Unchanged — gates II/III/V pass; I and
IV remain justified deviations with no scope growth during design. The cache
schema (data-model.md) stores only data re-derivable from the DAG plus mount
bookkeeping, preserving rebuildability.

## Project Structure

### Documentation (this feature)

```text
specs/001-granite-graph-core/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── library-api.md   # Public TypeScript API contract
│   ├── cli.md           # CLI command contract
│   ├── registry.sol.md  # Ethereum registry contract interface
│   ├── cache-schema.md  # TinkerPop cache vertex/edge schema
│   └── messages.md      # Gossipsub announcement message schema
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── codec.ts        # dag-cbor encode/decode, CID helpers, shape guards (throw on unexpected)
├── store.ts        # Blockstore port + Kubo (kubo-rpc-client) implementation
├── publish.ts      # Build node/edge docs, assemble update, chain prev link, publish
├── mount.ts        # Union-mount stack semantics; direct-DAG path resolution (cache-free reference implementation)
├── cache.ts        # Cache port + Gremlin (TinkerPop) implementation: hydrate mount stack, query, invalidate on announcements
├── resolve.ts      # Resolution façade: cache-first, DAG fall-back, cache write-back
├── history.ts      # Walk prev-links; enumerate a publisher's update chain
├── registry.ts     # Registry port + Ethereum (viem) implementation
├── announce.ts     # Announcement port + Kubo pubsub implementation; signing/verification
├── keys.ts         # Publishing key load/generate (secp256k1 / Ethereum account)
├── index.ts        # Public library surface
└── cli.ts          # `granite` bin: publish, resolve, history, follow, hydrate

contracts/
└── GraniteRegistry.sol   # mapping(address => bytes) latest root + event

tests/
├── unit/           # codec, mount semantics, cache/DAG agreement, history walk (in-memory fakes)
└── integration/    # live Kubo + anvil + Gremlin Server round trips (publish → discover → hydrate → resolve)
```

**Structure Decision**: Single library package at the repo root (`pkgs/granite`
is already its own package within the Mïmis workspace). Ports (`store`,
`registry`, `announce`, `cache`) each pair one interface with one real
implementation plus an in-memory fake in tests — the minimum seam that lets
unit tests run without daemons while keeping exactly one production code path.
`mount.ts` stays cache-free so it doubles as the reference implementation the
cache is validated against (same inputs must yield the same resolutions).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `gremlin` dependency + Gremlin Server infrastructure (Principle I) | Explicit user direction: cache union mounts in a TinkerPop-compatible database; also aligns Granite with the existing Mïmis JanusGraph deployment and the sibling Gremlin package's tooling | Query-per-resolution against Kubo needs one RPC round trip per path segment per mounted update — deep stacks make interactive resolution and any search/traversal feature impractical; a bespoke in-process index would be new unshared code that no other Mïmis package could query |
| Materialized merged view of the mount stack (Principle IV) | Path resolution and graph traversal become single Gremlin queries; the broader Mïmis system (JanusGraph) already consumes this shape | Pure mount-stack derivation on every read (rejected for the same per-segment round-trip cost); mitigation: the cache is explicitly non-authoritative — rebuildable from the DAG at any time (`granite hydrate`), invalidated on announcements, and unit-tested to agree with the cache-free `mount.ts` reference resolver |
