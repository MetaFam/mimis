# Quickstart: Validating the Foldable Staging Tree

## Automated

```sh
pnpm exec vitest --run --project server src/lib/pendingTree.test.ts
pnpm exec vitest --run --project client src/lib/components/PublishDialog.svelte.test.ts
pnpm run lint && pnpm run check
```

| Test file | Proves |
| --- | --- |
| `src/lib/pendingTree.test.ts` (new) | `nest` nests by path (FR-001). It labels by the last segment, and the root by `/` (FR-002). It adds context rows for missing ancestors (FR-003) and counts pending descendants (FR-007). It keeps the list's order (FR-005), handles Unicode and spaced names, and handles an empty list. |
| `src/lib/components/PublishDialog.svelte.test.ts` | Both sections nest, with context rows without checkboxes (US1-1 to US1-5). A checkbox stages only its Spot (FR-004, SC-005). Fold and unfold hide and show children, with the count (US2-1, US2-2). A row without children has no control (US2-3). Fold state is kept across a restage (US2-4, SC-004), and each section keeps its own (US2-5). The control is keyboard-operable with `aria-expanded` (US2-6). At more than 50 a row starts folded, at 50 it doesn't (US3-1, US3-2), and a row unfolded by hand stays unfolded (US3-3). 10,000 pending Spots under one folder render one row (SC-002). Stage and Unstage Everything are unchanged (FR-011). |

## Manual

1. Import a directory of a few hundred files. Open **Publish**: the import's folder starts folded, showing its count.
2. Unfold it, stage one file's Spot, and check that the folder is still unfolded and the Spot moved to **Staged**, nested in place.
3. Fold a folder with the keyboard: Tab to its ▾ and press Enter or Space.
