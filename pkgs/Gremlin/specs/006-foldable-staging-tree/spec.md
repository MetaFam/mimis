# Feature Specification: Foldable Staging Tree

**Feature Branch**: `master`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "In the UI for selecting which items to stage for commitment, structure subtrees as nested lists and create the UI to allow them to be folded."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See pending Spots as a tree (Priority: P1)

A signed-in user opens Publish with pending changes under `/icon/hat/`, `/icon/cap/`, and `/docs/`. Today the dialog lists every pending Spot as a flat line of its full path, so `icon/`, `icon/hat/`, and `icon/hat/top/` read as unrelated rows. Instead, each section, Staged and Unstaged, shows its pending Spots as a nested list that follows the tree: `hat/` and `cap/` appear inside `icon/`, and each row is labelled by its own name, not its full path. Each row keeps its checkbox and its summary, “new” or “+added −removed”, so staging works as before.

**Why this priority**: Deciding what to publish means deciding which parts of the tree to share. Rows that show where they sit make that decision readable, and folding builds on the nesting.

**Independent Test**: With pending Spots at `/`, `/icon/`, `/icon/hat/`, `/icon/hat/top/`, and `/docs/`, open Publish and check that each section nests them by path, that every row shows only its own name, and that staging and unstaging a row moves it between the sections, nested in place.

**Acceptance Scenarios**:

1. **Given** pending Spots `/icon/`, `/icon/hat/`, and `/icon/cap/`, all unstaged, **When** the user opens Publish, **Then** the Unstaged section shows `icon/` with `hat/` and `cap/` nested inside it, and no row reads `icon/hat/`.
2. **Given** a pending `/icon/hat/top/` whose parents `/icon/` and `/icon/hat/` aren't pending, **When** the user opens Publish, **Then** `top/` is nested inside `icon/` and `hat/`, and those two are shown as context only, without a checkbox or a summary.
3. **Given** `/icon/` is staged and `/icon/hat/` isn't, **When** the user opens Publish, **Then** the Staged section shows `icon/` with its checkbox, and the Unstaged section shows `hat/` nested inside `icon/` shown as context.
4. **Given** the tree above, **When** the user stages `hat/`, **Then** it leaves the Unstaged section and appears inside `icon/` in the Staged section, and nothing else changes.
5. **Given** the root `/` is pending, **When** the user opens Publish, **Then** its row heads the section, labelled `/`, with the other rows nested inside it.
6. **Given** sibling rows `docs/`, `Icon/`, and `art/`, **When** they are shown, **Then** they keep the order the dialog uses today.

---

### User Story 2 - Fold and unfold subtrees (Priority: P1)

The user has hundreds of pending Spots under `/import/` from a directory they brought in, and a few under `/docs/` they want to look over first. They fold `import/`, so its subtree collapses to one row showing how many pending Spots it holds, and they look over `docs/`. Unfolding `import/` shows its subtree as it was.

**Why this priority**: This is the second half of the request. Without folding, a large import buries everything else in the list.

**Independent Test**: With pending Spots under `/import/` and `/docs/`, fold `import/` and check that its descendants are hidden, its row shows their count, and unfolding restores them. Fold a row in one section and check that the other section isn't affected.

**Acceptance Scenarios**:

1. **Given** a row with nested rows, **When** the user folds it, **Then** its nested rows are hidden, and the row shows how many pending Spots it holds below it in that section.
2. **Given** a folded row, **When** the user unfolds it, **Then** its nested rows show again, each folded or unfolded as it was.
3. **Given** a row with no nested rows, **When** it is shown, **Then** it offers no fold control.
4. **Given** the user folded `import/` and then stages or unstages another row, **When** the list updates, **Then** `import/` is still folded.
5. **Given** the user folded `import/` in the Unstaged section, **When** they look at the Staged section, **Then** any `import/` row there is unaffected.
6. **Given** a keyboard user, **When** they focus a row's fold control, **Then** they can fold and unfold it from the keyboard, and the control says whether it is expanded.

---

### User Story 3 - Open large imports already folded (Priority: P2)

The user imports a directory of 10,000 files, then opens Publish. The dialog opens quickly with the import's top row folded, showing its count, rather than listing 10,000 rows.

**Why this priority**: Without it, the dialog is slow and unwieldy in exactly the case folding is for. It needs Story 2.

**Independent Test**: Seed 10,000 pending Spots under one folder, open Publish, and check that it opens within the time in SC-002, with that folder's row folded and showing its count.

