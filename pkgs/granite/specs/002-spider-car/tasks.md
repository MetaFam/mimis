# Tasks: Spider & CAR Transfer

**Input**: Design documents from `/specs/002-spider-car/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/cli.md](./contracts/cli.md), [contracts/archive.md](./contracts/archive.md)

**Tests**: Included — the plan's Testing section mandates unit tests (walker/selection/validation against fixtures and fakes, no TTY) and integration tests (live round trip). Test tasks precede implementation within each story.

**Organization**: Tasks are grouped by user story so each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1, US2, US3)

## Path Conventions

Single package at the repository root (`pkgs/granite/`): sources in `src/`, tests in `tests/{unit,integration,fixtures}/`. Tests import sources via the `#lib/*` subpath alias.

---

## Phase 1: Setup

**Purpose**: The one new dependency and the fixture material every test task walks.

- [X] T001 Add the `ignore` runtime dependency (`pnpm add ignore`) in `package.json` — the only new dependency, justified in plan.md Complexity Tracking
- [X] T002 [P] Create the fixture directory tree in `tests/fixtures/spider/`: nested directories, plain files with known bytes and sizes, a dot-file (e.g. `.env`), a `.gitignore` exercising negation + anchored + directory-only patterns, and a file it ignores (e.g. `scratch.tmp`); symlinks and unreadable entries are created at test runtime in a temp copy (they don't survive git), so the fixture README notes that convention

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The file ⇄ UnixFS layer both the spider (import) and load/round-trip tests (read-back) sit on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Implement `src/files.ts`: `importFile` (Kubo `add` with `rawLeaves: true` + `chunker: 'rabin'` → content root CID, per research.md R1), `catFile` (read-back via Kubo `cat`), extension→MIME lookup, and a `fileLeaf` helper building the `{ content, size, type? }` data map of contracts/archive.md — ordinary Node data, no codec change

**Checkpoint**: File bytes round-trip through Kubo deterministically — user story phases can begin.

---

## Phase 3: User Story 1 — Spider a Directory into an Archive (Priority: P1) 🎯 MVP

**Goal**: `granite spider <dir>` walks a directory, presents an interactive terminal tree selector (hidden/ignored deselected by default), and writes a single CAR containing one complete unpublished Update whose tree mirrors the selection with byte-faithful file content.

**Independent Test**: Spider a small directory, deselect one file, confirm; the archive exists, contains everything selected and nothing deselected, and regenerating from unchanged content yields identical CIDs (spec US1 independent test).

### Tests for User Story 1 (write first — they MUST fail before implementation)

- [X] T004 [US1] Unit tests for the walker and selection model in `tests/unit/spider.test.ts`: walking `tests/fixtures/spider/` yields the expected SpiderEntry tree (name/kind/size/children); symlinks recorded as absent; unreadable entries marked with a reason and the walk continues; dot-files and `.gitignore` matches get `defaultExcluded` and start deselected; toggling a directory toggles its subtree; unreadable entries can never be selected; confirming zero selected files is refused; an entry name containing `/` is rejected loudly (data-model.md invariants, FR-001/003/011)

### Implementation for User Story 1

- [X] T005 [US1] Implement the directory walker in `src/spider.ts`: `walk(dir)` → SpiderEntry tree per data-model.md, collecting `.gitignore` files per directory into an `ignore` matcher, dot-prefix hidden marking, symlinks never followed, unreadable entries captured with their reason without aborting (FR-001, FR-003, FR-011)
- [X] T006 [US1] Implement the pure selection model in `src/spider.ts`: the `selected` bit with subtree toggle on directories, selectable guards (unreadable ⇒ never), selected-file/byte accessors, and empty-selection detection — the single model both the UI and patterns operate on (SC-005 by construction)
- [X] T007 [US1] Implement the terminal tree selector in `src/select.ts`: ANSI rendering (checkbox glyphs, per-entry sizes, dim styling for default-excluded, cursor line), `node:readline` keypress loop with ↑/↓ move, →/← expand/collapse, space toggle, `h` reveal hidden/ignored, enter confirm (refused while empty), `q`/ctrl-c abort, and the on-screen hint line naming exactly these bindings (contracts/cli.md, FR-002, SC-006)
- [X] T008 [US1] Implement archive assembly in `src/car.ts`: selection → `importFile` per file (T003) → `Tree` of directory Nodes and file leaves → existing `writeTree` (`src/publish.ts`) → Update document (`granite: 1`, `publisher` from the key, `root`, `prev` via `registry.latest` when reachable else chainless with a stderr warning, `at`) via `writeValidated` — no registry write, no announcement (research.md R6)
- [X] T009 [US1] Implement CAR export in `src/car.ts`: Kubo `dag.export(updateCid)` streamed to a temporary name in the target directory, renamed to the final name only on completion so no valid-named partial archive can exist (spec edge case, research.md R2)
- [X] T010 [US1] Add the `spider` command to `src/cli.ts`: `<dir>` positional, `--out` defaulting to `<dirname>-<short-update-cid>.car`, publishing-key requirement (missing ⇒ exit 1 with `MissingKeyError`'s message), interactive UI path, `--json` output `{ car, update, root, files, bytes }`, human output listing warnings (unreadable entries, chainless generation), exit codes 0/1/2 per contracts/cli.md

**Checkpoint**: Interactive spidering produces a valid archive — MVP complete and demoable via quickstart US1.

---

## Phase 4: User Story 2 — Load an Archive into the Database (Priority: P2)

**Goal**: `granite load <file.car>` imports an archive into the local database, validates the update and every reachable document offline (loud failure naming the offender), and never touches the registry or pubsub.

**Independent Test**: Load a US1 archive on a clean database; mount the contained update and resolve a path to a file inside it; content is byte-identical (spec US2 independent test).

### Tests for User Story 2 (write first — they MUST fail before implementation)

- [X] T011 [P] [US2] Unit tests for the validation walk in `tests/unit/car.test.ts` against fake blockstores (`tests/fakes.ts` pattern): zero or multiple roots ⇒ rejected; a root that is not a granite Update ⇒ `MalformedDocumentError`; a missing node or `data.content` block ⇒ `UnreachableNodeError` naming the CID; a malformed Node ⇒ `MalformedDocumentError` naming the offender; an absent `prev` target is allowed (partial-snapshot rules) — contracts/archive.md validation order, FR-008, SC-004

### Implementation for User Story 2

- [X] T012 [US2] Implement load in `src/car.ts`: stream the file into Kubo `dag.import`, enforce exactly one root, then the offline validation walk from the Update — codec guards (`asUpdate`/`asNode` from `src/codec.ts`) on every document, recursion through `edges[*].child` and CID `mounts[*].source`, `refs -r` with `offline: true` for every `data.content` UnixFS closure — and only after success note the update in the cache (`putUpdate` + `putNode` as walked, `src/cache.ts`) when a Gremlin endpoint is configured; failures leave imported blocks in place but report nothing as loaded (FR-007…010, research.md R3)
- [X] T013 [US2] Add the `load` command to `src/cli.ts`: `<file.car>` positional, `--json` output `{ update, root, publisher, prev?, blocks }` (`prev` omitted when chainless), validation failure ⇒ exit 1 with the offender named on stderr, strictly local — no registry write, no announcement (contracts/cli.md, FR-010)
- [X] T014 [US2] Integration round trip in `tests/integration/spider.test.ts` against live Kubo (+ anvil, per `tests/integration/env.ts` conventions): spider a fixture tree via the library API with a scripted selection → CAR → load on a clean store → mount the update → resolve a path → bytes identical via `catFile` (SC-002); loading the same CAR twice succeeds without growth (FR-009, SC-003); a truncated CAR is rejected naming the missing CID (SC-004); nothing was registered or announced (FR-010)

**Checkpoint**: Archives round-trip between databases — US1 + US2 both independently verifiable.

---

## Phase 5: User Story 3 — Scripted (Non-Interactive) Spidering (Priority: P3)

**Goal**: `granite spider <dir> --include/--exclude … --yes` runs without any UI, computing the selection from gitignore-syntax patterns; an empty selection is an error, and a scripted run equals the equivalent interactive run.

**Independent Test**: Run the spider with an exclude pattern and `--yes` in a script; the archive matches the pattern selection exactly and no prompt was shown (spec US3 independent test).

### Tests for User Story 3 (write first — they MUST fail before implementation)

- [X] T015 [US3] Unit tests for pattern selection in `tests/unit/spider.test.ts`: include/exclude combinations over the fixture tree, exclude wins ties, gitignore negation honored, patterns compose with default exclusions, matching-nothing detected as an error condition, and pattern-computed selection ≡ the same selection made by model toggles (SC-005, FR-006)

### Implementation for User Story 3

- [X] T016 [US3] Implement pattern selection in `src/spider.ts`: evaluate `--include`/`--exclude` gitignore-syntax patterns (via `ignore`, research.md R4) over the walked tree, mutating the same selection model the UI uses; expose empty-result detection (FR-006, SC-005)
- [X] T017 [US3] Wire `--include`, `--exclude` (repeatable), and `--yes` into the `spider` command in `src/cli.ts`: with `--yes` no UI is shown and the computed selection is used as-is (empty ⇒ exit 1, never an empty archive); patterns without `--yes` pre-seed the UI (contracts/cli.md)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T018 [P] Document the `spider` and `load` commands in `README.md` (usage lines and one-sentence descriptions, matching the existing command list style)
- [X] T019 Run `pnpm run check` (tsc), `pnpm test`, and `pnpm run test:integration` against the dev environment (`pnpm run dev`); fix any drift until all pass
- [X] T020 Execute the quickstart.md manual walkthrough end-to-end: interactive spider with hidden-file opt-in (SC-006), scripted run + empty-selection error (SC-005), load + resolve + `ipfs cat` byte check (SC-002), double load (SC-003), truncated-CAR rejection (SC-004), and a ~1,000-file directory spider to sanity-check SC-001

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T001 and T002 are parallel
- **Foundational (Phase 2)**: T003 needs nothing from Phase 1 at build time but tests exercising it use the Kubo daemon; blocks all user stories
- **User Stories (Phases 3–5)**: All depend on Phase 2
  - **US1 (P1)**: No story dependencies — the MVP
  - **US2 (P2)**: Validation logic (T011–T013) is independent of US1, but the round-trip test T014 consumes US1's assembly — complete US1 first (or at least T005/T006/T008)
  - **US3 (P3)**: Layers patterns onto US1's walker + selection model — depends on T005/T006 and the `spider` command T010
- **Polish (Phase 6)**: After all desired stories

### Within Each User Story

- Test tasks are written first and must fail before implementation begins
- Walker → selection model → UI/assembly → CLI wiring (US1); load core → CLI → integration (US2); model → CLI (US3)

### Parallel Opportunities

- T001 ∥ T002 (Setup)
- T011 (US2 unit tests, `tests/unit/car.test.ts`) can be written in parallel with any US1 implementation task — different files, fake-based
- Once US1's T005/T006 land, US3's T015/T016 can proceed in parallel with US1's UI work (T007) — different concerns in shared files, so sequence commits carefully; T017 waits for T010
- T018 ∥ T019 in Polish

### Parallel Example: while one thread implements US1's UI

```text
Thread A: T007 (src/select.ts UI)
Thread B: T011 (tests/unit/car.test.ts validation-walk tests against fakes)
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 (T001–T002) → Phase 2 (T003)
2. Phase 3 complete (T004–T010)
3. **STOP and VALIDATE**: quickstart US1 — interactive spider of a demo directory produces a `.car`; deterministic CIDs on re-run
4. An archive is already independently valuable as a snapshot, before load exists

### Incremental Delivery

1. MVP (above) → 2. US2 (T011–T014): archives become portable, round trip proven live → 3. US3 (T015–T017): unattended captures → 4. Polish (T018–T020)

---

## Notes

- Total: 20 tasks — Setup 2, Foundational 1, US1 7, US2 4, US3 3, Polish 3
- No new document schemas and no codec changes anywhere — the file leaf is a data-map convention (data-model.md); if a task seems to need a codec change, re-read contracts/archive.md
- Error conventions per FR-012 and the feature-001 classes in `src/errors.ts`: throw `MalformedDocumentError`/`UnreachableNodeError` naming the offender; legitimate absence (no `prev`, no cache configured) is not an error
- Commit after each task or logical group
