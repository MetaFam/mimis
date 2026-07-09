# Implementation Plan: Spider & CAR Transfer

**Branch**: `master` (spec directory: `002-spider-car`) | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-spider-car/spec.md`

## Summary

Two new `granite` commands. `spider <dir>` walks a directory, shows a hand-rolled terminal tree selector (hidden/ignored entries deselected by default, `ignore`-package gitignore semantics), imports each selected file into Kubo as UnixFS with raw leaves and Rabin (content-defined) chunking, builds the granite node tree with the existing `writeTree`, assembles an Update document (chained to the publisher's latest when the registry is reachable, chainless with a warning otherwise), and exports the whole DAG as a CAR via Kubo's `dag export` — one root, complete. `load <file.car>` imports the CAR via `dag import`, validates the update and every reachable document offline (missing/malformed ⇒ loud failure naming the offender), notes it in the cache when configured, and never touches the registry or pubsub. Kubo does all the heavy lifting: the only new runtime dependency is `ignore`.

## Technical Context

**Language/Version**: TypeScript (ESM) on Node ≥ 24 (native type stripping; `.node-version` pins v24.16)

**Primary Dependencies**: Existing five (`kubo-rpc-client`, `@ipld/dag-cbor`, `multiformats`, `viem`, `gremlin`) plus **`ignore`** (gitignore-semantics matching, same package the sibling Gremlin app uses). UnixFS import, chunking, CAR encode/decode all delegated to the Kubo daemon (`add`, `dag.export`, `dag.import` via the existing RPC client).

**Storage**: File content as UnixFS blocks in Kubo (gateway-interoperable); tree/update as existing dag-cbor documents; archives as standard CARv1 files; cache participation unchanged (structure only)

**Testing**: `node:test`; unit tests drive the walker/selection/ignore logic against fixture directories and the UI model without a TTY; integration tests round-trip spider → CAR → wipe → load → resolve against live Kubo (+ anvil for chaining)

**Target Platform**: Linux/macOS terminals; selection UI is plain ANSI + `node:readline` keypresses (arrows/space/enter/h), no mouse

**Project Type**: Extension of the existing library + CLI

**Performance Goals**: Spider of 1,000 files ready for interaction quickly enough to meet SC-001 (< 2 min end-to-end including the user's selection); archive size dominated by file bytes, not overhead

**Constraints**: Spider requires a publishing key (updates carry `publisher`); registry reachability optional at generation (prev chaining degrades gracefully, FR/assumption); load is strictly local (FR-010); symlinks never followed (FR-011); no codec/schema changes — a file leaf is a *convention* over the existing Node shape, not a new document type

**Scale/Scope**: Directories up to ~10k entries; single-file archives; no watch/diff/incremental modes (spec assumption)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Radical Minimalism | ⚠️ JUSTIFIED | +1 dependency (`ignore`) — Complexity Tracking row 1; UI hand-rolled (no TUI framework); UnixFS/CAR machinery delegated to the already-required Kubo daemon rather than imported |
| II | Content Addressing | ✅ PASS | File content becomes UnixFS blocks addressed by CID; `data.content` holds a real CID link so `dag export` traverses into file bytes; identical content ⇒ identical CIDs (FR-005) |
| III | Append-Only Updates | ✅ PASS | Spider produces a normal chained Update; load adds blocks, never mutates or deletes; chainless generation only when the registry is unreachable, and publishing later re-enters the normal flow |
| IV | Union-Mount Composition | ✅ PASS | Loaded updates are mounted like any other; no new materialized views; cache participation unchanged (derived, disposable) |
| V | Sovereign Publishing Keys | ✅ PASS | The spider authors updates under the operator's own key; load performs no publication, registry write, or announcement (FR-010) |

**Post-Phase-1 re-check (2026-07-09)**: Unchanged — the design added no dependencies beyond `ignore` and no new document schemas (the file leaf is a data-map convention validated by the existing codec).

## Project Structure

### Documentation (this feature)

```text
specs/002-spider-car/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── cli.md           # `granite spider` / `granite load` command contract
│   └── archive.md       # CAR contents, file-leaf convention, load validation
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── spider.ts       # Directory walker → SpiderEntry tree; ignore/hidden marking; selection model
├── select.ts       # Terminal tree selector over the selection model (ANSI + node:readline)
├── files.ts        # File ⇄ UnixFS via kubo.add / kubo.cat; file-leaf convention helpers
├── car.ts          # Archive assembly (tree + Update → CAR via dag.export) and load (dag.import + offline validation walk + cache note)
└── cli.ts          # + `spider` and `load` commands (existing file, extended)

tests/
├── fixtures/       # Small directory trees for walker/selection tests
├── unit/spider.test.ts    # walk, ignore/hidden defaults, patterns, selection model, UI model (no TTY)
├── unit/car.test.ts       # validation walk logic against fakes (missing/malformed refs)
└── integration/spider.test.ts  # live round trip: spider --yes → CAR → wipe → load → mount → resolve bytes
```

**Structure Decision**: Same single package. The selection UI is isolated in `select.ts` behind a pure selection model (in `spider.ts`) so unit tests exercise selection logic without a terminal, and `--yes`/pattern runs share the exact model the UI mutates (SC-005's interactive ≡ scripted guarantee by construction).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `ignore` dependency (Principle I) | FR-003 requires standard ignore-file semantics; gitignore matching has many subtle rules (negation, anchoring, directory-only patterns) | Hand-rolled glob matching diverges from the standard in edge cases users will hit immediately; the package is tiny, dependency-free, and already used by the sibling Gremlin app — one idiom across the workspace |
