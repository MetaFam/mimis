# Feature Specification: Candidate Contents

**Feature Branch**: `drag-to-move`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "Revise the Spot/Content/Blob model so a Spot holds many candidate files. A Content is one candidate file; a Spot may hold several Contents, including several of the same MIME type. A Content's Blobs are versions of that file: a new Blob links to the one it replaced with PREVIOUS (new → old), and Blob → Blob is the only kind of PREVIOUS. A write to a Content whose current Blob is not yet committed (published) overwrites that Blob in place rather than making a new version. A Spot's Contents are ranked with a linked list (relative links, not numeric order, so inserting does not rewrite every entry); the head of the list is the best Content. MOUNT between Spots keeps its numeric order. A user can reorder another layer's Contents by mounting the base Spot and also mounting the Contents they want to reorder (proxy Contents in their own layer, ordered by their own list); Contents they didn't mount keep their positions unchanged. A directory listing shows only the single best Content of each Spot, optionally with a count of the alternatives, and a separate UI lets a user edit the relative placement of a Spot's Contents. The publish/Update format and tests change to match."

## Clarifications

### Session 2026-11-22

- Q: Is a Content one file, or a ranked list of files of one type? → A: One file. The variety of files at a Spot is a variety of Contents, and MIME types may repeat. A Content's several Blobs are versions of that one file.
- Q: How are a Spot's Contents ranked? → A: By relative links, so inserting doesn't rewrite every entry. The set of entries is fairly static and all of them are at hand while ordering, so a linked list is enough, and it makes rank easy to determine.
- Q: How does one user order another layer's Contents differently? → A: By mounting Contents as well as Spots. They mount the base Spot, then mount the Contents they want to reorder, and order those in their own layer.
- Q: Where do the Contents that user didn't mount go? → A: They keep the positions they already have, unchanged.
- Q: What does `previous` link? → A: Blobs only, from a new Blob to the one it replaced.
- Q: What happens to a write over a Blob that hasn't been published yet? → A: It overwrites that Blob. Only a published Blob is kept as an older version.
- Q: What does a listing show? → A: Only the single best Content of each Spot, in some cases with the number of choices. A separate view edits the relative placement of entries.
- Q: Do mounts between Spots move to relative links too? → A: No. Mounts keep their numeric order.
- Q: Where does a user's own new Content rank among mounted ones, before any reordering? → A: First. The user's own layer has the highest precedence, as in a union mount, so B's own hat B1 over A's A1–A3 lists as B1, A1, A2, A3.
- Q: What does B see when A deletes a Content B has a proxy for? → A: B's proxy keeps showing it, in B's place for it, with its last data. B's curation stands.
- Q: When the Spot already holds a file of a type, does dropping another one replace it or add an alternative? → A: It depends where it's dropped. Dropped on the Spot's tile in the listing above it, the file replaces the best Content of its type with a new version. Dropped anywhere on the Spot's own page, it's a new alternative.
- Q: Where is a Spot's placement of Contents edited? → A: In a table view. The user switches between the current icon view and a table with a row per entry and informational columns. In the table view, Contents are reordered by dragging their rows.
- Q: Can a user hide or reject another layer's Content in their own view? → A: No, only move it, as far down as they like. Hiding and rejecting are out of scope.
- Q: Does this feature show a file's older versions or restore one? → A: Not yet. Versions are recorded and published but not shown. A history view is left to a later feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Several candidate files at one Spot (Priority: P1)

Mïmis is a public file system, so a generic place such as `/image/hat` usually has more than one valid file. A signed-in user adds a second hat, another SVG, to the `hat` Spot as an alternative. The Spot now holds both. The folder view shows the best one, with a mark saying there are two choices.

**Why this priority**: It is the point of the revision. Until a Spot can hold several files of one type, nothing else in this feature means anything.

**Independent Test**: Add two SVG files to one Spot as alternatives, list the folder, and check that it shows only the first with a count of 2. Publish and rebuild the tree from public storage, and check that both Contents come back in the same order.

**Acceptance Scenarios**:

