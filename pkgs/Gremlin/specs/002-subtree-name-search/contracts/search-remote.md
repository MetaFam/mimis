# Contract: `searchSpots` query remote

**Module**: `src/lib/remotes/searchSpots.remote.ts`

**Kind**: SvelteKit `query`. It's read-only, reachable by GET, and cached on the client per argument.

## Input (Valibot)

```ts
v.object({
  path: v.array(v.string()),
  parts: v.pipe(
    v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
    v.minLength(1),
    v.maxLength(20),
  ),
  offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
  })),
})
```

- **`path`:** the current position's segments, the same value given to `listing({ path })`. Empty strings are dropped.
- **`parts`:** `partsOf(query)` from `src/lib/search.ts`. The client never sends an empty list, since there's nothing to search.
- **`offset`:** a multiple of `PAGE_SIZE` in practice; any non-negative integer is accepted.
- **`maxMountDepth`:** used only while resolving `path` (FR-005), the same as in `listing`.

## Output

```ts
{
  results: Array<{
    id: string | number
    names: Array<string>
    thumb: { type: string, cid: string } | null
    types: Array<string>
  }>
  more: boolean
}
```

The order, uniqueness and paging rules are in [data-model.md](../data-model.md) (*Result* and *Page*).

## Errors

The remote is a thin wrapper. Every error below except the 400 is raised by `searchSpots` in `src/lib/server/search.ts`, so it can be tested against the real graph without a request context.

| Condition | Result |
| --- | --- |
| Input fails the schema | 400 (SvelteKit validation) |
| `path` resolves to no Spot | 404, `"No Spot at /a/b/."` |
| Graph unreachable (`TypeError`) | 500, `"Search: \"Connection Error: …\""`, the same rewrite as `listing` |
| Any other traversal failure | 500, `"Search: \"<message>\""` |
| An `HttpError` thrown inside | Passed through unchanged |

## Server helpers

| Function | Module | Contract |
| --- | --- | --- |
| `resolvePath({ from, path, maxDepth })` | `src/lib/server/listing.ts` | The walk `listingTraversal` uses today, factored out: returns the traversal positioned at each Spot `path` resolves to. `listingTraversal` becomes `withMounts(resolvePath(…))` plus its projection, with unchanged output |
| `quote(text)` | `src/lib/server/search.ts` | Java `Pattern.quote`: `\Q` + text + `\E`, with each `\E` in `text` replaced by `\E\\E\Q`. Pure |
| `searchTraversal({ source, start, parts, offset })` | `src/lib/server/search.ts` | The traversal in research R4 and R5, ending in `range(offset, offset + PAGE_SIZE + 1)`. Only then does it add each page row's Contents (listing's `contentsOf()`), so previews cost nothing for matches off the page |
| `searchSpots({ source, from, path, parts, offset, maxDepth })` | `src/lib/server/search.ts` | Resolves `path` with `resolvePath`, starts at the highest-precedence candidate (`compareKeys`), and runs `searchTraversal`. Returns `{ results: rows.slice(0, PAGE_SIZE), more: rows.length > PAGE_SIZE }`. Raises every error in the table above except the 400 |
