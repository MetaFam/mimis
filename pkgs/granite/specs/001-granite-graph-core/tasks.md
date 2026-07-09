# Tasks: Granite Core Graph

**Input**: Design documents from `/specs/001-granite-graph-core/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — each contract document defines explicit test obligations
(registry.sol.md, cli.md, messages.md, and cache-schema.md's agreement
invariant), and SC-004's determinism/agreement guarantee is test-enforced.

**Organization**: Tasks are grouped by user story so each story is an
independently implementable, testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- All paths are relative to `pkgs/granite/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Package skeleton matching plan.md's structure

- [X] T001 Initialize the package: `package.json` (name `granite-mimis`, ESM, `bin.granite`, pnpm, deps `kubo-rpc-client` ^6, `@ipld/dag-cbor` ^9, `multiformats` ^13, `viem` ^2, `gremlin` 3.7.x; scripts `test`, `test:integration`, `deploy:registry`, `check`) and `tsconfig.json` (Node ≥ 24 type-stripping-compatible: `erasableSyntaxOnly`, declaration-only emit)
- [X] T002 [P] Create directory skeleton `src/`, `contracts/`, `tests/unit/`, `tests/integration/`, `scripts/`, plus `granite.example.json` matching `GraniteConfig` (contracts/library-api.md) and a `.gitignore` (node_modules, granite.json, dist)
- [X] T003 [P] Write `tests/fakes.ts` scaffold: exported in-memory fake registry (Map address→bytes), fake announcer (local emitter), fake blockstore (Map cid→bytes) — bodies filled as ports land, shape defined now so unit tests can import one module

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Codec, ports, keys, errors, CLI shell — everything every story leans on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement `src/errors.ts`: `MissingKeyError`, `MalformedDocumentError` (carries cid + field), `UnreachableNodeError` (carries cid), `RegistryError` per contracts/library-api.md's error taxonomy
- [X] T005 Implement `src/codec.ts`: dag-cbor encode/decode via `@ipld/dag-cbor` + `multiformats` (CIDv1, sha2-256); shape guards for Node, Edge, NodeMount, Update documents per data-model.md that throw `MalformedDocumentError` on violation (edge names non-empty, no `/`; `prev` absent-not-null; `publisher` address format; NodeMount `source` CID-or-address with int `order`); path split/join helpers
- [X] T006 [P] Implement `src/store.ts`: `Blockstore` port (`put(bytes) → CID`, `get(CID) → bytes`) + Kubo implementation over `kubo-rpc-client` (`block.put`/`block.get` with dag-cbor codec); `get` failure wraps as `UnreachableNodeError`
- [X] T007 [P] Implement `src/keys.ts`: `generateKey()` and `addressOf(key)` via viem accounts (lowercase address = publisher identity)
- [X] T008 [P] Implement `src/cli.ts` shell: `node:util` `parseArgs`-based command dispatch, config loading (`--config` path → `./granite.json` default → `GRANITE_*` env overrides, key only via `GRANITE_KEY`), `--json` flag plumbing, exit-code convention (0 success incl. not-present, 1 error, 2 usage) per contracts/cli.md — commands registered as stubs erroring "not implemented"
- [X] T009 Complete `tests/fakes.ts` in-memory blockstore against the `Blockstore` port and write `tests/unit/codec.test.ts`: round-trip encode/decode for Node/Edge/Update; every malformed-shape case from data-model.md throws `MalformedDocumentError`; CID determinism (identical content ⇒ identical CID)

**Checkpoint**: Foundation ready — user story phases can begin

---

## Phase 3: User Story 1 — Publish a Graph Update (Priority: P1) 🎯 MVP

**Goal**: One call publishes a tree as an immutable, chained, announced, registered update

**Independent Test**: On one machine (Kubo + anvil), publish a tree and fetch it back by root CID; publish again and confirm `prev` chaining with the first update bit-for-bit unchanged (quickstart.md US1)

### Implementation for User Story 1