1. **Given** `/image/hat` holds one SVG Content, **When** the user adds another SVG as an alternative, **Then** the Spot holds two Contents of type `image/svg+xml`, the new one ranked last.
2. **Given** `/image/` lists `hat` with two Contents, **When** the user opens `/image/`, **Then** the `hat` tile shows the first Content's file and a count of 2.
3. **Given** `/image/hat` holds three Contents, **When** the user opens `/image/hat`, **Then** the page displays the first Content only.
4. **Given** `/image/hat` holds an SVG and a PNG, **When** the user drops a new `hat.svg` on `/image/`, **Then** the best SVG Content gets a new version and no new Content is made.
5. **Given** `/image/hat` holds only a PNG, **When** the user drops `hat.svg` on `/image/`, **Then** a new SVG Content is ranked last and the PNG is still shown.
6. **Given** `/image/` lists `hat`, holding an SVG, **When** the user drops `drawing.svg` on the `hat` tile, **Then** the best SVG Content of `hat` gets a new version, and no `drawing` Spot is made.
7. **Given** `/image/hat` holds an SVG, **When** the user drops `drawing.svg` anywhere on the `hat` Spot's page, in either view, **Then** the Spot holds two SVG Contents, the new one ranked last.

---

### User Story 2 - A file keeps its versions (Priority: P1)

The user replaces a published `hat.svg` with an edited copy. The Content gets a new Blob that names the old one as the version it replaced, and both stay in the Content, so the file's history can be followed. Saving again before publishing just replaces the unpublished copy, so a burst of saves from an editor doesn't make a version per keystroke.

**Why this priority**: Principle I requires contributions to add to the graph rather than destroy it. Today a replaced file's data is retired, and its history is lost.

**Independent Test**: Publish a file, replace its data twice before publishing again, then publish. Check that the Content has exactly two Blobs, that the newer names the older as its previous, and that a rebuild from public storage gives the same.

**Acceptance Scenarios**:

1. **Given** a Content whose only Blob is published, **When** its data is replaced, **Then** the Content holds two Blobs, the new one names the old one as its previous, and the new one is current.
2. **Given** a Content whose current Blob is unpublished, **When** its data is replaced, **Then** that Blob's data is overwritten and no Blob is added.
3. **Given** a Content whose current Blob holds some data, **When** the same data is written again, **Then** nothing changes.
4. **Given** a Content with three versions, **When** its Spot is listed, **Then** the listing shows the newest version's data.
5. **Given** a published version chain, **When** the tree is rebuilt from public storage, **Then** every version comes back with its previous link, and the same Blob is current.

---

### User Story 3 - Ordering one's own candidates (Priority: P2)

On a Spot's page, the user switches to the table view, which lists every Content the Spot holds in rank order, and drags one row onto another to take its place. The folder view's tile for that Spot then shows the new first Content. Publishing sends only the few entries the move changed.

**Why this priority**: Without a way to rank, the first file added would always be the one shown.

**Independent Test**: Seed a Spot with four Contents, move the third to the top, and check the new order in the listing and the number of changed entries in the published Spot version.

**Acceptance Scenarios**:

1. **Given** a Spot holding A, B, C, and D, **When** the user moves C up one place, **Then** the order is A, C, B, D.
2. **Given** a Spot holding A, B, C, and D in the table view, **When** the user drags D's row onto A's, **Then** the order is D, A, B, C.
3. **Given** a Spot holding A, B, C, and D, all published, **When** the user moves D to the top and publishes, **Then** the Spot's new version lists exactly the entries for D and A. (D now has no predecessor, and A now follows D. D was last, so nothing followed it.)
4. **Given** a Spot holding A, B, C, and D, all published, **When** the user moves B down one place and publishes, **Then** the Spot's new version lists exactly the entries for B, C, and D. (C now follows A, B follows C, and D follows B.)
5. **Given** a Spot holding A and B, **When** the user deletes A, **Then** B is the first Content.
6. **Given** a Content moved to another Spot, **When** the destination is listed, **Then** the moved Content is ranked last there, and the source's remaining Contents keep their order.

---

### User Story 4 - Ordering another layer's candidates (Priority: P3)

User B mounts user A's `/image/` and disagrees with A about which hat is best. On `/image/hat`, B moves A's third hat to the top. B's layer gets its own `hat` Spot holding proxy Contents, each mounting one of A's Contents that the move involved. B sees the new order. A's tree is untouched, and A's Contents that weren't involved keep their places in B's view.

**Why this priority**: It lets several people curate one public space without overwriting each other. It builds on Stories 1 and 3.

**Independent Test**: Seed A's Spot with Contents A1–A5 and B's root mounting A's root. As B, move A4 up one place. Check B's order (A1, A2, A4, A3, A5), check that B's layer holds proxies for exactly A3 and A4, check that A's Spot is unchanged, then publish B's layer and rebuild it.

**Acceptance Scenarios**:

