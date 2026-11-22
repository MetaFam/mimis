# Feature Specification: Rename Spots

**Feature Branch**: `master`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "I would like to be able to rename Spots."

## Clarifications

### Session 2026-11-22

- Q: Can a user rename Spots that come from another user's layer? → A: Yes. Updates are processed as layers in a file system. To rename S's Spot, B mounts S's link in one commit, then commits the name change in another, and B's name overwrites S's in B's view.
- Q: What does B's layer hold for the renamed link? → A: A mount of the link itself, with its `path` changed. The only immutable attribute of a link is its uuid.
- Q: Which edge is the mount? → A: A `MOUNT` edge from B's counterpart of S's parent folder to the Spot B wants to reach, carrying the uuid of S's link and B's path.
- Q: What happens when S moves a link B has mounted? → A: B is notified of what S did and chooses one of three: remove their mount; move their mount to S's new location; or give their mount a new uuid and replace it with a `CONTAINS` edge of their own.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rename a Spot from the listing (Priority: P1)

A signed-in user browsing `/image/` sees a folder they named `hatz` by mistake. They open its menu, choose “Rename”, type `hats`, and confirm. The tile now reads `hats`, everything inside it is still there, and `/image/hats/` opens it. Files work the same way: a file's tile names its Spot, so renaming the tile renames that Spot and keeps every Content it holds.

**Why this priority**: Today the app can create, move, and delete Spots but not rename them, so a typo means deleting and rebuilding. This is the core of the request, and it delivers value on its own.

**Independent Test**: In a folder the user owns, rename a folder and a file through the tile menu, then check that each lists under its new name, opens at its new path with the same contents, and no longer appears under its old name.

**Acceptance Scenarios**:

1. **Given** the user owns `/image/` holding the folder `hatz`, which holds `top` and `bowler`, **When** they rename `hatz` to `hats`, **Then** `/image/` lists `hats` and not `hatz`, and `/image/hats/` lists `top` and `bowler`.
2. **Given** the user owns `/image/hat`, which holds two SVG Contents, **When** they rename the `hat` tile to `cap`, **Then** `/image/cap` holds the same two Contents in the same order, and `/image/hat` no longer exists.
3. **Given** the user is in the table view of `/image/`, **When** they rename the `hat` row to `cap`, **Then** the row reads `cap`, in both the table and the icon view.
4. **Given** the user starts renaming `hat`, **When** they cancel, or confirm the unchanged name, **Then** nothing changes and no error is shown.
5. **Given** dual panes are both showing `/image/`, **When** the user renames `hat` to `cap` in one, **Then** both panes list `cap` without a reload.

---

### User Story 2 - Rename another user's Spot in your own view (Priority: P1)

User B mounts user S's `/image/` and thinks S's `hatz` should be `hats`, as part of a critique of S's tree. B renames it exactly as they would their own. B's `image` Spot, B's counterpart of S's, gets a mount of S's `hatz` link: a mount edge to S's `hatz` Spot, carrying the uuid of S's link, with `hats` as its path. B's layer outranks S's, so B now sees `hats` with all of S's contents inside it, while S's tree is untouched and S still sees `hatz`. Anyone who views S's tree through B's layer, S included, sees B's name.

**Why this priority**: The tree is a stack of layers, so an edit to someone else's work is a layer on top of it rather than a change to it. This is what lets one user propose changes to another's tree, like a pull request, and renaming is a first such change.

**Independent Test**: Seed S's `/image/hatz/` with two entries and B's root mounting S's root. As B, rename `hatz` to `hats`. Check B's listing, check that B's layer holds exactly one mount edge, to S's `hatz` Spot, with the uuid of S's `hatz` link and the path `hats`, and check that S's listing is unchanged. Publish B's layer and rebuild it.

**Acceptance Scenarios**:

1. **Given** B mounts S's `/image/`, where `hatz` holds `top` and `bowler`, **When** B renames `hatz` to `hats`, **Then** B's `/image/` lists `hats` and not `hatz`, B's `/image/hats/` lists `top` and `bowler`, and S's `/image/` still lists `hatz`.
2. **Given** the rename above, **When** B's layer is inspected, **Then** B's `image` Spot, created if B had none, holds one mount edge to S's `hatz` Spot, with the uuid of S's `hatz` link and the path `hats`, and B's `/image/` lists it as an entry, not as a layer of `/image/`.
3. **Given** B's rename, **When** S adds `fedora` to `hatz`, **Then** B sees `fedora` in `/image/hats/`.
4. **Given** B's rename, **When** S renames `hatz` to `caps`, **Then** B still sees `hats`, because B's layer outranks S's.
5. **Given** B's rename, **When** S deletes `hatz`, **Then** B still sees `hats`, holding what S's Spot holds.
6. **Given** B's own `/image/hat` and S's `/image/hat` merge in B's listing, **When** B renames `hat` to `cap`, **Then** B's own link is renamed, S's link is mounted with the path `cap`, and B sees one merged `cap` and no `hat`.
7. **Given** B has renamed S's `hatz`, **When** B renames it again to `caps`, **Then** B's mount of the link gets the path `caps`, and no second mount is made.

---

### User Story 3 - Rename the Spot being viewed (Priority: P2)

A user is inside `/media/book/by/Austen/` and notices `by` should be `author`. They rename it from its breadcrumb without navigating up, whoever's layer `by` comes from. The breadcrumbs and the address now read `/media/book/author/Austen/`, and the page stays on the same Spot.

**Why this priority**: The listing covers every Spot, but only from its parent. Renaming where the user already is saves a navigation, and it needs the view to follow the new path, which builds on Stories 1 and 2.

**Independent Test**: While viewing a Spot three levels deep, rename an intermediate breadcrumb and the last one, and check that the view stays on the same Spot under its new path each time.

**Acceptance Scenarios**:

1. **Given** the user is viewing `/media/book/by/Austen/`, **When** they rename the `by/` breadcrumb to `author`, **Then** the view shows `/media/book/author/Austen/`, with the same listing.
2. **Given** the user is viewing `/a/b/`, **When** they rename the `b/` breadcrumb to `c`, **Then** the view shows `/a/c/`.
3. **Given** pane 1 is at `/a/b/x/` and pane 2 is at `/a/`, **When** the user renames `b` to `c` in pane 2, **Then** pane 1 moves to `/a/c/x/`.
4. **Given** any view, **When** the user looks at the root breadcrumb, **Then** it offers no rename.

---

### User Story 4 - Understand why a rename didn't work (Priority: P2)

When a rename is refused, the user sees why and the name stays as it was: the new name is already taken in that folder, or the name isn't allowed.

**Why this priority**: Without explanation, a refused rename looks like a broken one. The rules protect the tree, so they ship with Stories 1 and 2.

**Independent Test**: Try renaming to a sibling's name, to an empty name, and to a name containing `/`, and check that each shows a reason and leaves the tree unchanged. Check that a signed-out user is offered no rename.

**Acceptance Scenarios**:

1. **Given** the user's own `/image/` holds `hat` and `cap`, **When** the user renames `hat` to `cap`, **Then** a message says the folder already contains “cap”, and both stay as they were.
2. **Given** the user renames `hat`, **When** the new name is empty, only spaces, `.`, `..`, or contains `/`, **Then** the rename can't be confirmed, and a message says why.
3. **Given** the user isn't signed in, **When** they look at a tile's menu, **Then** it offers no rename.

---

### User Story 5 - Renames publish as layered commits (Priority: P3)

The user publishes their renames. A rename of their own link is published as the same link with a new path. A rename of another user's link is published as two commits: the first mounts the other user's link as it was, and the second changes its path. Anyone reading the public history can see what was changed from what.

**Why this priority**: Publishing is how a critique reaches anyone else, and recording the mount before the rename keeps the original in history, so the change can be seen as a change. It builds on 003's publishing and needs Stories 1 and 2.

**Independent Test**: As B, rename one of B's own published Spots and one of S's, publish, and check the Spot versions that result and a rebuild from public storage.

**Acceptance Scenarios**:

1. **Given** B's own `/image/hat` is published, **When** B renames it to `cap` and publishes, **Then** `/image/`'s new version lists one entry, under the link's uuid, with the path `cap` and no removal.
2. **Given** B has renamed S's `hatz` to `hats` and not yet published, **When** B publishes, **Then** B's `/image/` gets two new versions: the first lists an entry under the uuid of S's `hatz` link, with S as its owner and the path `hatz`; the second, naming the first as its previous, lists the same uuid with the path `hats`.
3. **Given** B's mount of S's link is published, **When** B renames it again and publishes, **Then** one new version lists that uuid with its new path.
4. **Given** those publishes, **When** B's tree is rebuilt from public storage, **Then** B sees the same names, and B's mounted link has the uuid of S's link and points to the same Spot.
5. **Given** the user renames their own `hat` to `cap` and back to `hat` before publishing, **When** they publish, **Then** `/image/` has nothing to publish for that link.

