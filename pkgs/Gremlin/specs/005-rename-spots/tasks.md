---
description: "Task list for Rename Spots"
---

# Tasks: Rename Spots

**Input**: Design documents from `specs/005-rename-spots/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Revised 2026-11-22** after `/speckit-analyze`, then renumbered:

- **D1**: T002 waits for its failing test.
- **I1**: link `MOUNT`s record `parent`, so unmounting a layer isn't taken for a move.
- **C1**: cycles through link `MOUNT`s are tested.
- **C2**: the remotes' own errors are tested (T017, T048).
- **C3**: Unicode names are tested through the graph.
- **U1**: Follow's publish is specified for published and unpublished mounts.

**Tests**: Tests are MANDATORY (Constitution III). Every story includes test tasks that are written first and seen to fail.

**Organization**: Tasks are grouped by user story, so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US6)
- All paths are relative to the package root `pkgs/Gremlin/`

## Conventions for every task

- **Style:**
  - Two-space indents.
  - `if(` / `for(` / `while(` / `catch(` with no space before the parenthesis.
  - Single-expression arrow bodies are wrapped in parentheses, with the body on its own indented line.
  - `.method()` chain continuation lines aren't indented. Indent only after a line ending in an open grouping symbol.
  - Trailing commas on multi-line entries.
  - Real glyphs (… → ’ “ ”) in user-facing text.
- **Imports:** from `src/lib`, use `#lib/…` with a `.js` extension for `.ts` modules (for example `#lib/names.js`, `#lib/server/renames.js`). `.svelte` keeps its extension.
- **Errors:**
  - Unexpected shapes throw: two link `MOUNT`s of one uuid in one Spot, a link `MOUNT` with an `order`, a layer `MOUNT` with a `path`. Sentinels only where an absence is legitimate.
  - User-facing failures are SvelteKit `error(status, message)`s with the messages in [contracts/remotes.md](contracts/remotes.md), raised in server modules, never only in remotes.
  - In remotes, `HttpError`s pass through, and anything else becomes `error(500, '<Name>: "<message>"')`, as in `listing.remote.ts`.
- **Graph code:** every function takes a `source` (a traversal source or a transaction). Never call `g()` inside it; only remotes do.
- **Graph tests:** run against the local JanusGraph inside `transaction()` from `src/lib/server/testing.ts`, rolled back in `afterEach`. Use `.next()` or `.toList()`, never `.iterate()`. Two users come from `seedUser`, trees from `seedTree`, B's mount of S from `mount`. Remember that `repeat()` is breadth-first, and put `.barrier()` between `order()` and `dedup()`.
- **Block tests:** use `memoryBlocks()` and real viem keys (`testAccount`, `signUpdate`).
- **Comments:** only for a non-obvious *why*. The plan's Constitution Check lists the expected ones.
- **Terms:**
  - A **link** is a `CONTAINS` edge or a **link `MOUNT`**: a `MOUNT` with `uuid`, `path`, and `base` and no `order` (data-model.md).
  - A **layer `MOUNT`** has `order` and no `path`, as before.
  - The running example: S's `/image/hatz/{top,bowler}`, B's root mounting S's root, B renaming `hatz` to `hats`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The shared name rule and the seed helper every later phase uses.

- [X] T001 [P] Write `src/lib/names.test.ts` (FR-007), seen to fail. `validName(name)` returns the trimmed name for `'hats'`, `'  hats  '` (→ `'hats'`), `'Hat'`, `'chapeau ☂'`, `'été'`, `'a?b'`, `'a#b'`, `'50%'`, and `'two words'`. It throws a `400` `HttpError` for `''`, `'   '`, `'.'`, `'..'`, and `'a/b'`, each with its own reason, as in contracts/remotes.md: `“…” isn’t a name: …`. Also export and test `nameProblem(name): string | null`, the reason without throwing, for the dialog.
- [X] T002 Create `src/lib/names.ts` with `validName()` and `nameProblem()`, making T001 pass. Depends on T001, seen to fail. It imports only `error` from `@sveltejs/kit`, so the browser can use it (research.md R11).
- [X] T003 [P] Add `mountLink(source, { from, to, uuid, path, base = path, parent })` to `src/lib/server/testing.ts`. It adds `from −MOUNT{uuid, path, base, parent, createdAt}→ to`, where `parent` is the `uuid` of the Spot holding the lower link, with no `order`, through `addedOne`, as `link` and `mount` do. Also give `link()` an optional `uuid` parameter, defaulting to `uuidV7()`, so tests can read and reuse a link's uuid.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Path resolution and listings that know link `MOUNT`s and shadow by uuid (research.md R2–R4). Every story reads through these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. Every existing test in `listing.test.ts`, `fsEntries.test.ts`, `search.test.ts`, and `ranking.test.ts` must still pass, unchanged, at the end of it.

### Tests

- [X] T004 [P] Add a guard test to `src/lib/server/moves.test.ts` (FR-011): `relinkSpot` of a `CONTAINS` keeps its `uuid`. It passes already; it stays as a guard.
- [X] T005 Add tests for `resolveSpots()` and `listingAt()` to `src/lib/server/listing.test.ts`, seen to fail. Each seeds with `seedUser`, `seedTree`, `mount`, and `mountLink` (T003):
  - **Same as before:** for a tree with no link `MOUNT`s, `resolveSpots({ source, from, path })` gives the same Spot ids, in the same order and with the same keys, as the old `resolvePath()`. Check `[]`, a 3-deep path, and a path through two layer mounts.
  - **Follows a link `MOUNT`:** B's `image` Spot `−MOUNT{uuid: U, path: 'hats'}→` S's `hatz`. `resolveSpots(['image', 'hats'])` includes S's `hatz`, and `resolveSpots(['image', 'hatz'])` doesn't include it through S's `CONTAINS` (shadowed, FR-013).
  - **Owner outranks:** B mounts S at order 0 above T at order 1, and T has a link `MOUNT` of S's link `U` named `caps`. Through B, S's own `hatz` wins, and `caps` doesn't resolve.
  - **Link `MOUNT` isn't a layer:** `listingAt(['image'])` lists `hats` as a child and doesn't merge `top` or `bowler` into `/image/` (R4).
  - **One name per uuid:** B's `/image/` lists `hats` and not `hatz`. `hats` lists `top` and `bowler`, and its `parents` names B's `image` Spot.
  - **Merged name:** B's own `CONTAINS` `hat` and S's `hat` still merge under one `hat`, as before.
  - **Orphaned:** after S's `hatz` `CONTAINS` is dropped, B's `/image/` still lists `hats` holding `top` and `bowler` (FR-014).
  - **Unmounted:** after B's root stops mounting S, B's `/image/` still lists `hats`, with `moved: false` (FR-014).
  - **Cycle:** S's `hatz` layer-mounts B's root. `resolveSpots(['image', 'hats', 'image', 'hats'])` resolves and returns S's `hatz`, and `listingAt(['image', 'hats'])` lists B's `image` among the children once.
  - **`moved`:** every `Child` has `moved: false` in these trees. US6 adds the `true` cases.
  - **Guards:** a Spot with two link `MOUNT`s of one uuid throws, and a `MOUNT` with both `path` and `order` throws.
- [X] T006 [P] Add to `src/lib/server/search.test.ts`, seen to fail: with B's link `MOUNT` `hats` of S's `hatz`, a search under B's root for `hat` finds `/image/hats` and not `/image/hatz`, and a search starting at `['image', 'hats']` finds `top`. Search under B's root finishes when S's `hatz` layer-mounts B's root, as the existing “finishes when the tree has a cycle” case does, and each match is listed once.
- [X] T007 [P] Add to `src/lib/server/fsEntries.test.ts`, seen to fail: with B's link `MOUNT` `hats`, `listEntries` for B at `image` lists `hats` and not `hatz`, and `statEntry` of `image/hats` is a directory.

### Implementation

- [X] T008 In `src/lib/server/listing.ts`, change `precedence()` so a `MOUNT` with a `path` maps to the segment boundary, as `CONTAINS` does, and only a path-less `MOUNT` contributes its `order`, with a comment saying why. Change `withMounts()` to follow `outE('MOUNT').hasNot('path')` (R4).
- [X] T009 In `src/lib/server/listing.ts`, add `export async function resolveSpots({ source, from, path, maxDepth = 10 }): Promise<Array<{ id: Id, key: Key }>>` (R2), replacing `resolvePath()`:
  - Start from `from` with key `[]`. For each segment, one traversal from the current Spots expands each into its layers (`withMounts`), with each layer's relative key from `precedence()`.
  - It aggregates the layers, then projects for each one its id and key, its links named for the segment (`outE('CONTAINS', 'MOUNT').has('path', segment)`) with `uuid` and target id, and its links of any name whose `uuid` is among the link `MOUNT` uuids of the aggregated layers.
  - In JavaScript, a candidate's key is its start's key, then the relative key, then `SEGMENT`. Sort with `compareKeys`. Keep a candidate only if no layer that outranks it holds an edge with the same uuid, under any name. Then the survivors are the next segment's starts.
  - Comment why this is per segment: precedence keys are compared lexicographically, which Gremlin can't do mid-traversal.
  - Keep `resolvePath()` only if a caller still needs it after T011–T013; otherwise delete it.
- [X] T010 In `src/lib/server/listing.ts`, add `listingAt({ source, from, path, maxDepth })`, which calls `resolveSpots()`, then runs `listingTraversal()`'s per-layer projection from `source.V(...ids)`, prefixing each row's key with its start's key, and returns `assembleListing(rows)`.
  - `childrenOf()` projects every `CONTAINS` and link `MOUNT` with `label`, `uuid`, `path`, target, and, for a link `MOUNT`, a placeholder `moved: false` (US6 fills it).
  - `assembleListing()` walks layers in precedence order, keeps the first edge per `uuid`, drops later ones, then merges by name, as today (R3).
  - Add `moved: boolean` to `Child`. It's true only when the winning edge behind the name is a link `MOUNT` in the user's own Spot that is moved (US6).
  - Throw on the guards T005 lists.
- [X] T011 Switch `src/lib/remotes/listing.remote.ts` and `layersAt()` in `src/lib/server/ranking.ts` to `listingAt()`. `ranking.test.ts` passes unchanged.
- [X] T012 [P] In `src/lib/server/search.ts`, `startOf()` uses `resolveSpots()`, and the descent and name projection include link `MOUNT`s (`outE('CONTAINS', 'MOUNT').has('path')`), keeping the cycle guard the `CONTAINS` descent uses, making T006 pass.
- [X] T013 [P] In `src/lib/server/fsEntries.ts`, `spotTraversal`, `listEntries`, and `statEntry` use `resolveSpots()` and `assembleListing()`'s children, so the editor hides shadowed links, making T007 pass. `renameEntry` is left for T038.

**Checkpoint**: `pnpm test:unit --run --project server` passes, and every listing is the same as before for trees without link `MOUNT`s.

---

## Phase 3: User Story 1 — Rename a Spot from the listing (Priority: P1) 🎯 MVP

**Goal**: A signed-in user renames one of their own Spots from a tile or a table row, keeping its edge, uuid, and contents.

**Independent Test**: In B's own `/image/`, rename folder `hatz` and file `hat` through the menu; each lists under its new name with the same contents, and both panes refresh.

### Tests for User Story 1 ⚠️

- [X] T014 [P] [US1] Create `src/lib/server/renames.test.ts` with quickstart.md scenario 1, seen to fail:
  - **Folder (US1-1):** B's `/image/hatz/{top,bowler}`. `renameSpot({ source, address: B, path: ['image'], from: 'hatz', to: 'hats', now })` returns `{ path: ['image', 'hats'] }`. The `CONTAINS` edge has the same id and `uuid`, its `path` is `hats`, `/image/` lists `hats` and not `hatz`, and `/image/hats/` lists `top` and `bowler`.
  - **File (US1-2):** B's `/image/hat` with two SVG Contents through `attach()`. Rename to `cap`: `/image/cap` holds the same two Contents in the same order, and `/image/hat` isn't listed.
  - **Unchanged name (FR-008):** renaming `hat` to `hat` writes nothing: every edge's properties are as before.
  - **Mounts kept (FR-003):** a Spot with a layer `MOUNT` keeps it after a rename.
  - **Unicode (edge case):** renaming `hatz` to `chapeaux 🎩` and then to `e\u0301te\u0301` stores, lists, and resolves each name exactly as typed, with no NFC normalization. `'  hats  '` is stored as `hats`.
- [X] T015 [P] [US1] Create `src/lib/components/RenameDialog.svelte.test.ts` (client project), seen to fail, with the `renameSpot` command stubbed: the input is prefilled with `name` and selected; Cancel, Escape, and confirming the unchanged name make no call; confirming `hats` calls `renameSpot({ path, from, to: 'hats' })` and then `onrenamed(['image', 'hats'])`.
- [X] T016 [P] [US1] Add to `src/lib/components/FileBrowser.svelte.test.ts`, seen to fail: when signed in, a tile's context menu in the icon view and a row's in the table view offer **Rename “hat”…**, which opens `RenameDialog` with `path` and `name`; after `onrenamed`, `listing({ path })` is refreshed.
- [X] T017 [P] [US1] Create `src/lib/remotes/renameSpot.test.ts`, seen to fail, modelled on `deleteSpot.test.ts`: without a session it gives `401`; an `HttpError` from `renameSpot` (`409`) passes through with its message; any other throw becomes `500 RenameSpot: "…"`; an invalid `to` is refused by the schema before `renameSpot` runs.

### Implementation for User Story 1

- [X] T018 [US1] Create `src/lib/server/renames.ts` with `renameSpot({ source, address, path, from, to, now })` for own links (R5 steps 1–3 and the own-edge case of step 5): `validName(to)`; resolve the layers at `path` with `resolveSpots()`; find the visible edges named `from` from the listing's shadowing (R3); return early when `to === from`; set `path = to` on each visible edge whose Spot the user owns (`ownersOf()` in `src/lib/server/janusgraph.ts`, as `assertOwned` does). Return `{ path: [...path, to] }`. Makes T014 pass.
- [X] T019 [US1] Create `src/lib/remotes/renameSpot.remote.ts`: a `command` with `v.object({ path: v.array(v.string()), from: v.string(), to: v.pipe(v.string(), v.check((name) => nameProblem(name) == null, …)) })`. It resolves the session address (`401` without one), runs `renameSpot` in `inTransaction()`, and maps errors as the conventions say, as `moveSpot.remote.ts` does. Makes T017 pass.
- [X] T020 [US1] Create `src/lib/components/RenameDialog.svelte` per [contracts/ui.md](contracts/ui.md): a modal `<dialog>` with one text input, **Rename**, and **Cancel**; props `path`, `name`, `onrenamed`, `onerror`; on success, refresh `listing({ path })` and call `onrenamed`; errors go to `onerror`. Leave the `nameProblem` wiring to T037. Makes T015 pass.
- [X] T021 [US1] In `src/lib/components/FileBrowser.svelte`, add **Rename “name”…** to the tile and row context menus, shown only when signed in, opening `RenameDialog`; pass `onerror` through to the page's `ErrorDialog`. Makes T016 pass.

**Checkpoint**: US1 works on its own: own Spots rename from tiles and rows, and both panes on the same folder refresh through `listing({ path })`.

---

## Phase 4: User Story 2 — Rename another user's Spot in your own view (Priority: P1)

**Goal**: A rename of another layer's link mounts that link in the user's own Spot, with the new path, and nothing in the other user's tree changes.

**Independent Test**: Seed S's `/image/hatz/{top,bowler}` and B mounting S. As B, rename `hatz` to `hats`; B lists `hats` with S's entries, B's layer holds one link `MOUNT`, and S's snapshot is unchanged.

### Tests for User Story 2 ⚠️

- [X] T022 [P] [US2] Add quickstart.md scenarios 2–5 to `src/lib/server/renames.test.ts`, seen to fail:
  - **Other's rename (US2-1, US2-2):** B's `image` Spot is created by `spotAt()` and holds exactly one link `MOUNT` to S's `hatz`, with the uuid of S's link, `path: 'hats'`, and `base: 'hatz'`. B lists `hats` and not `hatz`, and B's `/image/hats/` lists `top` and `bowler`. `snapshot({ source, root: S })` is equal before and after (SC-003). `ownersOf(S's hatz)` is only S.
  - **Shows through (US2-3 to US2-5):** S adds `fedora` to `hatz`, then renames `hatz` to `caps`, then unlinks it. B sees `hats`, with `fedora`, each time.
  - **Merged name (US2-6, FR-005):** B's own `hat` and S's `hat` become one `cap`: B's `CONTAINS` has `path: 'cap'`, plus one link `MOUNT` of S's link, and B sees no `hat`.
  - **Rename again (US2-7):** renaming `hats` to `caps` sets the mount's `path`; there's still one link `MOUNT`, and `base` stays `hatz`.
  - **Rename back (edge case):** renaming `hats` back to `hatz` keeps the link `MOUNT`, with `path: 'hatz'`. A later rename by S to `caps` doesn't show through.
  - **Three layers (edge case):** S's and T's `hat`, both mounted by B, get one link `MOUNT` each.
  - **Unicode mount:** B renames S's `hatz` to `帽子`. The link `MOUNT`'s `path` is `帽子`, and `/image/帽子/` lists `top` and `bowler`.
- [X] T023 [P] [US2] Add to `src/lib/server/edits.test.ts`, seen to fail: `unlinkSpot` of B's `hats` retires B's link `MOUNT` (and only it), so B's `/image/` lists S's `hatz` again; `retire()` of a published link `MOUNT` leaves a `REMOVED` marker keyed by its `uuid`, not its target.
- [X] T024 [P] [US2] Add to `src/lib/server/changes.test.ts`, seen to fail: a link `MOUNT`'s entry is keyed by its `uuid`, with `Fields` `{ kind: 'MOUNT', uuid, path, target, creator }` and fingerprint `[target, creator ?? null, path]`; a layer `MOUNT` and a link `MOUNT` of one target coexist in one Spot; two link `MOUNT`s of one uuid in one Spot throw; renaming a published `CONTAINS` or link `MOUNT` makes it pending under its old key, and renaming it back clears it (FR-018).

### Implementation for User Story 2

- [X] T025 [US2] In `renameSpot` in `src/lib/server/renames.ts`, handle the other-layer case of R5 step 5: for each visible edge not in a Spot the user owns, find an existing link `MOUNT` with that uuid in `spotAt({ source, address, path, now })` and set its `path`, or add `MOUNT{uuid, path: to, base: from, parent: <uuid of the visible edge's out-vertex>, createdAt: now}` to that edge's target. Makes T022 pass.
- [X] T026 [US2] In `src/lib/server/edits.ts`, `retire()` keys a `MOUNT` with a `uuid` by that uuid; `unlinkSpot()` also retires a link `MOUNT` in the user's Spot with that name. Makes T023 pass.
- [X] T027 [US2] In `src/lib/server/changes.ts`, add the link `MOUNT` variant to `Fields`; in `entriesOf()`, key a `MOUNT` with a `path` by its `uuid`, fingerprint it as data-model.md says, count only layer mounts in the “mounts twice” check, and throw on a second link `MOUNT` of one uuid (R10). Add the link variant to the `Mounting` type in `src/lib/updates.ts`, so `keyOf` keys it by `uuid`. Makes T024 pass.
- [X] T028 [US2] In `src/lib/components/FileBrowser.svelte`, **Delete** on a tile whose winning edge is the user's own link `MOUNT` calls the existing delete path, which now removes the rename (contracts/ui.md). Add the case to `src/lib/components/FileBrowser.svelte.test.ts`.

**Checkpoint**: US1 and US2 work: B renames S's Spots in B's view, B's pending list shows the change, and S's tree is unchanged.

---

## Phase 5: User Story 3 — Rename the Spot being viewed (Priority: P2)

**Goal**: Rename from a breadcrumb, with every pane on that path following to the new one.

**Independent Test**: View `/media/book/by/Austen/`, rename `by` to `author` from its crumb; the view, address, and the other pane follow.

### Tests for User Story 3 ⚠️

- [X] T029 [P] [US3] Create `src/lib/relocations.test.ts` (FR-016), seen to fail: `follow(['a', 'b', 'x'], { from: ['a', 'b'], to: ['a', 'c'] })` gives `['a', 'c', 'x']`; a path equal to `from` gives `to`; `['a', 'bb']` and `['z']` are unchanged; a root child `{ from: ['b'], to: ['c'] }` and a 4-deep prefix both work.
- [X] T030 [P] [US3] Add to `src/lib/components/FileView.svelte.test.ts`, seen to fail: when signed in, each crumb except the root shows a ✎ control that opens `RenameDialog` with the crumb's parent path and name; the root shows none (US3-4); after `relocate({ from: ['a', 'b'], to: ['a', 'c'] })`, a FileView at `['a', 'b', 'x']` has `path` `['a', 'c', 'x']`, and one at `['a']` is unchanged.

### Implementation for User Story 3

- [X] T031 [US3] Create `src/lib/relocations.svelte.ts` with `relocate({ from, to })`, `follow(path, relocation)`, and a `$state` `latest` (R12). Makes T029 pass.
- [X] T032 [US3] In `src/lib/components/Breadcrumbs.svelte`, add the ✎ control per crumb (not the root), shown on hover or focus while signed in, opening `RenameDialog`. In `src/lib/components/RenameDialog.svelte`, call `relocate({ from: [...path, name], to })` on success. In `src/lib/components/FileView.svelte`, add an `$effect` that sets `path = follow(path, relocations.latest)` when `latest.from` is a prefix of `path`. Makes T030 pass. The first pane's `bind:path` in `src/routes/[...path]/+page.svelte` already drives the address; check it does.

**Checkpoint**: Renames from crumbs keep every pane on the same Spot.

---

## Phase 6: User Story 4 — Understand why a rename didn't work (Priority: P2)

**Goal**: Every refusal shows a reason and leaves the tree unchanged, in the app and in the editor.

**Independent Test**: Rename to a sibling's name, to `''`, and to `a/b`; each shows why and changes nothing. Signed out, no rename is offered.

### Tests for User Story 4 ⚠️

- [X] T033 [P] [US4] Add quickstart.md scenario 6 to `src/lib/server/renames.test.ts`, seen to fail. Each compares `snapshot()` of both users before and after:
  - **Clash (US4-1, FR-006):** B's own `/image/` holds `hat` and `cap`; renaming `hat` to `cap` throws `409` `/image/ already contains “cap”`. A clash only with a mounted layer's `cap` is allowed and merges.
  - **Case (edge case):** renaming `Hat` to `hat` succeeds; it isn't a clash.
  - **Invalid (US4-2, FR-007):** `''`, `'   '`, `'.'`, `'..'`, and `'a/b'` throw `400` with `validName()`'s reason.
  - **Stale (edge case):** renaming `gone` throws `404` `No entry named “gone” at /image/`.
- [X] T034 [P] [US4] Add to `src/lib/components/RenameDialog.svelte.test.ts` and `src/lib/components/FileBrowser.svelte.test.ts`, seen to fail: for each invalid name, **Rename** is disabled and the reason shows under the input; a `409` from the stub calls `onerror` with its message and leaves the dialog's name as typed; signed out, no tile, row, or crumb offers a rename (US4-3, FR-009).
- [X] T035 [P] [US4] Add to `src/lib/server/fsEntries.test.ts`, seen to fail (FR-017): `renameEntry` of B's own `image/hatz` to `image/hats` keeps the edge's uuid; of S's mounted `hatz`, it makes a link `MOUNT` as T022 does; to a sibling's name it throws `409`; to `..` it throws `400`; the extension checks still apply.

### Implementation for User Story 4

- [X] T036 [US4] In `renameSpot` in `src/lib/server/renames.ts`, throw `404` when no visible edge is named `from`, and `409` when the user's own Spot at `path` has another `CONTAINS` or link `MOUNT` with `path = to` (reuse or extend `nameClash` from `src/lib/server/moves.ts`). Makes T033 pass.
- [X] T037 [US4] In `src/lib/components/RenameDialog.svelte`, run `nameProblem()` on each input, set the input's custom validity, show the reason, and disable **Rename** (FR-007). Makes T034 pass.
- [X] T038 [US4] In `src/lib/server/fsEntries.ts`, `renameEntry` calls `renameSpot()` with the edge names once the extension checks pass, instead of relabeling the `CONTAINS` itself; `src/routes/api/fs/[...path]/+server.ts` passes the transaction and `now`. Makes T035 pass.

**Checkpoint**: Stories 1–4 are complete: renames work everywhere, and every refusal explains itself.

---

## Phase 7: User Story 5 — Renames publish as layered commits (Priority: P3)

**Goal**: Own renames publish as edits under the link's uuid; a mounted link's first publish is a prelude naming it by `base`, then the version with its new `path`.

**Independent Test**: As B, rename an own published Spot and one of S's, publish, inspect the Spot versions, and rebuild from storage.

### Tests for User Story 5 ⚠️

- [X] T039 [P] [US5] Add to `src/lib/server/publish.test.ts`, seen to fail, using `memoryBlocks()` and real keys:
  - **US5-1:** B's published `/image/hat` renamed to `cap`: `/image/`'s new version has one `contains` entry under the link's uuid, with `path: 'cap'`, and no tombstone.
  - **US5-2:** B's unpublished link `MOUNT` of S's `hatz` as `hats`: the Update holds a prelude version of B's `image`, with `mounts: [{ uuid, path: 'hatz', target, creator: <S lowercase> }]`, and a version whose `previous` is the prelude's last block, with `path: 'hats'`. The `spots` MST names the version, and the prelude's `previous` is the Spot's last published version, or absent.
  - **US5-3:** after that publish, a rename to `caps` publishes one version with one entry under the uuid.
  - **US5-5:** renaming `hat` to `cap` and back publishes nothing for that link.
  - **No prelude:** a link `MOUNT` with `path === base` publishes one version.
- [X] T040 [P] [US5] Add to `src/lib/server/rebuild.test.ts`, seen to fail (FR-021): after US5-1 to US5-3, `rebuild(latest)` matches `snapshot(root)`, including a new `linked: Array<{ uuid, path, target, creator? }>` on each Spot.

### Implementation for User Story 5

- [X] T041 [US5] In `src/lib/server/publish.ts`, `prepare()` encodes link `MOUNT` `Fields` as `{ uuid, path, target, creator? }` in `mounts`. When a Spot's changes include a never-published link `MOUNT` with `path !== base`, emit a prelude version first with those links under `base`, and chain the version's `previous` to the prelude's last block (R6, contracts/documents.md). Comment why the prelude reads `base`, not the lower link's current path. Makes T039 pass.
- [X] T042 [US5] In `src/lib/server/rebuild.ts`, add `linked` to `Tree` and fill it from `mounts` entries with a `path`, folded by `uuid` as the rest are. In `src/lib/server/testing.ts`, `snapshot()` reports link `MOUNT`s as `linked`. Makes T040 pass.

**Checkpoint**: B's renames, own and others', publish and rebuild exactly.

---

## Phase 8: User Story 6 — Decide what to do when a mounted link moves (Priority: P3)

**Goal**: When S moves a link B has mounted, B is notified and chooses Remove, Follow, or Keep as own.

**Independent Test**: B renames S's `hatz` as `hats`; S moves `hatz` into `/old/`; B gets one notice, and each choice, from a fresh seed, gives the listings, layer, and publish that quickstart.md scenarios 7–10 describe.

### Tests for User Story 6 ⚠️

- [X] T043 [P] [US6] Add quickstart.md scenarios 7–10 to `src/lib/server/renames.test.ts`, seen to fail:
  - **Moved (US6-1, US6-2, US6-7):** after S's `relinkSpot` of `hatz` into `/old/`, `noticesFor({ source, address: B })` gives one `Notice` with `from: ['image']`, `to: ['old']`, `name: 'hats'`, `owner: S`, and `ownerPath: ['old']`. B's `/image/` lists `hats` with `moved: true`, and `/old/` lists S's `hatz`. A second move to `/attic/` gives one notice with `to: ['attic']`; moving back to `/image/` gives none. With S's `old` layer-mounting B's root, `viewPathOf` still gives the shortest path, `['old']`, within 20 steps.
  - **Unmounted:** B removes its layer `MOUNT` of S's root, and `noticesFor(B)` is `[]`.
  - **Not moved:** renames and deletes by S give no notice (assumption in spec.md).
  - **Remove (US6-3):** `removeMount({ source, address: B, mount, now })` returns `{ from: ['image', 'hats'], to: ['old', 'hatz'] }`; `/image/` doesn't list `hats`, `/old/` lists `hatz`, and there's no notice.
  - **Follow (US6-4):** `followMount` makes B's `old` Spot through `spotAt()`, holding the link `MOUNT` with the same `uuid`, `path`, and `base`, and with `parent` set to S's `old` Spot's `uuid`; `/image/` doesn't list `hats`, `/old/` lists `hats` and not `hatz`, and there's no notice.
  - **Keep (US6-5):** `keepMount` leaves B's `image` with a `CONTAINS{path: 'hats', uuid: <new>}` to a new Spot of B's with `MOUNT{order: 0}` to S's `hatz`; `/image/hats/` lists `top` and `bowler`; `ownersOf(S's hatz)` is only S; there's no notice.
  - **Unreachable (scenario 9):** S moves `hatz` under a Spot B doesn't mount; `to` is `null`, `ownerPath` is set, and `followMount` throws `400`.
  - **Follow clash (scenario 10):** B's own `/old/hats` exists; `followMount` throws `409`, and the notice stays.
  - **Errors:** each of the three throws `404` for an unknown edge id and `403` for a mount in another user's Spot; `followMount` throws `409` when the mount isn't moved.
- [X] T044 [P] [US6] Add to `src/lib/server/selection.test.ts`, seen to fail: after `followMount`, selecting B's `old` Spot also selects B's `image` Spot, whose marker carries the same uuid, as moves of `CONTAINS` are paired.
- [X] T045 [P] [US6] Add to `src/lib/server/publish.test.ts` and `src/lib/server/rebuild.test.ts`, seen to fail (FR-024): Remove publishes a tombstone keyed by the uuid; Follow of a **published** mount publishes a tombstone under the uuid in `image`'s version and the entry, with no prelude, in `old`'s, and the two are selected together (T044); Follow of a **never-published** mount publishes nothing for `image`, and `old`'s prelude, naming it by `base`, then its version, naming it by `path` (quickstart.md manual step 5); Keep publishes the tombstone, the new `contains` entry, and the new Spot's layer mount. After each, `rebuild(latest)` matches `snapshot(root)`.
- [X] T046 [P] [US6] Create `src/lib/components/NoticesDialog.svelte.test.ts` (client project), seen to fail, with the commands stubbed: it lists each notice as “*owner* moved “*name*” from /*from*/ to /*to*/”, or “to /*ownerPath*/ in their tree” when `to` is `null`; **Follow** is disabled with a title when `to` is `null`; each button calls its command, then refreshes `notices()` and calls `relocate()` with the returned paths; an error goes to `onerror`.
- [X] T047 [P] [US6] Add to `src/lib/components/FileBrowser.svelte.test.ts` and `src/routes/[...path]/page.svelte.test.ts`, seen to fail: a `Child` with `moved: true` has the class `moved` and a ⚠ badge titled “Moved by its owner”, and its menu offers **Resolve move…**; the actions menu shows **Moved links (n)** only when `notices()` is non-empty.
- [X] T048 [P] [US6] Create `src/lib/remotes/resolveMount.test.ts` and `src/lib/remotes/notices.test.ts`, seen to fail, modelled on `deleteSpot.test.ts`: each of the three commands gives `401` without a session and passes `403`, `404`, and `409` through; `notices()` without a session returns `[]`.

### Implementation for User Story 6

- [X] T049 [US6] In `src/lib/server/listing.ts`, `childrenOf()` projects `moved` for link `MOUNT`s: true when the target has an incoming `CONTAINS` with the mount's `uuid` whose out-vertex `uuid` isn't the mount's `parent` (R7). `assembleListing()` sets `Child.moved` from the winning edge, only for the user's own Spot.
- [X] T050 [US6] In `src/lib/server/renames.ts`, add `viewPathOf({ source, address, spot })`: walk up from `spot` through `CONTAINS`, link `MOUNT`s, and layer `MOUNT`s to B's root, shortest first, at most 20 steps, giving the view path or `null`; and `noticesFor({ source, address })`: for each link `MOUNT` in B's tree (`treeOf` in `src/lib/server/changes.ts`), build a `Notice` (data-model.md) when it's moved, sorted by `from` then `name`. Makes the Moved cases of T043 pass.
- [X] T051 [US6] In `src/lib/server/renames.ts`, add `removeMount`, `followMount`, and `keepMount({ source, address, mount, now })` (R8, R9), each asserting ownership of the mount's Spot (`403`) and returning `{ from, to }`. `followMount` recomputes the notice, throws as T043 says, and relinks the mount onto `spotAt(to)` with its uuid, `path`, `base`, and the new holder's `uuid` as `parent`, then `retire()`s the old one. `keepMount` makes a Spot with a fresh v7 `uuid`, adds `MOUNT{order: 0, createdAt}` to the target and `CONTAINS{path, uuid: v7, createdAt}` from the mount's Spot, then retires the mount, with a comment saying why it isn't a direct `CONTAINS` (ownership). Makes T043 pass.
- [X] T052 [US6] In `src/lib/server/selection.ts`, pair link `MOUNT` markers and entries by `uuid`. Makes T044 and T045 pass, with T041's prelude.
- [X] T053 [P] [US6] Create `src/lib/remotes/notices.remote.ts` (a `query` returning `noticesFor` for the session, `[]` without one) and `src/lib/remotes/resolveMount.remote.ts` (`removeMount`, `followMount`, and `keepMount` `command`s taking `v.object({ mount: v.string() })`), as T019 does. Makes T048 pass.
- [X] T054 [US6] Create `src/lib/components/NoticesDialog.svelte` per contracts/ui.md, with a `focus` prop for one mount's notice. Makes T046 pass.
- [X] T055 [US6] In `src/lib/components/FileBrowser.svelte`, add the `moved` class, the ⚠ badge, and **Resolve move…** opening `NoticesDialog` focused on that mount. In `src/routes/[...path]/+page.svelte`, add **Moved links (n)** to the actions menu, opening `NoticesDialog`. Makes T047 pass.

**Checkpoint**: All six stories work, and each notice resolves with one choice.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T056 [P] Add a timing case to `src/lib/server/listing.test.ts`: `listingAt()` at depth 10 with 3 layer mounts and one link `MOUNT` per level takes under 150 ms on the local JanusGraph, as plan.md targets. Skip it when `CI` is set, as `publish.perf.test.ts` does.
- [X] T057 [P] Delete `resolvePath()` and `listingTraversal()` from `src/lib/server/listing.ts` if nothing imports them, and update `docs/` or JSDoc that names them.
- [X] T058 Run `pnpm run lint`, `pnpm run check`, `pnpm test:unit --run --project server`, and `pnpm test:unit --run --project client`; fix everything they report.
- [ ] T059 Walk through quickstart.md's five manual steps with two wallets, and fix anything that differs. Record the result in `specs/005-rename-spots/quickstart.md` if a step needed changing.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none. T001 and T003 run in parallel; T002 follows T001.
- **Foundational (Phase 2)**: depends on T003. It blocks every story. T005 precedes T008–T010; T011–T013 follow T010.
- **US1 (Phase 3)**: after Phase 2. The MVP.
- **US2 (Phase 4)**: after US1, since T025 extends T018's `renameSpot`.
- **US3 (Phase 5)**: after US1 (it reuses `RenameDialog`). Independent of US2.
- **US4 (Phase 6)**: after US1. T038 also needs T025 for its mounted-link case.
- **US5 (Phase 7)**: after US2 (T027's keys and fingerprints).
- **US6 (Phase 8)**: after US2; T045 and T052 also need US5's prelude (T041).
- **Polish (Phase 9)**: after the stories wanted.

### User Story Dependencies

```text
Setup → Foundational → US1 ─┬─ US2 ─┬─ US5 ─┐
                            │       └───────┴─ US6
                            ├─ US3
                            └─ US4 (T038 after T025)
```

- **Shipping US2 before US5:** B's pending list shows link `MOUNT`s correctly (T027), but publishing them would encode no prelude and miss `linked` in rebuilds. Don't publish a layer with link `MOUNT`s until US5 is in.

### Within Each User Story

- Tests are written and seen to fail before implementation.
- Server functions before remotes, remotes before components.
- `renames.ts` is edited by T018, T025, T036, T050, and T051, in that order, so those never run in parallel.

### Parallel Opportunities

- Phase 1: T001 and T003; then T002.
- Phase 2: T004, T006, T007 alongside T005; T012 and T013 after T010.
- Each story's test tasks marked [P] run together, as they touch different files.
- After US1: US3 and US4 can run alongside US2, apart from T038.
- US6: T053 alongside T050–T052.

---

## Parallel Example: User Story 6

```bash
# Tests together:
Task: "T043 notices and resolutions in src/lib/server/renames.test.ts"
Task: "T044 Follow pairing in src/lib/server/selection.test.ts"
Task: "T046 NoticesDialog in src/lib/components/NoticesDialog.svelte.test.ts"
Task: "T047 moved badge in src/lib/components/FileBrowser.svelte.test.ts"

# Then remotes beside the server functions:
Task: "T053 notices.remote.ts and resolveMount.remote.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 and Phase 2: the listing knows link `MOUNT`s, and nothing else changes.
2. Phase 3: own renames from tiles and rows.
3. **Stop and validate**: quickstart.md scenario 1 and manual step 1 for an own Spot.

### Incremental Delivery

1. US1 → own renames.
2. US2 → renames of others' Spots, the critique use case. Don't publish them yet.
3. US3 and US4 → breadcrumbs and refusals.
4. US5 → publishing, with preludes.
5. US6 → move notices.

---

## Notes

- [P] tasks touch different files and depend on no incomplete task.
- Commit after each task or logical group.
- Keep as own (T051) follows research.md R9, a new Spot that layer-mounts the target, not a direct `CONTAINS`, pending the user's confirmation.