- [X] T010 [P] [US1] Write `contracts/GraniteRegistry.sol`: `mapping(address => bytes) public latest`, `event Published(address indexed publisher, bytes root)`, `publish(bytes calldata root)` per contracts/registry.sol.md
- [X] T011 [P] [US1] Write `scripts/deploy-registry.ts`: compile with `solc --bin --abi`, deploy to the configured RPC (anvil default) via viem, print the deployed address (backs `pnpm run deploy:registry` in quickstart.md)
- [X] T012 [US1] Implement `src/registry.ts`: `Registry` port (`latest(address) → CID | undefined`, `publish(root: CID) → void`) + viem implementation (readContract/writeContract against GraniteRegistry; empty bytes ⇒ `undefined`; non-decoding bytes ⇒ `MalformedDocumentError`; RPC/revert failures ⇒ `RegistryError`); add matching fake to `tests/fakes.ts`
- [X] T013 [US1] Implement `src/announce.ts` (publish side): `Announcer` port + Kubo pubsub implementation on topic `/granite/1/announce`; dag-cbor payload `{ granite: 1, publisher, root, prev?, at, sig }` with EIP-712 typed-data signature (domain `{ name: "granite", version: "1" }`, viem `signTypedData`) per contracts/messages.md; add fake announcer to `tests/fakes.ts`
- [X] T014 [US1] Implement `src/publish.ts`: recursive `Tree` → Node documents (depth-first, `child: CID` grafts and `mounts` entries pass through; trees are partial snapshots per FR-013), assemble Update doc (`granite: 1`, `publisher`, `root`, `prev` from `Registry.latest`, `at`), write all blocks, then registry publish + announcement — returns `{ update, root, prev? }` per contracts/library-api.md
- [X] T015 [US1] Implement `src/index.ts` (first slice): `GraniteConfig`, `connect()` wiring Kubo/registry/announcer, `Granite.publish` (throws `MissingKeyError` when keyless), `Granite.close`, re-export `generateKey`/`addressOf` and the error classes
- [X] T016 [US1] Wire CLI commands `granite keys generate` and `granite publish <tree.json>` (stdin via `-`) in `src/cli.ts` with human + `--json` output per contracts/cli.md
- [X] T017 [P] [US1] Write `tests/unit/publish.test.ts` (fakes): first publish has no `prev`; second chains to first; identical subtree CIDs dedup; keyless publish throws `MissingKeyError`; announcement payload signs/verifies with the publisher key
- [X] T018 [P] [US1] Write `tests/integration/registry.test.ts` (anvil): the four contract tests from contracts/registry.sol.md — empty before publish, store+event, overwrite, two-account isolation
- [X] T019 [US1] Write `tests/integration/publish.test.ts` (Kubo + anvil): publish → `ipfs dag get` returns intact docs; republish → prev chain + first update unchanged (SC-002, SC-005); plus CLI contract tests for `keys generate` and `publish` (exit codes, `--json` shape)

**Checkpoint**: MVP — publishing works end-to-end and history is immutable

---

## Phase 4: User Story 2 — Read the Composed Graph (Priority: P2)

**Goal**: Union-mount an ordered update set; resolve paths with later-shadows-earlier, cached in TinkerPop

**Independent Test**: Mount two local updates where the second redefines one path and leaves another alone; verify shadow, fall-through, `undefined` for absent, and identical results cold/warm/wiped cache (quickstart.md US2 + disposability check)

### Implementation for User Story 2

- [X] T020 [US2] Implement `src/mount.ts`: cache-free reference resolver — materialize mount order, walk each Update's tree from its `ROOT` per path segment (later mounts first), whole-edge shadowing, node-mount union per FR-014 (own edges shadow mounted content; mounts shadow by `order`; traversal bounded by `maxMountDepth`, default 8), `undefined` on absence, `UnreachableNodeError`/`MalformedDocumentError` propagation; export `Stack` construction from `Mount[]` (CID sources only at this phase) with identity = hash of the ordered sources per contracts/cache-schema.md
- [X] T021 [US2] Implement `src/cache.ts`: `Cache` port + Gremlin implementation per contracts/cache-schema.md — idempotent upserts (`coalesce`-style merge) for Publisher/Update/Node/Stack vertices (Stack keyed by the derived hash, optional `name` alias; no Node `data` property — `resolve` fetches the winning document from the store by cid) and LATEST/PREV/ROOT/EDGE/MOUNT edges (EDGE props flattened under the `'mïm ⊫ '` prefix; node-level MOUNT Node→Node and Node→Publisher); Node `expanded` marker distinguishing not-yet-fetched from no-such-edge (FR-015); `hydrate(stack)` as optional eager warm-up walking whole trees; per-segment resolution traversal (MOUNT order desc outer, EDGE-by-name inner, node-mount `repeat()` bounded by `maxMountDepth`); `invalidate(stack)`; add in-memory fake cache to `tests/fakes.ts`
- [X] T022 [US2] Implement `src/resolve.ts`: resolution façade — cache-first when a Gremlin endpoint is configured, incremental fetch-on-miss per FR-015 (a missing/unexpanded node pulls exactly that document from the store, writes it back, continues), full lazy DAG walk when the cache is absent/unreachable; result includes `via` (winning Update CID)
- [X] T023 [US2] Extend `src/index.ts`: `Granite.stack(name, mounts)` returning `Stack` with `resolve`/`hydrate`/`invalidate` per contracts/library-api.md; cache disabled ⇒ pure `mount.ts` path
- [X] T024 [US2] Wire CLI commands `granite resolve <path> --mount <source>…` and `granite hydrate --mount <source>… [--name <alias>]` in `src/cli.ts` (stack identity = derived hash of ordered mounts; not-present ⇒ `null` + exit 0; no gremlin config ⇒ hydrate errors) per contracts/cli.md
- [X] T025 [P] [US2] Write `tests/unit/mount.test.ts` (fakes): shadow wins, fall-through, absent ⇒ `undefined`, empty path ⇒ merged root, determinism across repeated resolves, unreachable child throws naming the CID, whole-edge (non-merged) property shadowing, 10-deep stack correctness (SC-004); node mounts — own edges shadow mounted content, mount `order` respected, mount cycle terminates at `maxMountDepth` deterministically
- [X] T026 [US2] Write `tests/integration/cache.test.ts` (Kubo + Gremlin Server/TinkerGraph): hydrate a stack; assert the agreement invariant — cached resolution ≡ `mount.ts` reference for every path exercised, including `undefined`; wipe the graph and confirm lazy resolution still answers and rebuilds what it touches (Constitution IV disposability); fetch-count assertion per SC-007 — resolving one path over a large fixture retrieves only path-relevant documents (count store gets in a wrapped Blockstore); CLI contract tests for `resolve`/`hydrate`