---

### User Story 6 - Decide what to do when a mounted link moves (Priority: P3)

B has renamed S's `/image/hatz` to `hats`. Later S moves `hatz` into `/old/`. B's mount was made at `/image/`, so it no longer covers where S's link is. B is told that S moved `hatz` from `/image/` to `/old/`, and chooses what their mount does: go away, follow S's link to `/old/`, or stay at `/image/` as a link of B's own that no longer tracks S's.

**Why this priority**: A link's uuid never changes, so the system can recognize that the link B mounted has moved. Only B can say whether their rename was about that link wherever it lives or about what sits at `/image/`. It only matters once Story 2's mounts exist and their owners move things.

**Independent Test**: As B, mount and rename S's `/image/hatz` as `hats`. As S, move `hatz` into `/old/`. Check that B is notified, then check each of the three choices from a fresh copy of that state: B's listings, B's layer, S's unchanged tree, and what B publishes.

**Acceptance Scenarios**:

1. **Given** B's mount of S's `/image/hatz` named `hats`, **When** S moves `hatz` into `/old/`, **Then** B is notified that S moved `hatz` from `/image/` to `/old/`, and the `hats` tile in B's `/image/` is marked as needing a decision.
2. **Given** that notice, before B chooses, **When** B lists `/image/` and `/old/`, **Then** `/image/` still lists `hats`, and `/old/` lists S's `hatz`.
3. **Given** that notice, **When** B chooses to remove their mount, **Then** B's `/image/` no longer lists `hats`, B's `/old/` lists `hatz`, and the notice is gone.
4. **Given** that notice, **When** B chooses to follow the move, **Then** B's mount moves to B's `/old/`, created if B had none, keeping its uuid and the name `hats`. B's `/image/` no longer lists `hats`, B's `/old/` lists `hats` and not `hatz`, and the notice is gone.
5. **Given** that notice, **When** B chooses to keep it as their own, **Then** B's mount is replaced by a link of B's own, with a new uuid, from B's `/image/` to a new Spot of B's that mounts S's Spot, named `hats`. B's `/image/hats/` lists what S's Spot holds, B's `/old/` lists S's `hatz`, and the notice is gone.
6. **Given** any of those choices, **When** B publishes, **Then** a removal publishes as the removal of the mount's entry, a follow publishes as the same uuid leaving `/image/` and joining `/old/`, and keeping it publishes as the removal of the mount's entry and the addition of B's new link.
7. **Given** B's notice, **When** S moves `hatz` again before B chooses, **Then** B has one notice, naming the link's latest place.

---

### Edge Cases

- Names in any script, including emoji and combining characters, rename and display correctly, and URL-reserved characters other than `/` (such as `?`, `#`, `%`, and spaces) are kept as typed.
- Leading and trailing spaces are trimmed. A name that differs only in case, such as `Hat` to `hat`, is a real rename, not a clash with itself.
- A Spot linked under its own name in two folders is renamed only in the folder where the rename is made. The other link keeps its name.
- A name reached through several mounted layers at once, such as S's and T's both under `hat`, gets a mount of each layer's link in the user's Spot, so that all of them take the new name.
- Renaming a mounted link back to the path it has in the lower layer keeps the mount. It still outranks the lower link, so a later rename by S doesn't show through.
- A mounted link whose lower link no longer exists, because S deleted it or the user stopped mounting S, keeps listing under the user's name, holding what its Spot holds, just as 004's proxies outlive their targets.
- When S moves a link that B has mounted, the link keeps its uuid, and B is notified (Story 6). Until B chooses, B sees it where B mounted it, under B's name, and also at S's new place, under S's name.
- When S moves a link back to the parent where B mounted it before B chooses, the notice is withdrawn.
- When S moves the link somewhere B's view doesn't reach, Follow isn't offered, and the notice names the new place by its path in S's tree.
- When B follows a move to a parent where B's own Spot already links another Spot under B's name, the follow is refused with a message, as a rename to that name would be, and the notice stays.
- Renaming to a name used only by a mounted layer is allowed, and the two Spots merge under that name, as same-named Spots across layers already do.
- A Spot never holds two mounts of the same link. A second is refused.
- If the Spot was moved, deleted, or renamed by another session after the menu opened, the rename is refused with a message, and the listing refreshes.
- Opening a Spot by its old path after a rename finds nothing there, as for any path that doesn't exist.

