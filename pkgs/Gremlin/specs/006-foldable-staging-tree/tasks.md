---
description: "Task list for Foldable Staging Tree"
---

# Tasks: Foldable Staging Tree

**Input**: Design documents from `specs/006-foldable-staging-tree/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui.md](contracts/ui.md), [quickstart.md](quickstart.md)

**Tests**: Tests are MANDATORY (Constitution III). Every story includes test tasks that are written first and seen to fail.

**Organization**: Tasks are grouped by user story, so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US3)
- All paths are relative to the package root `pkgs/Gremlin/`

## Conventions for every task

- **Style:**
  - Two-space indents.
  - `if(` / `for(` / `while(` / `catch(` with no space before the parenthesis.
  - Single-expression arrow bodies are wrapped in parentheses, with the body on its own indented line.
  - `.method()` chain continuation lines aren't indented.
  - Trailing commas on multi-line entries.
  - Real glyphs (▸ ▾ … −) in user-facing text.
- **Imports:** `#lib/…` with a `.js` extension for `.ts` modules, such as `#lib/pendingTree.js`. `.svelte` keeps its extension.
- **Component tests** run in the client project (Playwright Chromium) with the remotes mocked, as `PublishDialog.svelte.test.ts` already does. **Pure tests** run in the server project.
- **Comments:** only for a non-obvious *why*. Expected: why `nest()` needs no sort, since the pending list is already in `comparePaths` order.
- **Terms:**
  - A **row** is a `Row` from data-model.md.
  - A **context row** is one with no `spot`.
  - A **section** is Staged or Unstaged.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Keep the existing dialog tests meaningful once rows nest.

- [X] T001 In `src/lib/components/PublishDialog.svelte.test.ts`, make the `rows(section)` helper read each row's own line, `li > .row`, so a row's text no longer includes the rows nested inside it. Then change only the labels the existing assertions expect: `icon/hat/ +2 −1` becomes `hat/ +2 −1`, under a context row `icon/`. Every other existing test keeps its meaning, so expect only the label assertions to fail until T006.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure `nest()` every story renders from (research.md R1, R2, R5, R6).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `src/lib/pendingTree.test.ts` (server project), seen to fail. It covers `nest(spots)` with `PendingSpot`s built as `PublishDialog.svelte.test.ts`'s `spot()` builds them:
  - **Nesting (FR-001):** `/icon/`, `/icon/hat/`, and `/icon/cap/` give one top-level row `icon`, with children `hat` and `cap`, in that order.
  - **Context rows (FR-003):** `/icon/hat/top/` alone gives `icon` → `hat` → `top`, where `icon` and `hat` have no `spot`, and `top` has one.
  - **The root (FR-002):** `/` with `/docs/` gives one top-level row, `name: ''`, `path: []`, with the `spot`, holding `docs`.
  - **Counts (FR-007):** `/import/` plus 3 Spots under it, one of them two levels deep, gives `import.pending === 3`. A context row's `pending` counts only its rows with a `spot`, and a leaf's is `0`.
  - **Order (FR-005):** siblings come in the input order, `art`, `docs`, `Icon` for input sorted as `pendingSpots()` sorts it. The output never re-sorts: reversed input comes out reversed.
  - **Names:** `帽子 🎩`, `été`, and `two words` are kept exactly.
  - **Empty:** `nest([])` is `[]`.
  - **Dedup:** a Spot whose path is also another Spot's ancestor holds that Spot. No row is created twice for one path.
- [X] T003 Create `src/lib/pendingTree.ts` exporting `interface Row { name, path, spot?, pending, children }` (data-model.md) and `nest(spots: Array<PendingSpot>): Array<Row>`, making T002 pass.
  - One pass, with a `Map` from `JSON.stringify(path)` to `Row`. For each Spot, make any missing ancestors as context rows, set its own row's `spot`, and add 1 to each ancestor's `pending`.
  - Import `PendingSpot` as a type from `#lib/remotes/pending.remote.js`.
  - Add the comment R1 names.

**Checkpoint**: `pnpm exec vitest --run --project server src/lib/pendingTree.test.ts` passes.

---

## Phase 3: User Story 1 — See pending Spots as a tree (Priority: P1) 🎯 MVP

**Goal**: Each section shows its pending Spots nested by path, labelled by their own names, with context rows for ancestors that aren't pending.

**Independent Test**: With pending `/`, `/icon/`, `/icon/hat/`, `/icon/hat/top/`, and `/docs/`, open Publish. Each section nests by path, each row shows only its name, and staging a row moves it to the other section, nested in place.

### Tests for User Story 1 ⚠️

- [X] T004 [US1] Add to `src/lib/components/PublishDialog.svelte.test.ts`, seen to fail. Each test mocks `pending` with its own lists:
  - **US1-1:** unstaged `/icon/`, `/icon/hat/`, and `/icon/cap/`. The Unstaged section has one top-level `li`, `icon/`, whose nested list holds `hat/` and `cap/`, and no row's text includes `icon/hat/`.
  - **US1-2:** unstaged `/icon/hat/top/` alone. `icon/` and `hat/` are rows without a checkbox (`.context`) and without a summary, and `top/` has both.
  - **US1-3:** staged `/icon/`, unstaged `/icon/hat/`. Staged has `icon/` with a checked checkbox. Unstaged has `hat/` inside a context `icon/`.
  - **US1-4, FR-004:** clicking `hat/`'s checkbox calls `stage({ ids: [<hat's id>], staged: true })`, and only that.
  - **US1-5:** a staged root heads the Staged section labelled `/`, with the other staged rows nested inside it.
  - **US1-6:** `docs/`, `Icon/`, and `art/` keep the order `pending` gave them.

### Implementation for User Story 1

- [X] T005 [US1] Rewrite `src/lib/components/FoldingList.svelte`, replacing its static placeholder, as the recursive list in [contracts/ui.md](contracts/ui.md), without folding yet.
  - **Props:** `rows`, `section`, and `onstage`.
  - **Markup:** a `<ul>` with, for each row keyed by `name`, an `<li>` holding:
    - a `<div class="row">`. A Spot row has a `<label>` with its checkbox (`checked={spot.staged}`, `onchange={() => onstage(spot)}`) and its label, then a `<span>` with its summary, “new” or `+${added} −${removed}`. A context row has a `<span class="context">` with its label;
    - then a nested `<FoldingList>` of its children, if it has any.
  - **Labels:** `${name}/`, or `/` for the root (FR-002).
- [X] T006 [US1] In `src/lib/components/PublishDialog.svelte`, replace each section's `{#each spots …}` rows with `<FoldingList rows={nest(spots)} section={id} onstage={(spot) => restage({ ids: [spot.id], staged: !spot.staged })}/>`. Keep the mass-select label above Unstaged's list, and move the `label()` and `summary()` helpers it no longer needs into `FoldingList`. Makes T001 and T004 pass.

**Checkpoint**: US1 works on its own: both sections nest, and staging is unchanged.

---

## Phase 4: User Story 2 — Fold and unfold subtrees (Priority: P1)

**Goal**: Any row with nested rows folds and unfolds, showing a count while folded. Fold state is kept per section while the dialog is open.

**Independent Test**: Fold `import/` and check that its rows are hidden and its count shown. Unfold it to restore them. Stage another row and check that `import/` is still folded. Fold a row in one section and check the other is unaffected.

### Tests for User Story 2 ⚠️

- [X] T007 [US2] Add to `src/lib/components/PublishDialog.svelte.test.ts`, seen to fail:
  - **US2-1, FR-007:** `/import/` with 3 Spots under it. Clicking `import/`'s `button.fold` hides its nested list, and its row reads `import/ (3)` with its summary.
  - **US2-2:** clicking again shows the nested rows. A nested row folded before stays folded.
  - **US2-3, FR-006:** a leaf row has no `button.fold`.
  - **US2-4, FR-008:** fold `import/`, then click another row's checkbox, with `pending` re-mocked to return the moved lists. After the list updates, `import/` is still folded.
  - **US2-5:** the same path, `import/`, in both sections. Folding it in Unstaged leaves Staged's unfolded.
  - **US2-6, FR-010:** the button has `aria-expanded="true"`, or `"false"` once folded, and `aria-controls` naming its nested list's `id` while unfolded. It folds on Enter and on Space through `userEvent.keyboard` after focusing it.
  - **Opening again:** closing and reopening the dialog clears every fold (research.md R4).

### Implementation for User Story 2

- [X] T008 [US2] In `src/lib/components/FoldingList.svelte`, add the props `folded(row)` and `ontoggle(row)`.
  - **The button:** a row with children gets `<button type="button" class="fold" aria-expanded={!folded(row)} aria-controls={id}>`, showing ▸ when folded and ▾ when not, before its label.
  - **Folded:** while folded, the nested list isn't rendered, and the row shows `<span class="count">({row.pending})</span>`.
  - **The id:** `id` is unique per section and path, for example `fold-${section}-${index path}`, and is passed down to the nested list.
- [X] T009 [US2] In `src/lib/components/PublishDialog.svelte`, add `let folds = $state<Record<string, boolean>>({})` and `const keyOf = (section, row) => JSON.stringify([section, row.path])`.
  - **`folded`:** `folded = (section) => (row) => folds[keyOf(section, row)] ?? false`.
  - **`ontoggle`:** sets `folds[key] = !folded(section)(row)`.
  - **Clearing:** `load()` sets `folds = {}`.
  - **Wiring:** pass `folded` and `ontoggle` to each section's `FoldingList`.

  Makes T007 pass.

**Checkpoint**: US1 and US2 work: rows nest, fold, and keep their state.

---

## Phase 5: User Story 3 — Open large imports already folded (Priority: P2)

**Goal**: A row with more than 50 pending Spots inside it starts folded.

**Independent Test**: With 10,000 pending Spots under one folder, open Publish. The folder's row is folded with its count, and the dialog is usable within 2 s.

### Tests for User Story 3 ⚠️

- [X] T010 [US3] Add to `src/lib/components/PublishDialog.svelte.test.ts` and `src/lib/pendingTree.test.ts`, seen to fail:
  - **US3-1, US3-2 (FR-009):** a folder with 51 pending Spots inside starts folded, showing `(51)`. One with exactly 50 starts unfolded.
  - **US3-3:** unfolding the 51 row by hand, then restaging, keeps it unfolded.
  - **SC-002:** 10,000 unstaged Spots under `/import/`. Within 2 s of `showModal()`, the Unstaged section renders one row, `import/ (10000)`, and fewer than 5 `li` elements.
  - In `pendingTree.test.ts`: `FOLD_OVER` is `50`.

### Implementation for User Story 3

- [X] T011 [US3] Export `FOLD_OVER = 50` from `src/lib/pendingTree.ts`. In `src/lib/components/PublishDialog.svelte`, change `folded`'s default from `false` to `row.pending > FOLD_OVER` (research.md R4). Makes T010 pass.

**Checkpoint**: All three stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T012 Style the rows in `src/lib/components/FoldingList.svelte`:
  - nested lists indented with `padding-inline-start`;
  - `.row` laid out as `PublishDialog`'s `li` is now, `display: flex` with `justify-content: space-between`;
  - `button.fold` borderless, at a fixed width so labels align whether a row folds or not;
  - `.context` and `.count` muted.

  Remove the now-unused `li` rules from `src/lib/components/PublishDialog.svelte`.
- [ ] T013 Run `pnpm run lint`, `pnpm run check`, and both test projects, `pnpm exec vitest --run --project server` and `--project client`, and fix anything they report.
- [ ] T014 Walk through quickstart.md's three manual steps, and fix anything that differs.

---

## Dependencies & Execution Order

```text
Setup (T001) ─┐
Foundational (T002 → T003) ─┴─ US1 (T004 → T005 → T006) ─ US2 (T007 → T008 → T009) ─ US3 (T010 → T011) ─ Polish
```

- **T001 and T002** touch different files, so they run in parallel.
- **US2 and US3** build on US1's component and state, and **US3** on US2's `folded`, so the stories run in order.
- **Within a story**, tests come first and are seen to fail. `FoldingList` comes before `PublishDialog`.
- **The test file**: T001, T004, T007, and T010 all edit `PublishDialog.svelte.test.ts`, so they never run in parallel.

## Parallel Example

```bash
Task: "T001 rows() helper in src/lib/components/PublishDialog.svelte.test.ts"
Task: "T002 nest() tests in src/lib/pendingTree.test.ts"
```

## Implementation Strategy

- **MVP**: Setup, Foundational, and US1. The sections nest, which already makes them readable.
- **Then**:
  - US2 adds folding;
  - US3 makes large imports open folded.

  Each one is checked on its own at its checkpoint.

## Notes

- Nothing changes on the server, in remotes, or in what staging does (FR-004, FR-011).
- Commit after each task or logical group.