**Checkpoint**: Reading works with or without the cache, provably identically

---

## Phase 5: User Story 3 — Discover Other Publishers' Updates (Priority: P3)

**Goal**: Find any publisher's latest root by identity; hear new roots live; walk full history

**Independent Test**: With `granite follow` running, publish from another terminal; announcement arrives < 60 s and verifies; `latest` agrees once mined; `history` streams back to the chain start (quickstart.md US3)

### Implementation for User Story 3

- [X] T027 [P] [US3] Implement `src/history.ts`: async-iterable walk of `prev` links newest→oldest yielding `{ update, publisher, prev?, at }`; broken link ⇒ yield what was reached then throw `UnreachableNodeError` naming the missing CID; never-published address ⇒ empty iterable (absence is not an error)
- [X] T028 [US3] Extend `src/announce.ts` (subscribe side): `follow(handler)` subscribing via Kubo pubsub; verification pipeline per contracts/messages.md — size cap (1 KiB), shape check, version check, EIP-712 typed-data signer recovery (viem `recoverTypedDataAddress`) vs `publisher`; drops logged never thrown; returns unsubscribe
- [X] T029 [US3] Extend `src/index.ts`: `Granite.latest(publisher)` (registry read ⇒ CID | `undefined`), `Granite.history(from)` (address ⇒ via latest, or Update CID), `Granite.follow(handler)`
- [X] T030 [US3] Wire CLI commands `granite latest <address>`, `granite history <address|update-cid>` (streaming, broken chain ⇒ emit-then-exit-1), `granite follow` (stream until interrupted) in `src/cli.ts` per contracts/cli.md
- [X] T031 [P] [US3] Write `tests/unit/discovery.test.ts` (fakes): history walk full chain; broken chain emits-then-throws; announcement verification — valid passes, tampered `root` dropped, wrong shape dropped without throw, missing `prev` (first publish) verifies, oversize dropped undecoded; never-published address ⇒ `latest` returns `undefined` and `history` yields an empty iterable (US3 scenario 4)
- [X] T032 [US3] Write `tests/integration/discovery.test.ts` (Kubo + anvil): publish → subscriber receives verified announcement < 60 s (SC-003); `latest` matches; `history` enumerates every update from the registry entry alone (SC-001, SC-006); CLI contract tests for `latest`/`history`/`follow`

**Checkpoint**: Granite is a network — publish, discover, read all work

---

## Phase 6: User Story 4 — Conglomerate Publishers into a Directory (Priority: P4)

**Goal**: Mount several publishers' universal roots (by address) into one navigable tree

**Independent Test**: Publish from two keys; mount both by address; paths unique to each resolve, contested paths go to the later mount (quickstart.md US4)

### Implementation for User Story 4