**Acceptance Scenarios**:

1. **Given** a row whose subtree holds more than 50 pending Spots in its section, **When** the dialog opens, **Then** that row starts folded.
2. **Given** a row whose subtree holds 50 or fewer, **When** the dialog opens, **Then** it starts unfolded.
3. **Given** the user unfolded a row that started folded, **When** the list updates after staging, **Then** it stays unfolded.

---

### Edge Cases

- A pending Spot is reached by two links, so it has two paths. It is shown once, under the path the dialog already uses for it.
- Every row of a section is nested under ancestors that aren't pending in that section. The ancestors still show, as context, so the rows keep their place.
- A context row whose last pending descendant leaves the section disappears.
- Folding a context row works as for any other row.
- A row folded while its whole subtree is staged, which empties the subtree from the section, is no longer offered as folded, since it has nothing to hide.
- “Stage Everything” and “Unstage Everything” still stage or unstage every pending Spot, folded or not.
- Names in any script, including emoji and combining marks, and names with spaces show as they do in the browser.
- With nothing pending, the dialog shows its sections as it does today, empty.

## Requirements *(mandatory)*

### Functional Requirements

#### Nesting

- **FR-001**: Each section of the publish dialog, Staged and Unstaged, MUST show its pending Spots as a nested list following their paths: a Spot's row MUST be inside the row of its parent path.
- **FR-002**: Each row MUST be labelled by the last segment of its path followed by `/`, and the root's row by `/`.
- **FR-003**: When a pending Spot's parent path has no pending Spot in that section, the parent MUST be shown as a context row, without a checkbox or a summary, so that every row sits at its place in the tree.
- **FR-004**: Every pending Spot's row MUST keep its checkbox, which stages or unstages that Spot alone, and its summary, as today. Nesting MUST NOT change what staging a row does.
- **FR-005**: Sibling rows MUST be ordered as the dialog orders paths today.

#### Folding

- **FR-006**: A row with nested rows MUST offer a control to fold and unfold them. A row without MUST NOT.
- **FR-007**: A folded row MUST hide everything nested inside it and show how many pending Spots, in its section, are nested inside it.
- **FR-008**: Each section's fold state MUST be its own, and each row's fold state MUST be kept while the dialog is open, across staging, unstaging, and refreshes of the list.
- **FR-009**: When the dialog opens, a row whose subtree holds more than 50 pending Spots in its section MUST start folded, and any other row MUST start unfolded.
- **FR-010**: Fold controls MUST be operable from the keyboard and MUST expose whether their row is expanded to assistive technology.

#### Unchanged

- **FR-011**: “Stage Everything” and “Unstage Everything”, the comment, Publish, the list of Spots included to stay connected, and every message the dialog shows MUST behave as they do today.

### Key Entities

- **Pending Spot**: A Spot in the user's tree with changes not yet published, with its path, whether it is staged, whether it is new, and its counts of added and removed entries. Unchanged from 003.
- **Row**: A pending Spot, or a context row for a path with no pending Spot in that section, placed by its path, with the rows nested inside it.
- **Fold state**: Whether a row is folded, kept per section and per path while the dialog is open.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every pending Spot, its row's position from the section's top level down spells its path, and 100% of rows are labelled by one name only.
- **SC-002**: With 10,000 pending Spots under one folder, the dialog opens and is usable within 2 seconds, with that folder folded.
- **SC-003**: A user can fold or unfold any subtree with one action, mouse or keyboard.
- **SC-004**: After staging or unstaging any row, 100% of the rows the user folded or unfolded keep that state.
- **SC-005**: Staging behaves exactly as before: for any sequence of checkbox changes, the set of staged Spots is the same as with the flat list.

## Assumptions

- “The UI for selecting which items to stage for commitment” is the Publish dialog's list of pending Spots, with its Staged and Unstaged sections, from 003. The two sections stay, each nested on its own, since staging one Spot doesn't stage its descendants (003's FR-030).
- A row's checkbox keeps staging only its own Spot. Staging a whole subtree from its parent's row is a separate change that this feature doesn't make.
- Folding hides rows within the dialog only. It doesn't change what is pending, staged, or published.
- Fold state lasts while the page is open. Remembering it across reloads is out of scope.
- 50 pending Spots is the threshold for starting folded: enough to keep ordinary edits unfolded, and few enough that an import starts folded.
- The paths are the ones the dialog already shows, from the pending list. No new information about the tree is needed.
- The order of siblings is today's order of paths. Nesting doesn't sort anything differently.
