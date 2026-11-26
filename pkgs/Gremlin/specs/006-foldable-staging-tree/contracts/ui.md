# Contract: UI

## `FoldingList.svelte` (replaces the unused placeholder)

| Prop | Type | Meaning |
| --- | --- | --- |
| `rows` | `Array<Row>` | One level of rows |
| `section` | `'staged' \| 'unstaged'` | For fold keys and ids |
| `folded` | `(row: Row) => boolean` | Whether `row` is folded |
| `ontoggle` | `(row: Row) => void` | Folds or unfolds `row` |
| `onstage` | `(spot: PendingSpot) => void` | Stages or unstages `spot` alone |

It renders `<ul>`, and for each row an `<li>` holding the following:

- **A `<div class="row">` line**:
  - a `<button class="fold" aria-expanded aria-controls>` when the row has children, ▸ when folded and ▾ when not;
  - for a Spot row, a `<label>` with a checkbox and its label, then the summary (“new” or “+a −r”);
  - for a context row, a `<span class="context">` with the label;
  - when folded, a `<span class="count">(n)</span>`.
- **The children**: a nested `FoldingList`, with an `id` the button's `aria-controls` names, rendered only while the row is unfolded.

## `PublishDialog.svelte`

- Each section's `<ul>` of rows becomes `<FoldingList rows={nest(spots)} …/>`. The mass-select label stays above the Unstaged list.
- `onstage` calls `restage({ ids: [spot.id], staged: !spot.staged })`, as each checkbox does today (FR-004).
- `load()` clears `folds` (R4).
- The comment, Publish, the “Also included” list, and every message are unchanged (FR-011).