- [X] T033 [US4] Extend `src/mount.ts` + `src/resolve.ts`: address mounts — `Mount.source` (or a NodeMount `source`) as publisher address resolves via registry or a fresher verified announcement, then expands into that publisher's entire update chain per FR-013 (walk `prev` lazily; newest shadows oldest; falling through past an unreachable link throws `UnreachableNodeError`)
- [X] T034 [US4] Extend `src/cache.ts`: Publisher vertices + LATEST edges for address mounts (stack-level and node-level MOUNT→Publisher); verified announcements for mounted publishers set `stale=true` on every Stack whose hydrated subgraph reaches them, repoint LATEST, and layer the new Update atop that publisher's chain expansion; stale-stack resolve rehydrates incrementally (existing Node rows reused by cid) per contracts/cache-schema.md lifecycle
- [X] T035 [US4] Extend `src/cli.ts`: `--mount` accepts addresses everywhere CIDs are accepted (`resolve`, `hydrate`) per contracts/cli.md
- [X] T036 [P] [US4] Write `tests/unit/directory.test.ts` (fakes): address-mount stack building with chain expansion; unique paths resolve per publisher; contested path goes to later mount; a path published only in an older layer falls through correctly (partial snapshots); a node-level mount of a publisher unions their content beneath the mounting node; announcement for a mounted publisher (stack- or node-level) marks stacks stale
- [X] T037 [US4] Write `tests/integration/directory.test.ts` (Kubo + anvil + Gremlin Server): two-key directory scenario end-to-end incl. stale→rehydrate on live announcement; cached ≡ reference agreement re-checked across publishers

**Checkpoint**: All four user stories independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T038 [P] Update `README.md` with install, config, CLI usage, and library examples consistent with contracts/ (proper Unicode, project code style)
- [X] T039 [P] Verify type emission and package surface: `pnpm run check` clean; `tsc` d.ts output matches contracts/library-api.md signatures; `exports`/`types`/`bin` fields resolve for a consumer package
- [X] T040 Run the full quickstart.md manual walkthrough (US1→US4 + cache disposability) against live Kubo, anvil, and Gremlin Server; fix any drift between docs and behavior
- [X] T041 Sweep error paths and logging: every throw carries the offending CID/field per FR-012; announcement drops logged with reason; CLI stderr messages actionable; constitution style pass (two-space indent, own-line trailing commas, chain indentation, no ASCII approximations in output text)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately
- **Foundational (Phase 2)**: needs Phase 1 — **blocks all stories**
- **US1 (Phase 3)**: needs Phase 2 only
- **US2 (Phase 4)**: needs Phase 2; integration tests consume US1's publish to create fixtures (unit tests don't — fakes suffice)
- **US3 (Phase 5)**: needs Phase 2; T028 extends `src/announce.ts` created in T013 (US1)
- **US4 (Phase 6)**: needs US2 (mount/cache/resolve) and US3 (latest/follow) surfaces
- **Polish (Phase 7)**: needs all desired stories complete

### Within Each Story

- Ports/models before services before CLI wiring; unit tests [P] alongside implementation files they don't touch; integration tests last
- Tasks touching the same file are sequential (e.g. T012→T013 both edit `tests/fakes.ts`; T015/T023/T029 all edit `src/index.ts` in their own phases)

### Parallel Opportunities

- Phase 1: T002, T003 after T001
- Phase 2: T006, T007, T008 in parallel after T005
- US1: T010 + T011 together; T017 + T018 together after T014
- US2: T025 parallel with T021/T022
- US3: T027 + T031 parallel with T028
- Stories US2 and US3 can proceed in parallel once Phase 2 lands (different files except `src/index.ts` — coordinate T023/T029)

## Parallel Example: User Story 1

```text
# After T014 (publish service) lands, launch together:
Task: "T017 unit publish tests in tests/unit/publish.test.ts"
Task: "T018 registry contract tests in tests/integration/registry.test.ts"

# At phase start, launch together:
Task: "T010 GraniteRegistry.sol in contracts/"
Task: "T011 deploy script in scripts/deploy-registry.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2 → Phase 3
2. **STOP and VALIDATE**: quickstart.md US1 walkthrough on Kubo + anvil
3. This alone is recognizably Granite: immutable, chained, announced, registered publishes

### Incremental Delivery

1. Add US2 → reading with the TinkerPop cache (validate cold/warm/wiped equality)
2. Add US3 → discovery (validate the 60 s announcement bound)
3. Add US4 → multi-publisher directories
4. Phase 7 polish, then the full quickstart walkthrough as the release gate

---

## Notes

- 41 tasks total: Setup 3, Foundational 6, US1 10, US2 7, US3 6, US4 5, Polish 4
- Integration tests require live Kubo, anvil, and (US2+) Gremlin Server/TinkerGraph — see quickstart.md prerequisites
- Commit after each task or logical group; every checkpoint is a valid stopping point
