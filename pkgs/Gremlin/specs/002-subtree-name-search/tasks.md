---
description: "Task list for Subtree Name Search"
---

# Tasks: Subtree Name Search

**Input**: Design documents from `specs/002-subtree-name-search/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Tests are MANDATORY (Constitution III). Every story includes test tasks that are written first and seen to fail.

**Organization**: Tasks are grouped by user story, so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- All paths are relative to the package root `pkgs/Gremlin/`

## Conventions for every task

- **Style:** two-space indents; `if(` / `for(` / `catch(` with no space before the parenthesis; single-expression arrow bodies wrapped in parentheses, with the body on its own line; `.method()` chain continuation lines not indented; trailing commas on multi-line entries.
- **Imports:** from `src/lib`, use `#lib/…` with a `.js` extension for `.ts` modules (for example `#lib/search.js`, `#lib/server/search.js`, `#lib/remotes/searchSpots.remote.js`); `.svelte` keeps its extension.
- **Errors:** unexpected shapes throw; sentinels only where the absence is legitimate.
- **Graph tests:** run against the local JanusGraph inside `g().tx()`, rolled back afterwards; use `.next()` or `.toList()`, never `.iterate()`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the constitution's merge checks (`pnpm run lint`, `pnpm run check`, `pnpm test`) runnable, and give graph tests a rollback harness.

- [X] T001 Make the quality checks runnable in `eslint.config.js`, `package.json` and `.gitignore`.
  - **Lint ignores:** in `eslint.config.js`, import `globalIgnores` from `eslint/config` and add `globalIgnores(['.svelte-kit/', 'sk/', 'build/', 'editor/dist/'])` as the first config entry. Delete the unused `gitignorePath`, `fileURLToPath` and commented-out `includeIgnoreFile` lines (their package, `@eslint/compat`, isn't installed).
  - **Gitignore:** add `/sk` to `.gitignore`, since it's build output.
  - **E2E script:** in `package.json`, change `test:e2e` to `playwright install && playwright test --pass-with-no-tests`. With no `*.e2e.ts` files yet, `pnpm test` would otherwise fail.
  - **Browser:** run `pnpm exec playwright install chromium` for the `client` Vitest project (configured in `vite.config.ts`).
  - **Check:** `pnpm run lint` now reports only errors in `src/`. Record the existing ones in this file under a "Baseline lint errors" note, so T023 can tell new errors from old. `pnpm exec vitest --run --project client` starts a browser (it may report "no test files").
- [X] T002 [P] Create the graph test harness in `src/lib/server/testing.ts`:
  - **`transaction()`:** returns `{ source, rollback }` from `g().tx()` (`source = tx.begin()`, `rollback = () => tx.rollback()`).
  - **`seed(source, tree)`:** takes a nested spec such as `{ a: { b: { emma: {} }, d: {} } }`. It adds a root `Spot`, then for each key a child `Spot` and a `CONTAINS` edge with `path` set to the key, and returns `Map<string, Id>` from each slash-joined path (and `''` for the root) to its vertex id.
  - **`seedWide(source, { under, names })`:** adds one child Spot per name under one parent, with one traversal per batch of 1,000: `inject(batch).unfold().as('n').addV('Spot').as('v').addE('CONTAINS').from_(__.V(under)).to('v').property('path', __.select('n')).count().next()`. The probe seeded 10,000 this way in 310 ms.
  - **`link(source, { from, to, name })` and `mount(source, { from, to, order })`:** add an extra `CONTAINS` or `MOUNT` edge.
  - **Rules:** every step uses `.next()`; throw if a returned id is missing.

**Baseline lint errors** (recorded by T001, 2026-11-17; they predate this feature):

- `scripts/rename_common.deno.ts` 92:5, 94:3: `no-useless-assignment`
- `src/lib/components/ErrorDialog.svelte` 8:22 `no-extra-boolean-cast`; 20:18 `'evt'` unused
- `src/lib/remotes/updatedSince.remote.ts` 1:30: `'date'` unused
- `src/lib/remotes/upsertSpot.remote.ts` 5:10 `'spotId'` unused; 9:18 `'__'` unused
- `src/worker-configuration.d.ts` 8589, 8605: two warnings for unused `eslint-disable` directives (generated file)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The path resolution that both browsing and search must share (FR-005, research R3).

**⚠️ CRITICAL**: US1's `searchSpots` depends on this.

- [X] T003 Write `src/lib/server/listing.test.ts`, a characterization test against JanusGraph using `transaction()`/`seed()`/`mount()` from T002.
  - **Unchanged listing:** for a tree where `/x` mounts another Spot that contains `y`, `assembleListing(await listingTraversal({ from: source.V(rootId), path: ['x'] }).toList())` gives the expected `layers` and `children`. These assertions record today's behaviour, so they pass before the refactor.
  - **`resolvePath`:** `resolvePath({ from: source.V(rootId), path: ['x', 'y'] }).id().toList()` reaches `y` through the mount. This is the assertion that must fail first, until T004.
  - **No match:** a path with no match resolves to nothing.
- [X] T004 Refactor `src/lib/server/listing.ts`.
  - **Extract `resolvePath`:** pull the per-segment loop out of `listingTraversal` into `export function resolvePath({ from, path, maxDepth = 10 })`, which returns the traversal after the last `CONTAINS` step.
  - **Rebuild `listingTraversal`:** it becomes `withMounts({ traversal: resolvePath(…), label: 'cursor', maxDepth })` plus its existing projection.
  - **Exports:** export `precedence` and `compareKeys` (and the `Key` type).
  - **Check:** T003 passes in full.

**Checkpoint**: Browsing behaves exactly as before; `resolvePath` is reusable.

---

## Phase 3: User Story 1 - Find Spots below here by name as you type (Priority: P1) 🎯 MVP

**Goal**: Typing in the actions menu's search field replaces the first pane's listing with matching Spots below the current position, matched in Gremlin with case-insensitive, `/`-separated parts. It shows the active query with a clear control, pages with "show more", and suspends dual panes.

**Independent Test**: At a Spot with a known subtree, type a fragment found at several depths and check that the file view lists exactly those Spots. Clearing brings the listing back. With dual panes on, the split disappears while searching and returns with the second pane where it was.

### Tests for User Story 1 ⚠️

> Write these first and run them to see them fail before implementing.

- [X] T005 [P] [US1] Write `src/lib/search.test.ts` (server project) for `partsOf` and `PAGE_SIZE` from `#lib/search.js`.
  - **No parts:** `''`, `'   '`, `'/'` and `'//'` → `[]`.
  - **Normalizing:** `'emma/'` and `'/emma'` → `['emma']`; `'austen//emma'` → `['austen', 'emma']`.
  - **Kept as typed:** `'publication date'` keeps its space; `'a / b'` → `['a ', ' b']`.
  - **Page size:** `PAGE_SIZE` is `100`.
- [X] T006 [P] [US1] Write `src/lib/server/search.test.ts` (server project, real JanusGraph via T002) for `quote`, `searchTraversal` and `searchSpots` from `#lib/server/search.js`. Seed `{ by: { Austen: { Emma: {}, collected: { Emma: {} } }, 'Brontë': { "Emma's Letters": {} } }, b: { emma: {}, c: { Gemma: {} } }, d: {}, 'Zed ✨': {} }`, plus `Émma`, `σοφία`, `a.b`, `(x)`, `[y` and `back\Eslash` as children of `d`.
  - **`quote` (pure):** `quote('a.b')` is `\Qa.b\E`; `quote('x\Ey')` is `\Qx\E\\E\Qy\E`.
  - **Literal match:** searching `a.b` finds only `a.b`, not `axb`; `(x`, `[y` and `\E` each find their literal names.
  - **Case and accents:** `emm` finds `b/emma`, `b/c/Gemma`, `by/Austen/Emma` and `by/Austen/collected/Emma`, but not `Émma`. `ΣΟΦΊΑ` finds `σοφία`. `EMMA` and `emma` give the same results.
  - **Multi-part:** `['austen', 'em']` finds `by/Austen/Emma` and `by/Austen/collected/Emma`, and not `by/Brontë/Emma's Letters`.
  - **Distinct names:** `['austen', 'austen', 'em']` finds nothing, because each part needs its own Spot.
  - **Last part:** the last part is tested only against the result's own name: `['by']` finds `by`, but not `by/Austen`.
  - **Start excluded:** started at `b`, `['b']` doesn't return `b` itself.
  - **No mounts below:** a `mount` below the start leading to a Spot named `emma-hidden` isn't searched.
  - **Order:** results come by depth, then lowercased names, then id. For example, `['e']` lists `Zed ✨` before `b/emma`, and `b/emma` before `by/Austen`.
  - **Dedup:** a `link` giving `b/c` a second parent (`d/again`) lists `b/c/Gemma` once, at its shallowest path, and the walk finishes.
  - **Paging:** with 250 matching Spots from `seedWide`, offsets 0, 100 and 200 return 100, 100 and 50 results, with `more` true, true and false. Their concatenated ids are 250 distinct values, in the same order as a single 250-row traversal.
  - **Resolution:** `searchSpots({ source, from, path })` starts at the highest-precedence Spot when `path` resolves through a mount (use `compareKeys`).
  - **Errors (every one thrown):**
    - **No Spot:** a `path` that resolves to nothing rejects with an `HttpError` whose `status` is 404 and whose body message is `No Spot at /nope/.`.
    - **Traversal failure:** a `source` stub whose `V()` throws `new Error('boom')` rejects with a 500 whose message is `Search: "boom"`.
    - **Connection failure:** a stub that throws a `TypeError` rejects with a 500 whose message starts `Search: "Connection Error:`.
    - **Pass-through:** a stub that throws `error(418, 'teapot')` rejects with that same 418, unchanged.
  - **Performance:** give this test an explicit timeout of `60_000` and time only the `searchSpots` calls, not the seeding.
    - **SC-002:** `seedWide` adds 10,000 Spots, and the first page of `['emm']` returns within 1 s.
    - **SC-006:** with 1,000 matches, each of the 10 pages returns within 1 s.
- [X] T007 [P] [US1] Write `src/lib/components/SearchResults.svelte.test.ts` (client project, `vitest-browser-svelte`, fake timers).
  - **Mock:** `vi.mock` `#lib/remotes/searchSpots.remote.js`, so `searchSpots()` returns a promise the test controls, and records its arguments.
  - **DOM:** test the contract in [contracts/ui.md](contracts/ui.md).
  - **Region and query:** `section#search-results` is present, and `output` shows the query.
  - **Debounce:** setting `query` to `e`, `em`, `emm` within 150 ms sends one request, with `parts: ['emm']` and `offset: 0`.
  - **States:** "Searching…" (`role="status"`) while pending; `role="alert"` with the message on rejection; "Nothing matched" for an empty first page.
  - **Results:** `ol > li > a` with text `b/emma/` and `b/c/gemma/`.
  - **Stale responses (SC-005):** resolve the `em` request *after* the `emma` request. Only `emma`'s results are ever shown.
  - **Show more:** clicking `button.more` requests `offset: 100` and appends its results after the first page. It disappears once a page returns `more: false`. Changing `query` or `path` resets to a single `offset: 0` page.
  - **Clear:** clicking `button.clear` sets the bound `query` to `''`.
- [X] T008 [P] [US1] Write `src/lib/components/FileBrowser.svelte.test.ts` (client project), mocking `listing` and `searchSpots`. With `query` `''`, `'   '` or `'//'` it renders the normal listing. With `query` `'emm'` it renders `#search-results` instead of the listing.
- [X] T009 [P] [US1] Write `src/lib/components/FileView.svelte.test.ts` (client project), mocking `listing` and `searchSpots`.
  - **Hidden:** `hidden={true}` puts the `hidden` attribute on `section#browse`, and its computed `display` is `none`.
  - **Visible:** `hidden={false}` displays it.
  - **Query:** a bound `query` passes through to `FileBrowser`, so `#search-results` appears.
- [X] T010 [P] [US1] Write `src/routes/[...path]/page.svelte.test.ts` (client project).
  - **Mocks (all with `vi.mock`, before importing the page):**
    - **Components and remotes:** `#lib/components/SIWE.svelte`, a stub component that sets its bindable `me` to `'0xabc'`; `#lib/remotes/listing.remote.js` and `#lib/remotes/searchSpots.remote.js`, returning fixed data.
    - **Exporters:** `#lib/janus2DAG.js` (`janusToDAG: vi.fn()`) and `#lib/janus2CSV.js` (`graphToCSV: vi.fn()`), so wagmi and Kubo never load.
    - **Navigation:** `$app/navigation`, with `goto: vi.fn()` and `afterNavigate: vi.fn()`.
    - **Page state:** `$app/state`, with `page` as `{ params: { path: 'a' }, url: new URL('http://localhost/a/') }`.
    - **Then:** render the page with `vitest-browser-svelte`.
  - **Typing:** typing `emm` into `#actions input[type="search"]` shows `#search-results` in the first `section#browse` without submitting.
  - **Menu closes, results stay:** after typing, call `document.getElementById('actions').hidePopover()`; `#search-results` is still shown (FR-015).
  - **Dual panes while searching:** check "Dual Panes", navigate the second pane elsewhere, and type `emm`. The second `section#browse` is `hidden`.
  - **After clearing:** the second pane is shown again, at its own path (from its breadcrumbs).
  - **Toggling during a search:** unchecking Dual Panes while searching leaves one pane after clearing.

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement `src/lib/search.ts`: `export const PAGE_SIZE = 100` and `export function partsOf(query)`, which returns `[]` when `query.trim()` is empty and otherwise `query.split('/').filter((part) => part.length > 0)`. T005 passes.
- [X] T012 [P] [US1] Implement `src/lib/server/search.ts` (depends on T004) per [contracts/search-remote.md](contracts/search-remote.md) and research R2, R4 and R5.
  - **`quote(text)`:** `` `\\Q${text.replaceAll('\\E', '\\E\\\\E\\Q')}\\E` ``. Add one comment saying it mirrors Java's `Pattern.quote`.
  - **`re(part)`:** `TextP.regex('(?iu)' + quote(part))`.
  - **`searchTraversal({ source, start, parts, offset = 0 })`:**
    - **Earlier parts:** for each, `.outE('CONTAINS').until(__.has('path', re(p))).repeat(__.inV().outE('CONTAINS').simplePath()).inV()`. Add one comment on why the first match on a branch is enough.
    - **Last part:** `.outE('CONTAINS').emit(__.has('path', re(last))).repeat(__.inV().outE('CONTAINS').simplePath()).inV()`.
    - **Then:** `.project('id', 'names').by(__.id()).by(__.path().unfold().hasLabel('CONTAINS').values('path').fold())`, followed by `.order().by(__.select('names').count(Scope.local)).by(__.select('names').unfold().toLower().fold()).by(__.select('id'))`, then `.dedup().by(__.select('id'))`, then `.range(offset, offset + PAGE_SIZE + 1)`.
  - **`searchSpots({ source, from, path, parts, offset, maxDepth })`:**
    - **Start:** projects each `resolvePath` candidate as `{ id, key: precedence() }` and picks the smallest by `compareKeys`.
    - **Results:** runs `searchTraversal`, maps each row with `Object.fromEntries`, and returns `{ results: rows.slice(0, PAGE_SIZE), more: rows.length > PAGE_SIZE }`.
    - **Errors:** no candidate throws ``error(404, `No Spot at /${path.join('/')}/.`)``. Any other failure is rethrown as `error(500, 'Search: "…"')`, with the same `TypeError` → "Connection Error: …" rewrite as `src/lib/remotes/listing.remote.ts`. `isHttpError` errors pass through unchanged.
  - **Check:** T006 passes.
- [X] T013 [US1] Implement `src/lib/remotes/searchSpots.remote.ts` (depends on T012) as a `query` with the Valibot schema in [contracts/search-remote.md](contracts/search-remote.md). It's a thin wrapper: filter empty `path` segments, then `return searchSpots({ source: g(), from: await writeLayer(), path, parts, offset, maxDepth })`. It has no error handling of its own, since every error is mapped in `searchSpots` and tested in T006.
- [X] T014 [US1] Implement `src/lib/components/SearchResults.svelte` (depends on T011 and T013) per the DOM contract and internal state in [contracts/ui.md](contracts/ui.md).
  - **Props:** `path` and `query`, both `$bindable`.
  - **Debounce:** `settled` is `$state(partsOf(query))`, updated by a `$effect` that sets a 150 ms `setTimeout` and clears it on cleanup.
  - **Pages:** `pages` is `$state([0])`. A `$effect` resets it to `[0]` when `settled` or `path` changes.
  - **Rendering:** `{#each pages as offset (offset)}` renders an `{#await searchSpots({ path, parts: settled, offset })}` block. That gives loading on the first page, an error alert, "Nothing matched" for an empty first page, and `<li><a>` items.
  - **Show more:** `button.more` is shown after the last page when that page has `more`, and appends `offset + PAGE_SIZE` to `pages`.
  - **Clear and links:** `button.clear` sets `query = ''`. Links use `href={resolve([...path, ...names].join('/') + '/')}`.
  - **Check:** T007 passes.
- [X] T015 [US1] Edit `src/lib/components/FileBrowser.svelte` (depends on T014). Add `query = $bindable('')` to its props. When `partsOf(query).length > 0`, render `<SearchResults bind:path bind:query/>` in place of the `{#await listing(…)}` block, leaving drag and drop and context menus untouched. T008 passes.
- [X] T016 [P] [US1] Edit `src/lib/components/FileView.svelte`.
  - **Props:** add `query = $bindable('')` and `hidden = false`.
  - **Markup:** pass `bind:query` to `FileBrowser`, and set `{hidden}` on `section#browse`.
  - **CSS:** add `#browse[hidden] { display: none; }`, because the author `display: flex` overrides the browser's `[hidden]` style.
  - **Check:** T009 passes.
- [X] T017 [US1] Edit `src/routes/[...path]/+page.svelte` (depends on T015 and T016).
  - **State:** add `let query = $state('')`, and bind the actions menu's `<input type="search">` to it.
  - **First pane:** `<FileView bind:path bind:query me={whoAmI}/>`.
  - **Second pane:** `<FileView path={untrack(() => [...path])} me={whoAmI} hidden={partsOf(query).length > 0}/>`, still inside `{#if dualPanes}`, with one comment explaining why it's hidden rather than unmounted (FR-017).
  - **Check:** T010 passes.
- [X] T018 [US1] Delete `src/lib/remotes/subpathSearch.remote.ts`, which is unused and superseded (research R1). Confirm nothing imports it with `grep -rn subpathSearch src`.

**Checkpoint**: US1 works on its own. Searching, clearing, paging and dual-pane suspension all pass their tests.

---

## Phase 4: User Story 2 - Go to a result (Priority: P2)

**Goal**: Choosing a result, by pointer or keyboard, navigates the first pane to that Spot. It also clears the query, closes the actions menu, and restores the split.

**Independent Test**: Search, choose a result two or more levels down, and check that the view and breadcrumbs show that Spot's normal listing. Then do the same with the keyboard only.

### Tests for User Story 2 ⚠️

- [X] T019 [P] [US2] Extend `src/lib/components/SearchResults.svelte.test.ts`.
  - **Click:** clicking the `b/c/gemma/` link with `path` `['a']` sets the bound `path` to `['a', 'b', 'c', 'gemma']` and `query` to `''`, and calls `hidePopover` on a stub `#actions` popover element.
  - **Arrows:** ArrowDown and ArrowUp move focus between result links, across page boundaries, and stop at the ends.
  - **Enter:** Enter on a focused link does the same as the click.
- [X] T020 [P] [US2] Extend `src/routes/[...path]/page.svelte.test.ts`.
  - **Field to results:** ArrowDown in the search field focuses `#search-results a`, the first result.
  - **Choosing:** pressing Enter there closes `#actions` (`:popover-open` is false), empties the field, and shows the chosen Spot's breadcrumbs.
  - **Dual panes:** with Dual Panes on, the second pane is visible again, at its own path.

### Implementation for User Story 2

- [X] T021 [US2] Edit `src/lib/components/SearchResults.svelte` (depends on T014).
  - **Choosing:** the link's `onclick` uses `navigateOnClick({ target: [...path, ...names], set: (next) => { path = next; query = ''; document.getElementById('actions')?.hidePopover() } })`.
  - **Arrows:** an `onkeydown` on the `section` moves focus to the previous or next `a` on ArrowUp and ArrowDown, with `preventDefault()`.
  - **Check:** T019 passes.
- [X] T022 [US2] Edit `src/routes/[...path]/+page.svelte` (depends on T017 and T021). Add `onkeydown` to the search `<input>`: on ArrowDown, `preventDefault()` and focus `document.querySelector<HTMLAnchorElement>('#search-results a')`. T020 passes.

**Checkpoint**: US1 and US2 both work, and the keyboard alone can find and open a Spot.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T023 [P] Run the constitution's merge checks exactly as written: `pnpm run lint` and `pnpm run check`. Fix every error in files touched by T002–T022. Any remaining lint error must be one already listed in T001's "Baseline lint errors"; if it isn't, it's new and must be fixed.
- [X] T024 [P] Run `pnpm test`, which is the unit suites for both Vitest projects plus `test:e2e`, passing with no e2e tests. Confirm the graph is unchanged afterwards by comparing `g().V().count()` before and after.
- [ ] T025 Walk through the "Manual run" in [quickstart.md](quickstart.md) against `pnpm dev`, including the timing in step 8, and note any deviation in this file under a "Validation notes" heading.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none. T001 is needed for the `client` tests (T007–T010, T019, T020) and for the merge checks (T023, T024); T002 is needed for T003 and T006.
- **Foundational (Phase 2)**: T003 → T004. This blocks T012.
- **US1 (Phase 3)**: tests T005–T010 come first. Then the implementation: T011 and T012 in parallel, then T013, then T014, then T015. T016 runs in parallel with T013–T015. T017 needs T015 and T016. T018 can come at any point after T013.
- **US2 (Phase 4)**: depends on US1 (it acts on US1's results). T019 and T020 in parallel, then T021, then T022.
- **Polish (Phase 5)**: after the stories you want are done.

### User Story Dependencies

- **US1 (P1)**: needs Phases 1 and 2. It's the MVP: searching, clearing, paging and dual-pane suspension.
- **US2 (P2)**: needs US1's `SearchResults` and the page wiring. It can still be tested on its own as "choose a result → navigate".

### Within Each User Story

- Tests are written and seen to fail before the code they cover.
- The server traversal (`search.ts` in `server/`) comes before the remote, the remote before components, and components before page wiring.

### Parallel Opportunities

- T002 runs alongside T001.
- T005–T010 are all different files, so all can be written in parallel.
- T011 runs in parallel with T012 once T004 is done. T016 runs in parallel with T013–T015.
- T019 and T020 run in parallel. T023 and T024 run in parallel.

---

## Parallel Example: User Story 1

```bash
# Write all US1 tests together:
Task: "T005 partsOf unit tests in src/lib/search.test.ts"
Task: "T006 Gremlin search tests in src/lib/server/search.test.ts"
Task: "T007 SearchResults component tests in src/lib/components/SearchResults.svelte.test.ts"
Task: "T008 FileBrowser search-mode tests in src/lib/components/FileBrowser.svelte.test.ts"
Task: "T009 FileView hidden/query tests in src/lib/components/FileView.svelte.test.ts"
Task: "T010 page wiring tests in src/routes/[...path]/page.svelte.test.ts"

# Then the independent implementations:
Task: "T011 Implement src/lib/search.ts"
Task: "T012 Implement src/lib/server/search.ts"
Task: "T016 Edit src/lib/components/FileView.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (T001–T002), then Phase 2 (T003–T004).
2. Phase 3 (T005–T018).
3. **Stop and validate**: run the US1 suites and quickstart steps 1–6 and 8.

### Incremental Delivery

1. Setup + Foundational: browsing is unchanged and the resolution is shared.
2. US1: searching works; you reach a result by clicking its link, since the link is a plain `href` even before US2's handler.
3. US2: keyboard navigation, plus choosing a result clears the query, closes the menu and restores the split.

---

## Validation notes

Recorded during `/speckit-implement`, 2026-11-17.

- **T001, beyond the plan:**
  - **Browser tests:** they also needed `src/vitest.browser-setup.ts`, registered as a `setupFiles` entry for the `client` project in `vite.config.ts`. `$app/env/public` reads `globalThis.__sveltekit_dev`, which only SvelteKit's page runtime defines.
  - **E2E build:** `--pass-with-no-tests` alone didn't make `pnpm test` pass, because Playwright's web server runs `npm run build` first. That build failed because the separately installed `editor/` package had esbuild's install script blocked by pnpm. Adding `editor/pnpm-workspace.yaml` with `allowBuilds: { esbuild: true }` and reinstalling fixed it.
- **T005:** `partsOf` drops whitespace-only parts as well as empty ones, so `' / '` is an empty search. spec.md (Edge Cases, FR-016) and data-model.md were updated to match.
- **T006:**
  - **Dedup:** the server ran `dedup()` before `order()`, so a Spot with two parents kept an arbitrary path. `searchTraversal` puts `barrier()` between them. See the test "lists a Spot with two parents once…".
  - **Performance:** on 10,000 Spots with 1,000 matches, every page returned within the 1 s budget.
- **T012:** `@types/gremlin` 3.6 lacks TinkerPop 3.7's `toLower()`, so `search.ts` wraps it in a narrowly typed helper.
- **T023:** `pnpm run lint` reports exactly the baseline (7 errors and 2 warnings, none in files this feature touched). `pnpm run check` reports 0 errors; its 2 warnings are unused CSS selectors that predate this feature.
- **T024:** `pnpm test` exits 0 (87 tests in 8 files). The local graph had 500 vertices and 499 edges both before and after.
- **T025 (open):** the manual run needs a wallet sign-in in a real browser, so it's left for the maintainer.
