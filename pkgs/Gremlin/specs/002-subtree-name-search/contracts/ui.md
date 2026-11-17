# Contract: UI components

## `src/lib/search.ts` (pure, shared)

```ts
export const PAGE_SIZE = 100
export function partsOf(query: string): Array<string>
```

The rules are in [data-model.md](../data-model.md) (*Query → Parts*). Matching itself runs in Gremlin; see [search-remote.md](search-remote.md).

## `+page.svelte`

- **Query state:** owns `let query = $state('')`.
- **Search field:** the actions menu's `<input type="search" bind:value={query}>`. Submitting the form does nothing extra, since results already update as you type (FR-001).
- **Arrow key:** ArrowDown in the field moves focus to `#search-results a` (the first result).
- **First pane:** `<FileView bind:path bind:query me={whoAmI}/>`.
- **Second pane:** `<FileView path={…} me={whoAmI} hidden={partsOf(query).length > 0}/>`, still inside `{#if dualPanes}` (FR-017).

## `FileView.svelte`

| Prop | Type | Notes |
| --- | --- | --- |
| `path` | `$bindable<Array<string>>` | Unchanged |
| `me` | `string \| null` | Unchanged |
| `query` | `$bindable<string>`, default `''` | Passed through to `FileBrowser` |
| `hidden` | `boolean`, default `false` | Set on the root `<section id="browse">`. The CSS adds `#browse[hidden] { display: none }` |

## `FileBrowser.svelte`

| Prop | Type | Notes |
| --- | --- | --- |
| `path` | `$bindable<Array<string>>` | Unchanged |
| `query` | `$bindable<string>`, default `''` | When `partsOf(query).length > 0`, renders `SearchResults` in place of the listing (FR-001) |

## `SearchResults.svelte`

| Prop | Type | Notes |
| --- | --- | --- |
| `path` | `$bindable<Array<string>>` | The current position; choosing a result sets it to `[...path, ...names]` |
| `query` | `$bindable<string>` | Shown as the active query; the clear control and choosing a result set it to `''` |

**Internal state** (research R7):

- **`settled`:** `partsOf(query)`, updated 150 ms after the last change.
- **`pages`:** `$state<Array<number>>([0])`, reset to `[0]` when `settled` or `path` changes.
- **Fetching:** each offset renders `{#await searchSpots({ path, parts: settled, offset })}`.

**DOM contract**, relied on by the tests:

| Element | Selector | When |
| --- | --- | --- |
| Region | `section#search-results[aria-label="Search results"]` | Always, while searching |
| Active query | `#search-results output` containing the query text | Always |
| Clear control | `#search-results button.clear` (`aria-label="Clear search"`) | Always |
| Loading | `#search-results [role="status"]`, text "Searching…" | While the first page loads |
| Error | `#search-results [role="alert"]` with the message | A page failed (FR-012) |
| Empty | `#search-results [role="status"]`, text "Nothing matched" | The first page has 0 results (FR-010) |
| Results | `#search-results ol > li > a[href]`, text `names.join('/') + '/'` | Every loaded page, in order |
| Preview | The link's first child: `img.thumb[alt=""]` for an image, or `video.thumb[muted]` for a video, with `src` = `toHTTP({ cid })` | A result with a `thumb` (FR-018) |
| Folder | The link's first child: `img.thumb.folder[alt=""]`, with `src` = `#lib/assets/folder.svg` | A result with no `thumb` and empty `types` (FR-018) |
| Show more | `#search-results button.more` | While the last loaded page has `more` (FR-011) |

**Behaviour:**

- **Choosing a result:** sets `path`, sets `query = ''`, and calls `document.getElementById('actions')?.hidePopover()` (FR-008). It's the same handler for a click or Enter, wired through `navigateOnClick`.
- **Arrow keys:** ArrowUp and ArrowDown move focus between result links.
