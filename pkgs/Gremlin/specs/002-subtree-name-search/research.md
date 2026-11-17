# Research: Subtree Name Search

The Technical Context had no open questions. The entries below record the design decisions that the spec leaves to planning. Claims about server behaviour were checked on 2026-11-17 against the local JanusGraph (gremlin-javascript 3.7.3, TinkerPop 3.7 server), using `inject()` probes and a seeded, rolled-back transaction.

## R1. Where matching happens

- **Decision**: In Gremlin. Each search request runs one traversal that matches, orders, deduplicates and pages on the server, then returns one page of results plus a `more` flag.
- **Rationale**:
  - **Only matches cross the wire:** the payload is at most 101 rows, however big the subtree.
  - **Fast enough:** measured on 10,000 Spots, the first page took 226 ms and the page at offset 900 took 138 ms, inside SC-002 and SC-006.
  - **Always current:** every keystroke (after the debounce, R7) reads the live graph, so a Spot added mid-search can appear.
- **Alternatives considered**:
  - **Download the whole subtree and match in TypeScript.** Instant filtering, but it sends every row (about 10,000 for a large subtree) and can go stale. Rejected in favour of server-side matching.
  - **A JanusGraph mixed index with `textContains`.** This needs an Elasticsearch or Lucene backend, which the deployment doesn't have. It also tokenizes into words, so it isn't a true substring match.
  - **The existing `subpathSearch` remote.** It ignores the current position, returns `null` when signed out, and uses `until()` for the last part, so it misses deeper matches. Superseded and deleted (Principle II).

## R2. Case-insensitive substring matching (FR-004)

- **Decision**: Each part becomes `TextP.regex('(?iu)' + quote(part))`, applied with `has('path', …)` to a `CONTAINS` edge. `quote` reproduces Java's `Pattern.quote`: `\Q…\E`, with every `\E` inside replaced by `\E\\E\Q`.
- **Rationale (verified)**:
  - **Substring match:** `TextP.regex` matches anywhere in the string (`find`): `(?iu)\QEMM\E` matches `Gemma`, `emma` and `EMMA!`.
  - **Unicode case:** `(?iu)` folds Unicode case (`ΣΟΦΊΑ` matches `σοφία`). Plain `(?i)` doesn't.
  - **No accent folding:** `Émma` doesn't match `emm`, as FR-004 requires.
  - **Literal text:** quoting makes `.`, `(`, `[` and `\` match only themselves. Quoted text has no backtracking, so a crafted query can't make the regex slow.
- **Alternatives considered**: `TextP.containing` (case-sensitive), or `toLower()` on both sides (it uses the JVM's default locale, and the step can't sit inside `has()`).

## R3. The Spot a search starts from

- **Decision**: Factor the per-segment walk out of `listingTraversal` into `resolvePath({ from, path, maxDepth })` in `src/lib/server/listing.ts`. `listing` keeps applying `withMounts` to its result. Search ranks the candidates `resolvePath` returns with the existing `precedence()`/`compareKeys()` and starts from the highest-precedence one.
- **Rationale**: FR-005 says to start from "the Spot the current position resolves to, as browsing resolves it". Reusing the code keeps the two consistent and avoids a third, slightly different walk. The old walks in `spotId`, `searchFor` and `fsEntries` assume `repeat()` preserves order, but it actually runs breadth-first on this server (memory: janusgraph-repeat-bfs).
- **Alternatives considered**:
  - **Reuse `spotId`.** It's a `command` (POST only), and its walk relies on the order `repeat()` emits in.
  - **Search every layer the cursor resolves to.** That brings mounts back in, which the clarification ruled out.

## R4. The matching traversal (FR-003, FR-005, FR-006, FR-016)

- **Decision**: Build the traversal from the query's parts `p₁ … pₖ`, starting at `V(start)`:
  1. **Each earlier part:** `outE('CONTAINS').until(has('path', re(pᵢ))).repeat(inV().outE('CONTAINS').simplePath()).inV()`. This descends to the first Spot on each branch whose name matches `pᵢ`.
  2. **The last part:** `outE('CONTAINS').emit(has('path', re(pₖ))).repeat(inV().outE('CONTAINS').simplePath()).inV()`. This emits every Spot below whose own name matches `pₖ`.
- **Rationale (verified)**:
  - **Multi-part matching:** `austen/em` returns `by/Austen/Emma` and `by/Austen/collected/Emma`, but not `by/Brontë/Emma's Letters`.
  - **First match is enough:** stopping at the first match of each earlier part on a branch is enough to decide whether the parts can be matched in order. Any later match of that part lies on the same vertex path, so no result is lost.
  - **Distinct names:** each stage starts with `outE`, so every part matches a different, deeper Spot.
  - **Start Spot excluded:** the walk begins at the start Spot's outgoing edges, so its own name is never tested (FR-003).
  - **No mounts:** only `CONTAINS` edges are followed. A Spot behind a `MOUNT` wasn't found in testing.
  - **Terminates:** `simplePath()` ends the walk on cycles. A Spot with two parents is reached by both paths, and the walk finishes.
- **Alternatives considered**: a `where(path() …)` filter applied after enumerating the whole subtree. It's harder to read, and it tests every part on every Spot.

