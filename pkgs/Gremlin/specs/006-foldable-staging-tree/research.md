# Research: Foldable Staging Tree

Decisions are numbered R1–R7. Each gives the decision, why, and what else was weighed.

## R1. The tree is built in the browser from the pending list

**Decision**: A pure function `nest(spots)` in a new `src/lib/pendingTree.ts` turns each section's `Array<PendingSpot>` into nested rows. `pending()` and the server are unchanged.

**Rationale**: Every `PendingSpot` already carries its `path`, one per Spot (003's `pathOf`, by its lowest-uuid link). `pendingSpots()` sorts them by `comparePaths`, segment by segment, with a parent before its children. So one pass that creates rows in list order gives the nesting and today's sibling order (FR-005) without sorting again. A pure module is testable without a browser.

**Alternatives considered**:
- Having `pending()` return a tree. That changes a remote's shape and its tests to save a loop the browser can run.
- Sorting the rows again. Unnecessary, since `comparePaths` already orders siblings, and a second order could drift from it.

## R2. Missing ancestors become context rows during nesting

**Decision**: When a Spot's parent path has no row yet in that section, `nest()` adds rows for the missing ancestors with no `spot`. A context row is labelled and nested like any other, but has no checkbox and no summary (FR-003).

**Rationale**: A parent is missing exactly when it isn't pending in that section, so creating it on demand is the whole rule. When the last pending descendant leaves the section, the next `nest()` simply doesn't create it.

## R3. A recursive list with an explicit fold button

**Decision**: The placeholder `src/lib/components/FoldingList.svelte`, which is unused and holds only static markup, becomes the recursive row list. Each row with children renders a `<button class="fold" aria-expanded aria-controls>` before its label, and its children render in a nested `<ul id>` only while it's unfolded. A folded row shows its count as `(n)`.

**Rationale**:
- The button's `aria-expanded` and `aria-controls` give FR-010's keyboard use and its announced state with no extra code.
- Leaving folded children out of the DOM is what makes SC-002 hold.

**Alternatives considered**:
- `<details>`/`<summary>`. A checkbox inside `<summary>` makes a click ambiguous between staging and folding. It also keeps every folded row in the DOM, and its open state is the element's, which a keyed re-render would reset.

## R4. Fold state lives in the dialog, per section and path

**Decision**: `PublishDialog` keeps `folds = $state<Record<string, boolean>>({})`, keyed by `JSON.stringify([section, path])`, and passes a `folded(key, row)` and a `toggle(key)` to `FoldingList`. `folded` gives `folds[key] ?? row.pending > FOLD_OVER`, where `FOLD_OVER = 50`. `load()` clears `folds` each time the dialog opens.

**Rationale**:
- A row the user never touched follows FR-009's rule against its current count. A row they touched keeps their choice through every restage and refresh (FR-008, SC-004).
- Keying by section keeps the sections apart (US2-5).
- JSON keys can't collide, whatever a name contains.
- Clearing on open is FR-009's "when the dialog opens", and it also keeps the state for no longer than the page is open.

**Alternatives considered**:
- Storing fold state in `settings`, across reloads. The spec puts that out of scope.

## R5. Counts are computed while nesting

**Decision**: Each row's `pending` is the number of rows with a `spot` strictly inside it. `nest()` adds 1 to every ancestor of each Spot it places.

**Rationale**: FR-007's count and FR-009's threshold are the same number, so one integer serves both. The cost is one increment per ancestor, at most the path's depth per Spot.

## R6. Labels are the last segment

**Decision**: A row's label is `${path.at(-1)}/`, and the root's is `/` (FR-002). Rows are keyed in `{#each}` by their name, which is unique among siblings.

## R7. Tests

**Decision**:
- **`src/lib/pendingTree.test.ts`** (server project, pure): nesting, context rows, counts, order, the root, and Unicode names.
- **`src/lib/components/PublishDialog.svelte.test.ts`** (client project): nesting in both sections, folding, the count, keyboard use, `aria-expanded`, the initial fold at more than 50 and at exactly 50, fold state kept across a restage, sections kept apart, and the mass-select unchanged.
- **Existing assertions**: the `rows()` helper reads each row's own line rather than the whole `li`, so the existing ones keep their meaning. The only changes are labels, now the last segment, such as `hat/` for `icon/hat/`.