1. **Given** B mounts A's `/image/` where `hat` holds A1–A5, **When** B moves A4 up one place, **Then** B sees A1, A2, A4, A3, A5, and A's own listing still shows A1–A5.
2. **Given** the move above, **When** B's layer is inspected, **Then** B's `hat` Spot holds proxies for A4 and A3, in that order, and nothing else.
3. **Given** B has proxies for A3 and A4, **When** A adds A6, **Then** B sees A1, A2, A4, A3, A5, A6.
4. **Given** B's proxy for A4, **When** A replaces A4's data, **Then** B's proxy shows A4's new data.
5. **Given** B's proxy for A4, **When** A deletes A4, **Then** B still sees A4 in B's place for it, and A no longer sees it.
6. **Given** B's layer with proxies, **When** B publishes and the tree is rebuilt, **Then** the proxies, their order, and their targets come back, and their targets' owner is recorded.

---

### Edge Cases

- A Spot with no Contents lists as a plain folder. A Spot with exactly one Content shows no count.
- Removing the first Content makes the second one first. Removing the last changes no other entry.
- A Content moved into a Spot that already holds one of its type is allowed and is ranked last.
- A published list that is damaged, with two Contents following the same one, a predecessor the Spot doesn't hold, or a loop, is still read in one fixed order (FR-005).
- A proxy whose target no longer appears in any lower layer at that path, because B stopped mounting A or because A deleted the target, stays in B's list in its own place and still shows its target's current data.
- A proxy whose target has no Blob, or whose chain of proxies is longer than 10, is left out of listings.
- B moving a Content that is already B's own, among A's Contents, makes proxies only for A's Contents that the move passes over.
- Two proxies in one Spot never mount the same Content. A second would be refused.
- Names in any script, including Unicode titles, rank and list the same as ASCII ones.
- Contents in a directory of 10,000 Spots are ranked per Spot, so listing cost does not grow with list edits.

## Requirements *(mandatory)*

### Functional Requirements

#### Candidates

- **FR-001**: A Spot MUST be able to hold any number of Contents, including several of the same type. This replaces 003's FR-031 rule of one Content per type at a Spot.
- **FR-002**: A Content MUST have a single type, and every Blob it holds MUST have that type.
- **FR-003**: A Spot's Contents MUST be ranked by relative links: each held Content names the Content it comes after, and the best has none. Adding, removing, or moving one Content MUST change at most three entries: its own, the one that followed it before, and the one that follows it after.
- **FR-004**: A Content added to a Spot, or moved into one, MUST be ranked last.
- **FR-005**: Readers MUST put any list, even a damaged one, in one fixed order. Contents with no predecessor, or with a predecessor the Spot doesn't hold, come first. Several Contents that follow the same one, and several first ones, are ordered by uuid. Contents left over in a loop come last, by uuid.

#### Versions

- **FR-006**: Writing new data to a Content whose current Blob is published MUST add a Blob that names the current one as its previous. The older Blob stays in the Content.
- **FR-007**: Writing new data to a Content whose current Blob is unpublished MUST overwrite that Blob's data, with no new Blob.
- **FR-008**: A Content's current Blob MUST be the one no other Blob in it names as previous. With several such, it MUST be the newest one, the one with the greatest uuid.
- **FR-009**: Writing a Content's current data again MUST change nothing.
- **FR-010**: `previous` MUST link only a Blob to the Blob it replaced. Nothing may read or write a `previous` between Contents.

#### Layers

- **FR-011**: Mounts between Spots MUST keep their numeric order.
- **FR-012**: A proxy Content MUST mount exactly one other Content, have that Content's type, and hold no Blobs of its own. It shows its target's current Blob, following chains of proxies up to 10 deep.
- **FR-013**: A listing MUST merge the layers at a path from the lowest precedence upward. Each layer's list is placed onto the merged list of the layers below it:
  - The places of the Contents its proxies mount are filled by its proxies, in the layer's own order.
  - Its other Contents go just before the next proxy in its list. Those after its last proxy go just after that proxy.
  - A layer with no proxies that mount a lower Content puts its list first, so a user's own Contents outrank mounted ones until they're moved.
  - A Content already in the merged list isn't listed twice.
- **FR-014**: Reordering a list that includes Contents from other layers MUST change only Spots the user owns. It MUST make proxies, in the user's own Spot at that path, for the Contents of other layers the move passes over and for the moved one. It MUST create that Spot and its parents if they don't exist yet, and reuse proxies that already exist. Every other Content MUST keep its place in the user's view.

#### Browsing & editing

