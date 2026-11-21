# Implementation Plan: Subtree Name Search

**Branch**: `drag-to-move` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-subtree-name-search/spec.md`

## Summary

Typing in the actions menu's search field replaces the main file view's listing with the Spots below the current position whose names match the query, where a `/` or a space outside `"`s splits the query into parts matched against successive levels.

The search runs in Gremlin. A `searchSpots({ path, parts, offset })` query remote resolves the current position the way browsing does, then runs one traversal from there over `CONTAINS` edges only. The traversal:

- **Matches:** case-insensitive, Unicode-aware, using a quoted `TextP.regex`.
- **Orders:** by depth, then by name ignoring case.
- **Deduplicates:** keeps each Spot once, at its shallowest matching path.
- **Pages:** returns one page of 100 results plus a `more` flag.

The client debounces typing by 150 ms and lets Svelte's `{#await}` drop stale responses. The second dual pane stays mounted but hidden while results show, so it comes back where it was (FR-017).

## Technical Context

**Language/Version**: TypeScript 6, Svelte 5 (runes, experimental async), Node 24

**Primary Dependencies**: SvelteKit 3.2 with remote functions, Valibot, gremlin-javascript 3.7.3 (TinkerPop 3.7: `TextP.regex`, `toLower()`, list orderability)

**Storage**: JanusGraph via Gremlin (read-only for this feature)

**Testing**: Vitest 4: the `server` project (Node) for the traversals against the local JanusGraph in rolled-back transactions, and the `client` project (Playwright Chromium) for the components

**Target Platform**: Evergreen browsers; SvelteKit server on Cloudflare (adapter-cloudflare) and Node in development

**Project Type**: Web application (a single SvelteKit app)

**Performance Goals**: Results within 1 s of the user stopping typing for a 10,000-Spot subtree (SC-002); each further 100 within 1 s (SC-006). The probe measured 226 ms for the first page and 138 ms for a later page on 10,000 Spots.

**Constraints**: GET-reachable reads must be `query` remotes or raw traversals, never `command`s; follow only `CONTAINS` below the start Spot, never `MOUNT`; the walk must finish when a Spot has several parents; user input must never be interpreted as a regex

**Scale/Scope**: Subtrees up to 10,000 Spots; one new remote, one new server module, one tiny shared module, one new component, edits to three components and one server module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-design | Post-design |
| --- | --- | --- | --- |
| I. Public Collaboration | No private data, no destructive writes, no trusted central server | ✅ Read-only; returns only public Spot names and ids | ✅ Unchanged |
| II. Succinct Code | Smallest correct expression; reuse over duplication; no dead code | ✅ Reuses browsing's path resolution; replaces the unused `subpathSearch` remote | ✅ Resolution is factored out of `listingTraversal`, not copied; the remote is a thin wrapper over `searchSpots` in `src/lib/server/search.ts` |
| III. Thorough Tests | Tests first, seen to fail; edge cases; every thrown error; real JanusGraph in a rolled-back `g.tx()` | ✅ Planned | ✅ All matching rules, ordering, paging and errors are tested against the real graph; see [quickstart.md](quickstart.md) |
| IV. Minimal Comments | Only a non-obvious *why* | ✅ | ✅ Expected comments: why `\E` is re-quoted, why `until` is enough for the earlier parts, and why the second pane is hidden rather than unmounted |
| Tech: remote functions | `query` for reads, Valibot input | ✅ `searchSpots` is a `query` with a bounded Valibot schema | ✅ |
| Workflow gate | `pnpm run lint`, `pnpm run check`, `pnpm test` pass before merge | ✅ T001 makes them runnable; T023 and T024 run them | ✅ |

No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-subtree-name-search/
├── plan.md              # This file
├── research.md          # Phase 0: decisions, verified server behaviour, rejected alternatives
├── data-model.md        # Phase 1: entities, validation, state
├── quickstart.md        # Phase 1: validation scenarios
├── contracts/
│   ├── search-remote.md    # The `searchSpots` query remote & server helpers
│   └── ui.md               # Component props and DOM contract
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── search.ts                     # NEW: partsOf() & PAGE_SIZE, shared by client & server
│   ├── search.test.ts                # NEW: unit tests (server project)
│   ├── server/
│   │   ├── listing.ts                # EDIT: factor out resolvePath(); export precedence & compareKeys
│   │   ├── listing.test.ts           # NEW: characterization test for the refactor
│   │   ├── search.ts                 # NEW: quote(), searchTraversal(), searchSpots()
│   │   ├── search.test.ts            # NEW: against real JanusGraph in g.tx() + rollback
│   │   └── testing.ts                # NEW: transaction & seeding helpers for graph tests
│   ├── remotes/
│   │   ├── searchSpots.remote.ts     # NEW: query({ path, parts, offset }) → { results, more }
│   │   └── subpathSearch.remote.ts   # DELETE: unused, superseded
│   └── components/
│       ├── SearchResults.svelte      # NEW: debounced pages, “show more”, empty/error/loading, clear control
│       ├── SearchResults.svelte.test.ts  # NEW
│       ├── FileBrowser.svelte        # EDIT: render SearchResults instead of the listing while searching
│       ├── FileBrowser.svelte.test.ts    # NEW
│       ├── FileView.svelte           # EDIT: pass `query` through; accept `hidden`
│       └── FileView.svelte.test.ts       # NEW
└── routes/[...path]/
    ├── +page.svelte                  # EDIT: own `query` state; wire the search field; hide pane 2
    └── page.svelte.test.ts           # NEW
```

**Structure Decision**: The existing single SvelteKit app. The graph code goes in `src/lib/server/` next to `listing.ts` and `moves.ts`, following their pattern of traversal builders that take a `source` so tests can pass a transaction. The remote stays a thin wrapper in `src/lib/remotes/`. Only `partsOf` and `PAGE_SIZE` are shared with the client, from `src/lib/search.ts`.

## Complexity Tracking

None.
