# Quickstart: Validating Subtree Name Search

## Prerequisites

- **JanusGraph:** the local server is up on `ws://localhost:8182/gremlin` (`docker compose up -d janusgraph`), and its credentials are in `.env.local`.
- **Browser for component tests:** `pnpm exec playwright install chromium` (T001).
- **IPFS:** a running Kubo is needed only for the manual run below, to add sample files. Searching itself doesn't use IPFS.

## Automated checks

```sh
pnpm exec vitest --run --project server src/lib/search.test.ts          # partsOf
pnpm exec vitest --run --project server src/lib/server/search.test.ts   # real JanusGraph, rolled back
pnpm exec vitest --run --project client src/lib/components/SearchResults.svelte.test.ts
pnpm run lint && pnpm run check && pnpm test                             # the constitution's merge checks
```

Expected: all pass, and the graph is left exactly as it was (every write happens inside `g().tx()` and is rolled back).

### What each suite must show

| Suite | Scenario | Spec |
| --- | --- | --- |
| search (client) | `''`, `'   '`, `'//'` give no parts; `emma/`, `/emma`, `austen//emma` normalize; spaces are kept | Edge cases, FR-010 |
| search (server) | `quote()` escapes `\E`, and `.`, `(`, `[` and `\` in names match only literally | FR-004 |
| search (server) | `emm` finds `emma` and `Gemma`, not `d`; `Émma` isn't found; `ΣΟΦΊΑ` finds `σοφία` | US1-1, FR-004 |
| search (server) | `austen/em` finds `by/Austen/Emma` and `by/Austen/collected/Emma`, not `by/Brontë/Emma's Letters`; `austen/austen/em` doesn't match `austen/Emma` | US1-6, FR-016 |
| search (server) | The start Spot is never a result; a `MOUNT` below the start isn't followed | FR-003, FR-005 |
| search (server) | Order by depth, then lowercased names, then id; a Spot with two parents is listed once, at its shallowest matching path, and the walk finishes | FR-006, FR-007, SC-004 |
| search (server) | 250 matches page as 100 + 100 + 50 with `more` true, true, false; there's no overlap, and nothing is skipped | FR-011 |
| search (server) | 404 / 500 / connection-500 / `HttpError` pass-through | FR-012, contract |
| search (server) | 10,000 seeded Spots: first page within 1 s; 1,000 matches: each page within 1 s | SC-002, SC-006 |
| SearchResults | Debounced request; a late stale response is never shown; "Searching…", "Nothing matched" and the error state | FR-009, SC-005, FR-010, FR-012 |
| SearchResults | "Show more" requests offset 100, appends, then disappears when `more` is false | FR-011 |
| SearchResults | Choosing a result sets `path` and clears `query`; ArrowDown and Enter work | US2, FR-008 |
| SearchResults | The clear control restores the listing | US1-8, FR-014 |

## Manual run

1. Run `pnpm dev`, open the app, and sign in with a wallet.
2. Use "Add Directory" to create `a/b/emma`, `a/b/c/gemma` and `a/d`, then browse to `/a/`.
3. Open ☰ and type `emm`. The file view should show only `b/emma/` and `b/c/gemma/`, with `emm` and a clear control above them.
4. Click outside the menu so it closes. The results should stay.
5. Press the clear control. The listing of `/a/` should come back.
6. Turn on Dual Panes, browse the second pane to another Spot, and type `emm` again. The split should disappear. Clear the query, and both panes should return with the second at its own Spot.
7. Type `b/gem` and press ↓ then Enter. The view should go to `/a/b/c/gemma/`, the query should clear, and the menu should close.
8. In a Spot with thousands of descendants, type a common fragment. The first results should appear within about 1 s of stopping typing (SC-002).