## Requirements *(mandatory)*

### Functional Requirements

#### Renaming

- **FR-001**: Signed-in users MUST be able to rename any Spot listed in a folder, from its tile in the icon view and its row in the table view, whichever layer it comes from.
- **FR-002**: Users MUST be able to rename any Spot on the breadcrumb trail except the root, from its breadcrumb, under the same rules.
- **FR-003**: Renaming a link in the user's own layer MUST change only its path. The Spot, everything it contains, its Contents and their order, its mounts, and the link's uuid MUST stay the same.
- **FR-004**: Renaming a link from another layer MUST change only Spots the user owns. It MUST give the user's own Spot at the parent's path, creating that Spot and its parents if they don't exist, a mount edge to the link's Spot, carrying the link's uuid and the new name as its path. When the user's Spot already mounts the link, its path MUST be changed instead.
- **FR-005**: When a name lists links from several layers at once, renaming it MUST apply FR-003 or FR-004 to each, so the old name no longer lists in the user's view.
- **FR-006**: A rename MUST be refused when the parent Spot, in the user's own layer, already links another Spot under the new name. The comparison MUST be exact, so names differing only in case don't clash.
- **FR-007**: A new name MUST be refused when, after trimming leading and trailing spaces, it is empty, `.`, or `..`, or contains `/`. The user MUST NOT be able to confirm such a name.
- **FR-008**: Confirming the current name, or cancelling, MUST change nothing and show no error.
- **FR-009**: The rename action MUST NOT be offered when the user isn't signed in.
- **FR-010**: When a rename is refused for any reason other than FR-008, the user MUST see a message saying why, and the tree MUST be unchanged.

#### Layers

- **FR-011**: A link's uuid MUST never change. Its path and the Spot that holds it are mutable. Moving a link MUST keep its uuid, as renaming does.
- **FR-012**: A mount of a link MUST be a mount edge from the user's Spot at the parent's path to the link's Spot, with the link's uuid and its own path. Its Spot MUST list it as an entry under its path, not merge the target's entries in as a layer mount does. A Spot MUST NOT hold two mounts of the same link.
- **FR-013**: Of the links and mounts with one uuid at a path, a listing MUST show only the one in the highest layer, under its path. The Spot it points to MUST list as it does through the lower layer, its contents and mounts included.
- **FR-014**: A mounted link MUST keep listing after the link it mounts is renamed or removed, after its layer is no longer mounted, and after it is moved, until the user resolves the move (FR-022).

#### Views

- **FR-015**: After a rename, every visible listing of the parent MUST show the new name without a reload.
- **FR-016**: When the renamed Spot is on a path being viewed in any pane, that pane MUST move to the same Spot at its new path.
- **FR-017**: Renames made through the editor's file interface MUST follow FR-003 through FR-007 too.

#### Publishing

- **FR-018**: A renamed own link that was published MUST become pending, and its next publish MUST list it under its uuid with its new path, as 003's FR-008 describes. A link renamed back to its published path before publishing MUST NOT be published again.
- **FR-019**: A published Spot version MUST list a mounted link as a mount entry keyed by the link's uuid, with its path, its target, and its owner when it's outside the user's tree. Layer mounts stay keyed by their target Spot, as 003's FR-008 describes.
- **FR-020**: Publishing a mounted link for the first time MUST publish two Spot versions in order: one listing the link as it is in the lower layer, then one listing its new path. Once published, later renames MUST publish as edits under its uuid.
- **FR-021**: The tree rebuilt from public storage alone MUST give the same names, mounted links, and targets as the local graph.

#### Moved links

