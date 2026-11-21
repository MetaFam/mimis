# Data Model: Subtree Name Search

This feature reads the existing graph and writes nothing. For the stored schema, see `Spot −CONTAINS{path}→ Spot` in the project's graph model.

## Graph (read-only)

| Element | Used for |
| --- | --- |
| `Spot` vertex, `id` | Identifying a result, deduplicating it (FR-006), and breaking ordering ties |
| `CONTAINS` edge, `path` property | A Spot's name in its parent: what gets matched and displayed (FR-002) |
| `MOUNT` edge | Followed only when resolving the current position (FR-005), never below it |

## Query → Parts

| Concept | Rule |
| --- | --- |
| `query` | The raw text of the search field, owned by `+page.svelte` |
| `parts` | `partsOf(query)`: `query.split('"')`, whose even pieces, outside quotes, split again at `/`s & whitespace, while the odd ones, inside, stay whole, with blank (empty or whitespace-only) parts dropped, so `''`, `'   '`, `'//'`, `' / '` and `'" "'` all give `[]` (FR-010, FR-016) |
| Searching | `parts.length > 0`. This switches the first pane to results and suspends the split (FR-017) |
| `settled` | `parts` as it stands 150 ms after the last keystroke; it's what gets sent to the server (research R7) |

## Match rule (FR-004, FR-016), evaluated in Gremlin

Let `re(p)` be `TextP.regex('(?iu)' + quote(p))`, a literal, case-insensitive (Unicode) substring test with no accent folding. A Spot `S` below the start is a match for `parts = [p₁ … pₖ]` when:

1. `S`'s own name (the `path` of the `CONTAINS` edge leading to it) satisfies `re(pₖ)`, and
2. On the `CONTAINS` path from the start to `S`, there are distinct, increasingly deep Spots whose names satisfy `re(p₁) … re(pₖ₋₁)` in that order.

The start Spot itself is never tested.

## Result (server → client)

| Field | Type | Rule |
| --- | --- | --- |
| `id` | `string \| number` | The matching Spot's vertex id |
| `names` | `Array<string>` | The `CONTAINS.path` of each edge from the start Spot to it; displayed as `names.join('/') + '/'` (FR-007) |
| `thumb` | `{ type: string, cid: string } \| null` | The first of the Spot's current Contents, in listing order (`order`, then newest), whose `type` starts with `image/` or `video/`; otherwise `null` (FR-018) |
| `types` | `Array<string>` | The `type` of each of the Spot's current Contents, in listing order; empty when it has none, which is when the folder icon is shown (FR-018) |

- **Order:** ascending `names.length`, then the lowercased `names` compared element by element (Unicode code points), then `id`.
- **Uniqueness:** the first result for each `id` in that order is kept, which is its shallowest matching path.
- **Navigation:** choosing a result sets the first pane's path to `[...path, ...names]`.

## Page (server → client)

| Field | Type | Rule |
| --- | --- | --- |
| `results` | `Array<Result>` | At most `PAGE_SIZE` (100) results: positions `offset … offset + 99` in the order above |
| `more` | `boolean` | True when at least one result exists past this page |

## View state (first FileBrowser)

```text
            parts = 0                         parts > 0
 ┌──────────────┐  ───── type ─────▶  ┌────────────────────────┐
 │   Listing    │                      │ Searching              │
 │ (normal)     │  ◀── clear / pick ── │  loading → results     │
 └──────────────┘                      │          ↘ error       │
                                       └────────────────────────┘
```

| State | Shown |
| --- | --- |
| Listing | The existing children and media |
| Searching, first page loading | The active query, the clear control, and "Searching…" |
| Searching, error | The active query, the clear control, and the error message (FR-012) |
| Searching, 0 results | The active query, the clear control, and "Nothing matched" (FR-010) |
| Searching, results | The active query, the clear control, every loaded page's results in order, and "Show more" while the last loaded page has `more` (FR-011) |

- **Pages:** `pages: Array<number>` holds the offsets requested so far. It starts at `[0]`, and "Show more" appends `pages.at(-1) + PAGE_SIZE`.
- **Reset:** `pages` goes back to `[0]` whenever `settled` or `path` changes.

## Second pane

| Condition | Second FileView |
| --- | --- |
| Dual Panes off | Not rendered (unchanged) |
| Dual Panes on, not Searching | Shown (unchanged) |
| Dual Panes on, Searching | Rendered but `hidden`; its `path` is kept (FR-017) |
