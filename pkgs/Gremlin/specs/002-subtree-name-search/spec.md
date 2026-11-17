# Feature Specification: Subtree Name Search

**Feature Branch**: `drag-to-move`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Make it so that when someone types in the search bar in the action menu popover, it will show a listing of all Spots below that current position which contain the given string as a substring to the CONTAINS edge right before the spot."

## Clarifications

### Session 2026-11-17

- Q: Should name matching be case-sensitive? → A: Case-insensitive; `emma` matches `Emma/` and `GEMMA/`, but accents still count (`emma` doesn't match `Émma/`).
- Q: Should the search include trees mounted below the current position? → A: Not in this feature; search only follows the Spots each Spot contains, and mounts are left to a later feature.
- Q: Where should search results appear? → A: They replace the main file view's listing until the query is cleared.
- Q: How should more than 100 matches be handled? → A: Show the first 100 with a "show more" control that loads the next 100.
- Q: How should a `/` in the query be treated? → A: It splits the query into parts that must match, in order, the names of Spots at successive (not necessarily adjacent) levels; `austen/em` finds `…/Austen/…/Emma/`.
- Q: What happens to dual panes while results are showing? → A: The split is temporarily turned off, so the results fill the whole view; it returns when the search ends.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Spots below here by name as you type (Priority: P1)

A user viewing a Spot (for example `/media/book/`) opens the actions menu and starts typing in its search field. As they type, the main file view's listing is replaced by the results: every Spot anywhere below the current position whose name contains what they've typed. Each result shows where it is relative to the current position, for example `by/Austen/Emma/`. The view shows the query being searched for, with a control to clear it, so the user can get the normal listing back even after the actions menu has closed.

**Why this priority**: This is the whole request. Today the search field does nothing, and the only way to find a deeply nested Spot is to click down through every level.

**Independent Test**: In a Spot with a known subtree, type a fragment that appears in names at several depths and verify the file view lists exactly those Spots and no others.

**Acceptance Scenarios**:

1. **Given** the user is at `/a/`, which contains `b/emma/`, `b/c/gemma/`, and `d/`, **When** they type `emm`, **Then** the file view shows `b/emma/` and `b/c/gemma/` in place of its listing, and nothing else.
2. **Given** the file view shows results for `emm`, **When** the user types one more character to make `emma`, **Then** the results update to show only the Spots whose names contain `emma`, without the user pressing Enter.
3. **Given** the user is at `/a/b/`, **When** they search for a name that only exists under `/a/d/`, **Then** the file view says nothing matched.
4. **Given** the user has typed a query, **When** they clear the field, **Then** the file view shows its normal listing of `/a/` again.
5. **Given** the user is at `/a/`, which is itself named `a`, **When** they search for `a`, **Then** `/a/` itself is not in the results, but Spots below it whose names contain `a` are.
6. **Given** the user is at `/media/book/`, which contains `by/Austen/Emma/`, `by/Austen/collected/Emma/`, and `by/Brontë/Emma's Letters/`, **When** they type `austen/em`, **Then** the results are `by/Austen/Emma/` and `by/Austen/collected/Emma/`, and not `by/Brontë/Emma's Letters/`.
7. **Given** dual panes are on, with the first pane at `/a/` and the second at `/q/`, **When** the user types `emm`, **Then** the split goes away and the results fill the whole view; **When** they then clear the query, **Then** both panes return, at `/a/` and `/q/`.
8. **Given** results are showing and the actions menu has closed, **When** the user uses the clear control in the file view, **Then** the query is cleared and the normal listing returns.

---

### User Story 2 - Go to a result (Priority: P2)

From the results in the file view, the user picks a Spot and the view navigates there, the same as if they had clicked down to it. The query is cleared, so the view shows that Spot's normal listing.

**Why this priority**: Finding a Spot is only useful if you can get to it. It builds on Story 1's results.

**Independent Test**: Search, choose a result two or more levels down, and verify the view and breadcrumbs now show that Spot with its normal listing.

**Acceptance Scenarios**:

1. **Given** the file view shows `b/c/gemma/` while the user is at `/a/`, **When** they choose it, **Then** the view shows the normal listing of `/a/b/c/gemma/`, the breadcrumbs read `a/ b/ c/ gemma/`, the query is cleared, and the actions menu is closed.
2. **Given** results are showing, **When** the user moves from the search field into the results with the keyboard and confirms one, **Then** the view navigates to it as if it had been clicked.

---

### Edge Cases

- Matching is case-insensitive: `emma` finds `Emma/` and `GEMMA/`. Accents are not folded: `emma` does not find `Émma/`.
- Each part of a query is matched exactly as typed, spaces and punctuation included, so `publication date` matches `ordered by publication date/`. A query that is empty, only whitespace, or only `/`s leaves the normal listing in place.
- Blank parts (empty or only spaces) are ignored, so `emma/`, `/emma`, and `austen//emma` mean the same as `emma` and `austen/emma`, and ` / ` searches for nothing.
- In a multi-part query, the first part must match a Spot below the current position, not the current Spot itself; the last part matches the Spot that is listed.
- A Spot whose name itself contains `/` can't be found by typing that `/`, because the `/` splits the query.
- Names and queries in any script, including accented and non-Latin characters and emoji, match correctly.
- A Spot reachable by more than one path is listed once, at its shallowest path.
- At the root, the search covers the user's whole tree.
- Spots that appear below the current position only because another tree is mounted there are not found, even though browsing shows them.
- If the user navigates elsewhere (for example, through the breadcrumbs) while a query is active, the results are refreshed for the new position.
- With dual panes on, the split is suspended while results are showing and comes back when the search ends, whether the query is cleared or a result is chosen. The second pane returns at the position it had before; choosing a result moves only the first pane.
- The Dual Panes setting itself is unchanged by searching. Turning it on or off while results are showing takes effect when the search ends.
- When more than 100 Spots match, the first 100 are listed (shallowest first) with a "show more" control that appends the next 100 in the same order, until every match is shown and the control goes away.
- If the query changes while more results are loading, those results are discarded and the list starts again from the first 100 for the new query.
- If the search can't be completed (for example, the server is unreachable), the file view says so instead of showing stale or partial results as if they were complete.
- Results from an earlier, shorter query never replace results for the current query, even if they arrive later.
- Only Spots are matched; the names or types of Content (files) inside Spots are not searched.
- A result whose Content is all non-displayable (for example, text) has neither a preview nor the folder icon, and is otherwise shown the same as one with a preview.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Typing in the actions menu's search field MUST replace the main file view's listing with the Spots below the current position that match the query (FR-016), without the user submitting the form.
- **FR-002**: A Spot's name, for matching and display, MUST be the name it has in its parent Spot (the name its containing Spot gives it).
- **FR-003**: The search MUST cover every depth below the current position and MUST exclude the current Spot itself.
- **FR-004**: Each part of the query MUST be matched as a case-insensitive substring of a name, exactly as typed; accented and unaccented letters MUST NOT be treated as equal.
- **FR-016**: The query MUST be split on `/` into parts, ignoring blank ones (empty or only whitespace). A Spot MUST be a result when its name matches the last part and the names of Spots on its path below the current position match the earlier parts in order, at any depths, each part matched by a different Spot. A one-part query matches only the Spot's own name.
- **FR-005**: The search MUST start from the Spot the current position resolves to, as browsing resolves it, and from there follow only the Spots each Spot contains, never mounts.
- **FR-006**: Each matching Spot MUST be listed once, at its shallowest path, and the search MUST finish even if a Spot is reachable by more than one path.
- **FR-007**: Each result MUST show its path relative to the current position, and results MUST be ordered shallowest first, then alphabetically.
- **FR-008**: Choosing a result, by pointer or by keyboard, MUST navigate the view to that Spot, clear the query, and close the actions menu, leaving the Spot's normal listing.
- **FR-009**: The results MUST update as the query changes and MUST always reflect the latest query, discarding results for earlier ones.
- **FR-010**: An empty or whitespace-only query MUST leave the normal listing in place; a query with no matches MUST say that nothing was found.
- **FR-011**: When more than 100 Spots match, the file view MUST show the first 100 and a "show more" control that appends the next 100, continuing the FR-007 order with no Spot repeated or skipped; the control MUST disappear once every match is shown.
- **FR-012**: A failed search MUST show an error in the file view rather than an empty or partial result.
- **FR-014**: While results replace the listing, the file view MUST show the active query and a control that clears it, usable without reopening the actions menu.
- **FR-015**: The results MUST stay in place when the actions menu closes, until the query is cleared or a result is chosen.
- **FR-017**: While results are showing, the view MUST NOT be split into dual panes. When the search ends, the split MUST return if Dual Panes is on, with the second pane at the position it had before the search.
- **FR-013**: The search MUST only return Spots the user could reach by browsing from the current position.
- **FR-018**: A result whose Spot holds displayable Content (an image or a video) MUST begin with a small preview of it. When it holds several, the preview MUST be the first in the order the listing shows Content. A result whose Spot holds no Content at all MUST begin with the folder icon the file view uses.

### Key Entities

- **Spot**: A location in the tree. It can contain other Spots, each under a name given by the containing Spot. The same Spot may be reachable by more than one path.
- **Current position**: The Spot shown in the main view, whose subtree the search covers.
- **Query**: The text typed into the actions menu's search field, split on `/` into one or more parts.
- **Result**: A matching Spot together with its path relative to the current position.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can reach a Spot nested five levels below the current position by typing part of its name and choosing one result, without clicking through any intermediate levels.
- **SC-002**: For a subtree of up to 10,000 Spots, results for the latest query appear within 1 second of the user stopping typing.
- **SC-003**: For a known test tree, the results contain 100% of the matching Spots below the current position and 0 non-matching Spots or Spots outside the subtree.
- **SC-004**: In a tree where a Spot is reachable by more than one path, the search always finishes and lists no Spot more than once.
- **SC-005**: Results for an outdated query are never shown after the field has changed.
- **SC-006**: For a query matching 1,000 Spots, choosing "show more" until it disappears lists all 1,000 exactly once, each further 100 appearing within 1 second.

## Assumptions

- "The CONTAINS edge right before the spot" means the name a Spot has in its parent, which is how Spots are named when browsing. Spots carry no name of their own.
- "Below that current position" means the whole subtree at every depth, not just the immediate children, and does not include the current Spot.
- With dual panes on, the current position is the first (main) pane's.
- The 100-result page size and the 1-second targets are defaults; nothing in the request specified them.
- "Alphabetically" (FR-007) ignores case and compares characters by Unicode code point, so it's the same for every viewer but not language-aware: accented letters sort after `z` (`Ärger/` comes after `zebra/`).
- Searching Content (file) names or types, searching outside the current subtree, and searching trees mounted below the current position are out of scope. Mounted trees are left to a later feature.
- No sign-in is needed to search beyond whatever browsing the current position already needs.