- **FR-015**: The folder view MUST show each Spot by its first Content only, with a count of its Contents when it holds more than one. A Spot's own page MUST display its first Content only. Search results MUST use the first Content too.
- **FR-016**: A folder view MUST switch between an icon view of tiles and a table view, and MUST remember the user's choice. The table view MUST list a Spot's entries as rows with their name, type, number of Contents, and size, and MUST list the Spot's own Contents in rank order, each with its rank, type, size, a preview when it can be shown, and whether it belongs to the user's layer or another one. Dragging a Content's row onto another's MUST move it to that place, and each Content MUST also be movable up or down one place without dragging. The listings MUST reflect a move once it's made. When ranking isn't available, for example without a session, the table view MUST still list the Contents in listing order, unmovable.
- **FR-017**: Files dropped anywhere on the page of a Spot that holds Contents and lists no entries MUST become new alternatives, ranked last, whatever Contents of their types the Spot already holds. The table view MUST also let the user choose files to add as alternatives.
- **FR-018**: Except as FR-017 says, adding a file to a Spot MUST add a new version to the Spot's best Content of the file's type, as FR-006 and FR-007 describe, and MUST make a new Content, ranked last, only when the Spot holds none of that type. A file dropped on a Spot's tile in a listing MUST go onto that Spot, whatever the file's name. On a folder's tile or a folder's page, it goes into the folder as before. Folders dropped anywhere nest as before.
- **FR-019**: The editor's file interface MUST name each Spot's files by type, as now. For each type it MUST show the Spot's best Content of that type, and writes MUST version that Content (FR-006, FR-007).
- **FR-020**: Moving a Content to another Spot MUST take it out of the source's list, relinking the Content that followed it, and rank it last at the destination. A destination holding a Content of the same type MUST no longer block a move.
- **FR-021**: Deleting a Content MUST relink the Content that followed it.

#### Publishing

- **FR-022**: A published Spot version MUST record, for each held Content entry, its type and the Content it comes after, instead of a numeric order. Changing a Content's place MUST be published as a replaced entry under the same key.
- **FR-023**: A published Content version MUST record, for each Blob, the Blob it replaced, if any. A proxy's Content version MUST record the Content it mounts, and that Content's owner when it's outside the user's tree.
- **FR-024**: The tree rebuilt from public storage alone MUST give the same order of Contents at every Spot, the same versions, the same current Blob, and the same proxies and targets as the local graph.
- **FR-025**: Existing graphs MUST be migrated: numeric Content orders become lists in the order they list in today, and no Spot or Content is lost. Spots whose entries change in the migration become pending, so their next publish uses the new format.

### Key Entities

- **Spot**: A place in the tree. It holds other Spots by name, mounts other Spots in numeric order, and holds a ranked list of Contents.
- **Content**: One candidate file at a Spot, of a single type. It holds the file's versions as Blobs. It may instead be a proxy, which mounts one other Content and has no Blobs.
- **Blob**: One version of a file's data, identified by its content address and size. A Blob may name the Blob it replaced as its previous.
- **Rank**: A Spot's order of Contents. Each held Content names the one it comes after, and the first names none.
- **Layer**: A Spot reached at a path, through the user's own tree or through mounts. A listing merges the layers by precedence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can make any of a Spot's alternatives the one shown in one drag, without leaving the Spot's page.
- **SC-002**: Moving one Content within a Spot of 1,000 Contents publishes at most 3 changed entries.
- **SC-003**: After another layer's list is reordered, 100% of the Contents the move didn't pass over keep their places, and the other user's tree changes in 0 places.
- **SC-004**: For every Spot of every test tree, the order, versions, current Blobs, and proxies rebuilt from public storage equal the local graph's.
- **SC-005**: Replacing a published file's data 5 times, publishing between each, leaves 6 versions, all reachable from the current one through previous links.
- **SC-006**: Saving a file 20 times between publishes leaves one new version.

## Assumptions

- "Committed" means published: a Blob is committed once an Update including it has been committed (003's FR-012).
- The editor's file interface keeps one file per type per Spot, because its names carry their type's extension. Ranking among same-type Contents is done in the app, not the editor.
- A page is a file's page when its Spot holds Contents and lists no entries. Anything else is a folder's page, even one with Contents of its own, such as an icon.
- A dragged row takes the place of the row it's dropped on. Moving it past the last row is done by dropping it on the last row.
- Older versions are recorded and published, but no view shows or restores them yet.
- A user can't hide or reject another layer's Content, only move it down. Hiding and rejecting are left to a later feature.
- A proxy shows its target's current data and never versions it. Forking another user's file into one's own Content is out of scope.
- Unpublished Blobs that are overwritten were written to IPFS unpinned, so nothing has to clean them up.
- 003's publishing, staging, receiving, and version-chain rules are otherwise unchanged.