- **FR-022**: When the owner of a link the user has mounted moves it to another parent, the user MUST be notified of what was moved, from where, and to where, and the mount MUST be marked in listings until the user resolves it. A user MUST have at most one open notice per mount, naming the link's latest place. A notice MUST be withdrawn if the link moves back to the parent where the mount was made.
- **FR-023**: The user MUST be able to resolve a notice by exactly one of:
  - **Remove**: delete the mount, so the link lists at its new place under its owner's path.
  - **Follow**: move the mount to the user's own Spot at the link's new parent path, creating that Spot and its parents if they don't exist, keeping its uuid and path. FR-006's clash rule applies there.
  - **Keep as own**: replace the mount with a contains link of the user's own, with a new uuid, from the same Spot and under the same path, to a new Spot of the user's that mounts the mount's target. It no longer tracks the moved link. A contains link straight to the other user's Spot would make the user one of its owners.
- **FR-024**: A resolution MUST publish as a removal of the mount's entry for Remove, as the mount's uuid leaving the old Spot's version and joining the new one's for Follow, and as a removal of the mount's entry plus an addition of the new link and its Spot for Keep as own.

### Key Entities

- **Spot**: A place in the tree. It holds other Spots by name, mounts other Spots, and holds a ranked list of Contents. A Spot has no name of its own. Its name is the path of the link that holds it.
- **Link**: A parent Spot's named hold on a child Spot. Its uuid is its identity and never changes, and publishing keys it by that uuid. Its path and the Spot that holds it are mutable.
- **Mounted link**: A mount edge from the user's counterpart of another layer's parent Spot to the Spot that layer's link reaches, carrying that link's uuid and the user's own path. Unlike a layer mount, it lists as one entry. Its layer outranks the other's, so its path wins in the user's view. It is to links what 004's proxy Contents are to Contents.
- **Move notice**: What a user is told when a link they mounted is moved by its owner: the link, its old and new places, and the three ways to resolve it.
- **Layer**: A Spot reached at a path through the user's own tree or through mounts. A listing merges the layers by precedence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can rename a Spot in under 10 seconds, with one menu choice and one confirmation, and without leaving the page, whoever's layer it comes from.
- **SC-002**: After a rename, 100% of a Spot's contents, Contents, and mounts are still reachable from its new path, and none from its old one, in the renaming user's view.
- **SC-003**: Renaming another user's Spot changes that user's tree in 0 places.
- **SC-004**: Every refused rename, other than a no-op, shows a reason. Zero refusals are silent, and zero change the tree.
- **SC-005**: After a rename, every visible pane shows the new name within 2 seconds, without a reload.
- **SC-006**: For every renamed link, the public history shows both the path it had and the path it was given, under one uuid. Publishing one rename of an own link publishes exactly one changed entry, and the tree rebuilt from public storage equals the local one.
- **SC-007**: 100% of moves of a mounted link notify the user who mounted it, and the user can resolve each notice with one choice.

## Assumptions

- “Spot” covers folders and files alike, since a file's tile is named for the Spot that holds its Contents. Renaming a file never changes its type.
- The rename takes place in the current window, in place on the tile, row, or breadcrumb, or in a small prompt. Either satisfies the requirements, and the choice is left to planning.
- Keyboard shortcuts for renaming, such as F2, and touch-only gestures beyond the existing long-press menu are out of scope.
- When one name lists links from several layers, the user means the name they see, so renaming it renames all of them (FR-005).
- A mounted link is made in the user's local graph in one step. The two commits are how it is published (FR-020), so the public history keeps the original path.
- Name clashes are checked only within the user's own parent Spot, as moves already check them. Names from mounted layers merge as they do today.
- Moves already keep a link's uuid, so FR-011 holds today. That is what lets the user who mounted a link be notified when it moves.
- A user is notified of a move once it reaches their graph, whether made in the same graph or received in the owner's published Update. Notices are shown in the app. Email or push delivery is out of scope.
- Renames and removals by the link's owner don't notify. The mount stands, as 004's proxies do. Only a move calls for a decision, because only a move leaves the link reachable somewhere the mount doesn't cover.
- Hiding, moving, or editing another layer's Spots, a changeset view of one user's changes over another's, and merging them back are later features that build on mounted links. This feature covers renaming.
- The editor's file interface keeps its existing rename, which already changes a link's path in place. FR-017 only aligns its rules with the app's.
- Redirects from old paths are out of scope.
- 003's publishing rules and 004's candidate rules are otherwise unchanged.
