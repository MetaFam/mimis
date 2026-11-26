# Implementation Plan: Foldable Staging Tree

**Branch**: `master` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-foldable-staging-tree/spec.md`

## Summary

The Publish dialog's Staged and Unstaged sections show their pending Spots as nested lists that can be folded.

- **Building the tree**: a pure `nest()` builds the rows from the pending list the dialog already gets, adding context rows for ancestors that aren't pending and counting pending descendants. The list is already sorted by path, parents first (R1, R2, R5).
- **Rendering**: the unused `FoldingList.svelte` placeholder becomes the recursive list. Each row with children gets a fold button with `aria-expanded` (R3).
- **Fold state**: the dialog keeps it per section and path, cleared when it opens. A row the user hasn't touched starts folded when more than 50 pending Spots are inside it (R4).
- **Unchanged**: staging, the server, and the remotes.

## Technical Context

**Language/Version**: TypeScript 6, Svelte 5 (runes, experimental async), Node 24

**Primary Dependencies**: SvelteKit 3. There are no new dependencies.

**Storage**: None. Fold state is component state.

**Testing**: Vitest 4. The server project runs the pure `nest()` tests, and the client project (Playwright Chromium) runs `PublishDialog`.

**Target Platform**: Evergreen browsers

**Project Type**: Web application (a single SvelteKit app)

**Performance Goals**: With 10,000 pending Spots under one folder, the dialog opens and is usable within 2 s (SC-002). `nest()` is linear in Spots times path depth, and folded subtrees aren't rendered.

**Constraints**:

- Staging semantics, `pending()`'s shape, and every other part of the dialog are unchanged (FR-004, FR-011).
- The fold control must be keyboard-operable and announce its state (FR-010).

**Scale/Scope**:

- One new module, `pendingTree.ts`, and its test.
- One component rewritten from its placeholder, `FoldingList.svelte`, and one edited, `PublishDialog.svelte`, with its test.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-design | Post-design |
| --- | --- | --- | --- |
| I. Public Collaboration | Public, attributable, append-only | ✅ It doesn't touch the graph or publishing | ✅ View only. What is staged and published is unchanged (FR-004, SC-005). |
| II. Succinct Code | Smallest correct expression; reuse | ✅ | ✅ No server change. One pure function and one recursive component, reusing the existing placeholder's name. One number serves both the count and the threshold (R5). |
| III. Thorough Tests | Tests first; edge cases; every error | ✅ Planned | ✅ quickstart.md maps every FR and story to a test. The edge cases covered are context rows, the root, Unicode, an empty list, the threshold boundary at 50 and 51, the 10,000-Spot case, and sections kept apart. There are no new errors to test. |
| IV. Minimal Comments | Only a non-obvious *why* | ✅ | ✅ The expected comment is why `nest()` needs no sort: the pending list is already in path order. |
| Tech: remote functions | — | ✅ No new remotes | ✅ |
| Workflow gate | lint, check, and test pass before merge | ✅ | ✅ quickstart.md, “Automated” |

There are no violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-foldable-staging-tree/
├── plan.md
├── research.md          # R1–R7
├── data-model.md        # Row, fold state
├── quickstart.md
├── contracts/
│   └── ui.md            # FoldingList, PublishDialog
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/lib/
├── pendingTree.ts                        # NEW: nest(), Row, FOLD_OVER
├── pendingTree.test.ts                   # NEW
└── components/
    ├── FoldingList.svelte                # REWRITE: recursive foldable rows
    ├── PublishDialog.svelte              # EDIT: FoldingList per section, fold state
    └── PublishDialog.svelte.test.ts      # EDIT
```

**Structure Decision**: This stays the existing single SvelteKit app.

- `pendingTree.ts` sits in `src/lib/`, since it's browser code with no server dependency, beside `rank.ts` and `search.ts`.
- `FoldingList.svelte` keeps its name, since it was reserved for exactly this.

## Complexity Tracking

None.
