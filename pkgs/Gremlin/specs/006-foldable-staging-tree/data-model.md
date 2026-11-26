# Data Model: Foldable Staging Tree

Nothing stored changes. `PendingSpot` is 003's ([data-model.md](../003-publish-updates/data-model.md)). This feature adds view-only shapes.

## `Row` (`src/lib/pendingTree.ts`)

```ts
interface Row {
  name: string              // the path's last segment; '' for the root
  path: Array<string>
  spot?: PendingSpot        // absent for a context row (FR-003)
  pending: number           // rows with a `spot` strictly inside it (FR-007)
  children: Array<Row>      // in the pending list's order (FR-005)
}
```

`nest(spots: Array<PendingSpot>): Array<Row>` returns the top-level rows.

- A root Spot (`path: []`) is the single top-level row, and every other row is inside it.
- Otherwise, the top-level rows are the first segments.

## Fold state (`PublishDialog`)

| Field | Type | Meaning |
| --- | --- | --- |
| `folds` | `Record<string, boolean>` | Keyed by `JSON.stringify([section, path])`, where `section` is `'staged'` or `'unstaged'`. It holds only rows the user has folded or unfolded, and is cleared when the dialog opens. |
| `FOLD_OVER` | `50` | A row the user hasn't touched starts folded when `pending > FOLD_OVER` (FR-009) |

A row is folded when it has children and `folds[key] ?? row.pending > FOLD_OVER` holds. A row without children is never folded and has no control.