## R5. Ordering, deduplication, paging (FR-006, FR-007, FR-011)

- **Decision**: Project each match, then order, deduplicate and page it:
  - **Projection:** `project('id', 'names').by(id()).by(path().unfold().hasLabel('CONTAINS').values('path').fold())`.
  - **Order:** `.order().by(select('names').count(local)).by(select('names').unfold().toLower().fold()).by(select('id'))`.
  - **Dedup and page:** `.dedup().by(select('id')).range(offset, offset + PAGE_SIZE + 1)`.
  - **More flag:** the server returns the first `PAGE_SIZE` rows, and `more: rows.length > PAGE_SIZE`.
- **Rationale (verified)**:
  - **Shallowest kept:** `dedup()` after `order()` keeps the first row for each id, which is the Spot's shallowest matching path.
  - **List ordering:** TinkerPop 3.7 compares lists element by element, so the lowercased name lists sort case-insensitively.
  - **Stable pages:** ties are broken by id, so every page of the same query is consistent and pages never overlap or skip (FR-011).
- **Ordering semantics**: "alphabetically" means case-insensitive comparison of Unicode code points. It's deterministic on every machine, but it isn't language-aware collation, so `Ä` sorts after `z`. This is recorded in the spec's Assumptions.
- **Alternatives considered**: `localeCompare` in TypeScript (it needs the whole match set on the client, which R1 rejects), or unlowercased list ordering, which puts every capitalized name before every lowercase one (`B` before `a`, verified).

## R6. Hiding the second pane

- **Decision**: Keep the second `FileView` mounted while searching, and hide it with a `hidden` prop that's forwarded to its root `<section>`. Its CSS adds `#browse[hidden] { display: none }`, because the author rule `#browse { display: flex }` would otherwise override the browser's default `[hidden]` style.
- **Rationale**: the second pane takes its starting path from the first pane at mount time (`untrack(() => [...path])`). Unmounting it would lose its position, which FR-017 requires keeping. It also follows that the Dual Panes setting itself never changes.
- **Alternatives considered**: lifting the second pane's path into `+page.svelte` and remounting (more state, and it changes how toggling Dual Panes behaves today), or a CSS class on `main` (it needs a `:has()` rule tied to markup that lives in another component).

## R7. Request timing and stale results (FR-009, SC-005)

- **Decision**:
  - **Debounce:** `SearchResults` waits 150 ms after the last keystroke, then fixes `parts` (`settled`).
  - **Pages:** each page is the SvelteKit query `searchSpots({ path, parts: settled, offset })`, rendered with `{#await}`. `pages` holds the offsets requested so far.
  - **Reset:** when `settled` or `path` changes, `pages` resets to `[0]`.
- **Rationale**:
  - **No stale results:** when the awaited expression changes, Svelte ignores the earlier promise's result, so a late response for `em` can't replace `emma`'s results.
  - **Fewer requests:** the debounce cuts requests from one per keystroke to one per pause. 150 ms plus about 250 ms of traversal stays inside SC-002's 1 s.
  - **Caching:** SvelteKit's per-argument query cache means retyping a query you've just searched for reuses its result.
- **Alternatives considered**: no debounce (a round trip per keystroke), or an `AbortController` per request (remote queries don't take a signal, and the stale result is already ignored).

## R8. Where the query state lives

- **Decision**: `+page.svelte` owns `let query = $state('')` and binds the actions menu's `<input type="search">` to it. It passes `bind:query` to the first `FileView`, which passes it on to `FileBrowser`. The clear control and choosing a result both set `query = ''` through that binding (FR-008, FR-014). Choosing a result also calls `hidePopover()` on `#actions`.
- **Rationale**: the field and the results live in different components. One `$state` owned by their common ancestor is the smallest wiring that works.
- **Alternatives considered**: a module-level rune store (global, and overkill), or URL search params (they'd survive reloads, which the spec doesn't ask for, and every keystroke would trigger navigation).

## R9. Keyboard navigation

- **Decision**: In the search field, ArrowDown moves focus to the first result's link. Inside the results, ArrowUp and ArrowDown move between links, and Enter follows the focused link through the same navigation handler as a click. Results render as `<a href>` items in an `<ol>`.
- **Rationale**: this meets the keyboard scenario in Story 2 with native links and no custom ARIA widget.
- **Alternatives considered**: an ARIA `listbox` combobox (heavier, and the results aren't next to the field).

## R10. Test infrastructure

- **Decision**:
  - **Traversal tests** connect through `g()` using the `.env.local` credentials, which Vitest already loads. They run `source = g().tx().begin()`, seed Spots, run the traversals, and call `rollback()` in `afterEach`. They use `.next()` or `.toList()`, never `.iterate()`, which sends `none()` and this server rejects.
  - **Large seeding** batches `inject(names).unfold()…addV…addE` 1,000 at a time. In the probe, 10,000 Spots took 310 ms.
  - **Component tests** use the `client` Vitest project with `vitest-browser-svelte`.
- **Rationale**: this is what Principle III requires.
- **Setup step**: the installed Playwright expects a newer Chromium than the one cached. `pnpm exec playwright install chromium` is a prerequisite (T001).
