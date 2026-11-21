# Feature Specification: Publish Write-Layer Updates

**Feature Branch**: `drag-to-move`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "The graph is propagated by creating CBOR-DAG representations of partial graph selections from the write layer in IPFS. After they are included in the update, they are removed from the write layer. An `Update` (device, sequence, `spots` & `contents` Merkle search trees of uuid → cid, previous, signature over device, sequence, spots, contents, & previous, createdAt, comment) contextualizes the segments. Spots added to an Update must be connected into the graph, either from a previous addition or via a connection in this update. The User an Update belongs to is derived from its signature. Each version of a `Spot` lists `contains` (uuid, path, target CID), `mounts` (target UUID, creator only when outside this user's tree, order), & `contents` (uuid, order, type) entries or tombstones, & links its `previous` version. Each version of a `Content` lists `blobs` (uuid, cid, size, type) entries or tombstones & links its `previous` version."

## Clarifications

### Session 2026-11-17

- Q: When a child Spot gets a new version, must its parent be republished so its entry names the new version? → A: No. A Spot keeps the same uuid (and local graph vertex) across versions, so the parent's entry follows the child by uuid; adding `fedora.svg` to `/icon/hat/` gives `hat/` a new version and leaves `icon/` and `/` as they are.
- Q: Does an Update's `spots` tree list every Spot the device has published, or only part of the Update? → A: Only the points where the Update meets the already-published graph. New Spots are reached through their parents' entries. A reader gets the latest Update from the on-chain registry, then looks up the Spot's uuid in that Update's tree and in earlier ones, rebuilding the Spot's state from its versions. The local graph keeps the current state built from these immutable sources, so queries run against it.
- Q: Is importing Updates from other devices or users part of this feature? → A: Only recording them. A received Update from `0xA11…` is stored under `Users` → `User` (`0xA11…`) → its `Device` → `Updates` for possible future reference. Building `0xA11…`'s tree into the browsable graph is not part of this feature.

### Session 2026-11-18

- Q: How does a reader find a user's root Spot? → A: The first Update from a user must include the root Spot, with an entry in that Update's `spots` tree, and the root's version must be clearly marked as the root.
- Q: What does the `uuid` in a `contains` entry identify? → A: The link itself (the `CONTAINS` edge's own uuid), not the contained Spot. A Spot can have several names in the same parent, each removed on its own; a reader learns the child's uuid from the version the entry targets.
- Q: Should `createdAt` and `comment` be signed? → A: No. Both stay unsigned and informational, and the app never presents them as the author's.
- Q: Should a Spot's `contents` entries name a Content version, so new Content needs no `contents` tree entry? → A: No. Entries stay `{uuid, order, type}`, and every Content version an Update publishes, new or not, has an entry in its `contents` tree (FR-022).
- Q: How does the user see and choose what to publish? → A: Through a staging area, like `git`'s. A Spot in the write layer is marked dirty (staged) to be sent in the next publish, and is cleaned once it has been published.

### Session 2026-11-20

- Q: Can one Content hold representations of several types, such as an SVG and a PNG? → A: No. There are separate Contents for separate types. A Spot holding `hat.svg` and `hat.png` holds two Contents, and each representation a Content lists has that Content's type (FR-031).

### Session 2026-11-21

- Q: How is a Spot version too large for one storage block (about 1 MiB) published? → A: As a chain of versions in the same Update, each small enough for one block and each naming the one before it as its previous. The Update's index entry and the parent's entry point at the last one (FR-032).
- Q: Does this feature add rename and remove actions to the app, which today can only move? → A: No. Publishing handles renames and removals however they're made, and the actions themselves come in a later feature, so US3's renames and removals are tested below the UI.
- Q: Is the published state a separate tree from the write layer? → A: No. One tree per user holds both the published state and the pending changes. Each Spot and Content in it records the address of its latest published version, so a later version names that one as its previous (FR-008, FR-009, FR-023). A separate tree merging several devices' Updates comes with the later import feature.
- Q: How is an already-published entry that was edited, such as a renamed link or a mount with a new order, published? → A: The entry is listed again with the same key and its new fields, and replaces the earlier entry with that key. It isn't published as a removal plus an addition (FR-008).
- Q: Can one Spot mount the same target more than once? → A: No. A Spot mounts a given target at most once, so the target Spot is the mount's key, and changing a mount's order replaces its entry (FR-008).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stage and publish changes (Priority: P1)

A signed-in user has added directories and files, which sit in their write layer as unpublished changes. They stage them, all at once or Spot by Spot, much as `git add` stages files. They choose Publish, optionally write a short comment describing the change, and approve the signature request from their wallet. Their changes are stored publicly as a signed Update, they are shown the Update's address, and the published Spots are cleaned: no longer staged and no longer pending. Browsing their tree looks exactly as it did before publishing.

**Why this priority**: Nothing anyone adds is shared until it is published. This is the core of the request and the minimum that makes the graph collaborative.

**Independent Test**: On a device that has never published, add `/icon/hat/top.svg`, stage everything, publish, and verify that the Update's address is shown, that the Update and every Spot and Content version it lists can be fetched from public storage by address alone, that nothing remains pending, and that `/icon/hat/` still lists `top.svg`.

**Acceptance Scenarios**:

1. **Given** a user who has never published, who has added `/icon/hat/top.svg` and staged everything, **When** they publish and sign, **Then** an Update is stored with sequence 1 and no previous Update. It publishes new versions of the Spots for `/`, `icon/`, `hat/`, and `top.svg`'s Spot, and of `top.svg`'s Content. Its `spots` tree has an entry only for `/`, whose version is marked as the root, since the other Spots are reached through their parents' entries, and its `contents` tree has an entry for `top.svg`'s Content. The user is shown its address, and nothing is pending.
2. **Given** scenario 1 has been published, **When** the user adds `fedora.svg` under `/icon/hat/`, stages `hat/`, and publishes, **Then** the new Update has sequence 2, names the first Update as its previous, and publishes a new version of `hat/`, whose previous is `hat/`'s first version and which lists only the entry for `fedora.svg`, plus `fedora.svg`'s new Spot and Content. Its `spots` tree has an entry only for `hat/`, the one place the edit meets the published graph, and its `contents` tree only for `fedora.svg`'s Content. `/` and `icon/` get no new versions.
3. **Given** pending changes, **When** the user publishes with the comment "hats", **Then** the Update carries the comment "hats".
4. **Given** pending changes, **When** the user declines or cancels the signature request, **Then** nothing is stored as an Update, every change is still pending, and the user is told the publish was cancelled.
5. **Given** nothing is staged, **When** the user opens the publish action, **Then** it tells them there is nothing to publish and stores nothing, even if there are unstaged changes.
6. **Given** a publish has completed, **When** the user browses any path in their tree, **Then** they see the same listing they saw before publishing.

---

### User Story 2 - Publish only some of the pending changes (Priority: P2)

The user has pending changes in several places but only wants to share some of them. They stage only those Spots, check what is staged, unstage any they change their minds about, and publish. Anything the staged Spots need to stay connected to the published graph is included automatically and shown to them before they sign. Everything unstaged stays pending for a later Update.

**Why this priority**: The request is explicitly about publishing *partial* selections of the write layer. It builds on Story 1's publishing.

**Independent Test**: With pending changes under both `/a/` and `/b/`, stage only `/a/new/`, publish, and verify that the Update contains just `/a/new/`'s changes plus `/a/`'s new entry for it, and that `/b/`'s changes are still pending and unstaged.

**Acceptance Scenarios**:

1. **Given** published Spots `/a/` and `/b/`, and pending new Spots `/a/one/` holding `x.txt` and `/b/two/` holding `y.txt`, **When** the user stages only `/a/one/` and publishes, **Then** the Update publishes `one/`, `x.txt`'s Spot and Content, and a new version of `a/` adding the entry for `one/`; and `/b/two/` and `y.txt` are still pending.
2. **Given** pending new Spots `/p/q/r/` where none of `p/`, `q/`, or `r/` has been published, **When** the user stages only `/p/q/r/` and publishes, **Then** they are shown that `p/` and `q/` will be included so `r/` is connected, and the Update publishes all three along with `/`'s new entry for `p/`.
3. **Given** a published Spot `/a/` with pending new children `one/` and `two/`, **When** the user stages only `/a/one/` and publishes, **Then** `a/`'s new version lists only the entry for `one/`, and the entry for `two/` stays pending.
4. **Given** the user has staged `/a/one/` and `/b/two/`, **When** they unstage `/b/two/` and publish, **Then** only `/a/one/`'s changes are published, and `/b/two/` is still pending and unstaged.
5. **Given** some Spots are staged, **When** the user looks at what is staged, **Then** they see exactly those Spots, and which pending Spots aren't staged.

---

### User Story 3 - Publish moves and removals (Priority: P2)

The user moves, renames, or removes things that have already been published: they drag a Spot to a new parent, remove one of a file's types, or remove a mount. Publishing records these as removals of the old entries, so readers of the graph see the change and not just additions. Dragging is the only one of these the app offers today. Rename and remove actions come in a later feature, and publishing handles them however they're made.

**Why this priority**: Moving by dragging already exists. Without published removals, every published tree would only ever grow, and moves would show up in two places.

**Independent Test**: Move a published Spot from `/a/` to `/b/`, publish, and verify that `/a/`'s new version removes the entry, that `/b/`'s new version adds it, and that the moved Spot itself has no new version.

**Acceptance Scenarios**:

1. **Given** `/a/s/` is published, **When** the user moves `s/` into `/b/` and publishes, **Then** the Update publishes a new version of `a/` with a removal for the `s` entry and a new version of `b/` with an entry for `s`, and no new version of `s/`.
2. **Given** a published Spot holding an `image/svg+xml` Content and a separate `image/png` Content, **When** the user removes the PNG and publishes, **Then** the Update publishes a new version of that Spot with a removal for the PNG Content, and no Content version.
3. **Given** a published mount on `/a/`, **When** the user removes it and publishes, **Then** `a/`'s new version lists a removal for that mount.
4. **Given** an entry that was added and then removed before ever being published, **When** the user publishes, **Then** neither the entry nor a removal of it appears in the Update.
5. **Given** a published Spot moved from `/a/` to `/b/`, **When** the user stages only `/a/` and publishes, **Then** `b/`'s new entry is included in the same Update, so the moved Spot is never left unconnected.

---

### User Story 4 - Know who published an Update (Priority: P3)

Anyone who has an Update's address can find out which Ethereum account published it, without trusting the device that stored it. Changing any signed part of an Update breaks that link.

**Why this priority**: Attribution is what makes a public graph trustworthy (Constitution Principle I), and the author is derived from the signature alone. It's needed before Updates from others can be accepted, but publishing is useful before then.

**Independent Test**: Publish an Update as account `0xB0B…`, then from its address alone derive the signing account and verify it is `0xB0B…`; change its sequence and verify the derived account no longer matches.

**Acceptance Scenarios**:

1. **Given** an Update published by account `0xB0B…`, **When** anyone derives its author from the Update alone, **Then** the result is `0xB0B…`.
2. **Given** an Update, **When** its device, sequence, `spots`, `contents`, or previous is altered, **Then** the derived author is no longer the account that signed it.
3. **Given** a session signed in as `0xB0B…`, **When** the wallet asked to sign is connected as a different account, **Then** the publish is refused before anything is stored, because the Update would be attributed to someone else.

---

### User Story 5 - Record Updates received from others (Priority: P3)

When an Update published by someone else, such as `0xA11…`, is received, the device checks who signed it and records it under that user and the device it came from. Their tree isn't added to what the user can browse yet, but the Update is kept for future reference.

**Why this priority**: It's the first step toward following other users' graphs and depends on Story 4's author derivation. Nothing is shown to the user yet, so it's least urgent.

**Independent Test**: Receive an Update signed by `0xA11…` from device `D7…`, and verify that it is recorded under `Users` → `User` (`0xA11…`) → `Device` (`D7…`) → `Updates` with its sequence and address, and that no listing changed.

**Acceptance Scenarios**:

1. **Given** no `User` for `0xA11…` exists locally, **When** an Update signed by `0xA11…` from device `D7…` is received, **Then** a `User` for `0xA11…` and a `Device` for `D7…` are created, the Update is recorded under them with its sequence and address, and no listing changes.
2. **Given** that Update is recorded, **When** it is received again, **Then** it isn't recorded a second time.
3. **Given** a recorded Update from `D7…` with sequence 4, **When** `D7…`'s Update with sequence 3 arrives afterward, **Then** it is recorded too.
4. **Given** an Update with a malformed signature, **When** it is received, **Then** it is rejected and nothing is recorded.
5. **Given** this device publishes an Update, **When** the publish completes, **Then** it is recorded under the publishing user's `User` and this `Device` in the same way.

---

### Edge Cases

- A user who has never connected a wallet can't publish; the publish action says a wallet is needed.
- If storing the Update fails partway (for example, the storage node is unreachable), every change stays pending and publishing again is safe; no Update is announced as published unless every part of it can be fetched.
- Staging marks a Spot rather than freezing a copy, so changes made to a staged Spot before the publish starts are sent with it.
- A Spot that is staged and then has all its changes undone has nothing to publish and is cleaned.
- Changes made while a publish is in progress are not lost: they remain pending after it completes.
- Two publishes from the same device at once (for example, from two tabs) never produce two Updates with the same sequence.
- A Spot reachable by more than one path appears in an Update once.
- A copy of a received Update with an altered comment or creation time still has a valid signature. It is treated as the Update already recorded, not as a new one or a conflict.
- A Spot can have two names in the same parent, such as `/icon/hat/` and `/icon/cap/`. Each name is its own entry with its own uuid, so removing `cap` publishes a removal of that entry only, and `hat` stays.
- Mounts are published as entries but are never followed when deciding what staging a Spot brings along, so mount cycles can't make it grow without bound.
- A mount whose target is in the user's own tree records no creator; a mount into another user's tree records that user's account.
- A Spot mounts a given target at most once. Publishing a Spot with two mounts of the same target is refused, naming the Spot.
- Names in any script, including accented and non-Latin characters and emoji, and names containing `/`, are published exactly as they are.
- A new, empty Spot (no children, no Content) can be published.
- A Spot with so many changed entries that one version would exceed a storage block, such as a first publish of a directory of 20,000 files, is published as a chain of versions in the same Update (FR-032).
- An entry edited several times before publishing is published once, in its final state. If it was published before, it's listed with its earlier key and replaces the earlier entry.
- Files' data is already stored when files are added; publishing references it by address and doesn't store it again.
- Order matters: the `order` of mounts and of a Spot's Content is published as it is, so readers see the same order.
- A user's first Update marks the root. A device that starts publishing later, for a user who has already published, doesn't mark another root.
- The first Update from a device has sequence 1 and no previous; each later one has the next sequence and names the device's prior Update as its previous.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A signed-in user with a connected wallet MUST be able to publish everything they have staged as a single Update.
- **FR-002**: The user MUST be able to stage a Spot in the write layer (mark it dirty) for the next publish, unstage it, stage every pending change at once, and see which Spots are staged and which pending Spots aren't.
- **FR-030**: Staging a Spot MUST stage all of that Spot's pending changes, including those of its Content, and MUST bring along every never-published Spot and Content its new entries point at, since an entry can't be published without a version to target. A child that was published before, and has pending changes of its own, MUST NOT be staged unless it is staged itself.
- **FR-003**: A publish MUST automatically include every pending change needed to connect its staged Spots to the published graph, either to a Spot published earlier or to one in the same Update, and MUST show the user what was added before they sign.
- **FR-004**: A publish MUST include both the removal and the new entry of a move whenever it includes either, so that no published Spot is left unconnected.
- **FR-005**: Each Update MUST record the device, a sequence one greater than the device's previous Update (1 for its first), the device's previous Update if there is one, a `spots` index by Spot uuid, a `contents` index by Content uuid, a signature, its creation time, and the user's comment if one was given.
- **FR-006**: The signature MUST cover the device, sequence, both indexes, and previous Update, so that the Update's author can be derived from the Update alone and any change to those parts changes the derived author.
- **FR-007**: The system MUST refuse to publish when the wallet account signing differs from the signed-in account whose changes are being published.
- **FR-008**: Each published Spot version MUST record its uuid, its previous published version if there is one, and only the entries that changed since then: contained Spots (the link's own uuid, name, and target version), mounts (target Spot, creator when outside the user's own tree, and order), and Content (uuid, order, and type), each either added or removed. An entry is keyed by the link's uuid, the mount's target Spot, or the Content's uuid. A Spot mounts a given target at most once. An edited entry, such as a renamed link or a mount with a new order, is listed again with the same key and replaces the earlier one.
- **FR-009**: Each published Content version MUST record its uuid, its previous published version if there is one, and only the representations that changed since then (uuid, data address, size, and type), each either added or removed.
- **FR-031**: A Content MUST have a single type, and different types MUST be separate Contents. A Spot holds at most one Content of a given type, and every representation a Content lists has that Content's type. Replacing a file's data with data of the same type MUST keep its Content and publish a new version of it, removing the old representation and adding the new one.
- **FR-032**: Every published document MUST fit in one storage block of at most 1 MiB. When a Spot's or Content's changed entries don't fit in one version, they MUST be split across a chain of versions in the same Update, each naming the one before it as its previous. Only the last version of the chain gets an index entry (FR-021, FR-022) or is targeted by a parent's entry, and readers fold the chain like any other versions.
- **FR-010**: Entries that were added and removed again since the last publish MUST NOT appear in the Update.
- **FR-011**: A Spot or Content with no changes included in the Update MUST NOT get a new version. Its changes are included when it is staged, or when a staged Spot needs them to stay connected (FR-003, FR-004). A contained-Spot entry MUST follow the child by the child's uuid, which stays the same across versions and is read from the entry's target version. That target version records the child's version when the entry was written, so a new version of the child doesn't require a new version of its parent.
- **FR-012**: After the Update and everything it lists are stored and retrievable, the published changes MUST be removed from the write layer, which means marked as published and no longer pending, not deleted (FR-013). The published Spots MUST be cleaned (no longer staged), and the user MUST be shown the Update's address.
- **FR-013**: Publishing MUST NOT change what the user sees when browsing: every listing MUST be the same before and after publishing.
- **FR-014**: If a publish is cancelled or fails at any point before FR-012, every pending change MUST remain pending, every staged Spot MUST remain staged, and no Update MUST be recorded as the device's latest.
- **FR-015**: Changes the user makes while a publish is in progress MUST remain pending afterward.
- **FR-016**: Publishes from the same device MUST be serialized so that sequence numbers are never reused.
- **FR-017**: The published Update, and every Spot and Content version it lists, MUST be retrievable by address from the user's storage node after the publish completes.
- **FR-018**: Starting only from a device's latest Update address, the user's published tree MUST be reconstructable without the local graph, by following previous Updates and previous versions as far back as needed, and MUST match what the user browses.
- **FR-021**: An Update's `spots` index MUST have an entry for the newest version in this Update of each Spot that was published before, which is where the Update meets the already-published graph. Spots published for the first time MUST be reachable through the target versions of the entries that contain them, and MUST NOT need an index entry.
- **FR-028**: A user's first Update MUST include the root Spot's first version, marked as the root, so a reader can identify the root from that Update alone. Its `spots` index entry names that version or, when the version is split into a chain (FR-032), the chain's last link, from which the first is reached by following previous. No other Spot version, in any of the user's Updates from any device, MUST be marked as a root.
- **FR-022**: An Update's `contents` index MUST have an entry for every Content it publishes a version of, pointing at the newest, since a Spot's Content entries name the Content by uuid alone.
- **FR-023**: The local graph MUST keep one tree per user holding both the published state and the pending changes, recording for each Spot and Content the address of its latest published version and which of its entries are published. Browsing and search query this tree directly instead of reconstructing versions from public storage, and a Spot's or Content's next version names its recorded latest version as its previous.
- **FR-019**: When nothing is staged, the publish action MUST say there is nothing to publish and store nothing.
- **FR-020**: Anyone with an Update's address MUST be able to derive the Ethereum account that signed it.
- **FR-024**: Given a received Update's address, the system MUST derive its author and record the Update, with its sequence and address, under that author's `User` and the Update's `Device` in the local graph, creating the `User` and `Device` if they don't exist yet.
- **FR-025**: Recording a received Update MUST NOT add its Spots or Content to the browsable graph or change any listing.
- **FR-026**: An Update MUST be recorded only once, however many times it is received. Copies that differ only in creation time or comment are the same Update; the first one received is kept. An Update whose signature is malformed, or that is missing a signed field, MUST be rejected and not recorded.
- **FR-029**: Wherever the app shows an Update's creation time or comment, it MUST NOT present them as verified or as written by the Update's author.
- **FR-027**: Each Update this device publishes MUST be recorded the same way, under the publishing `User` and this `Device`.

### Key Entities

- **Write layer**: The signed-in user's unpublished changes: Spots, Content, and entries added, changed, or removed since they were last published. They live in the same tree as the published state (FR-023), marked as not yet published.
- **Staged Spot**: A Spot in the write layer marked dirty, so its pending changes go into the next publish; it is cleaned once they are published. The staged Spots are the staging area.
- **Update**: One signed publish from one device. It carries the device, its sequence among that device's Updates, its previous Update, indexes of the Spot and Content versions it publishes, a signature, a creation time, and an optional comment. Its author is the account that produced the signature.
- **Device**: One installation a user publishes from, identified by a uuid within that user. Its Updates form a chain through their previous links, and the ones known locally are recorded under it.
- **Received Update**: An Update from another device or user, recorded under its derived author and device for future reference.
- **Spot version**: One published state of a Spot, linked to its previous version, marked as the root if it is the user's root's first version, listing changed entries for contained Spots (keyed by the link's uuid), mounts (keyed by the target Spot), and Content (keyed by the Content's uuid), each as an addition, a replacement, or a removal.
- **Content version**: One published state of a Content, which has a single type, linked to its previous version, listing changed representations (data address, size, and type), each as an addition or a removal.
- **Published graph**: The published part of the user's tree: the Spots, Content, and entries recorded as published, each Spot and Content with the address of its latest published version. Browsing and search query the whole tree, published and pending, instead of the version history.
- **Removal**: An entry that records that a previously published entry no longer exists: a contained-Spot link by the link's uuid, a mount by its target Spot, or a Content by the Content's uuid.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can stage and publish all their pending changes with at most three actions plus the wallet's signature approval.
- **SC-002**: Publishing 1,000 pending Spots and Content takes under 30 seconds, not counting the time spent waiting for the user to sign.
- **SC-003**: For a known test tree, 100% of listings are identical before and after publishing it.
- **SC-004**: An Update changing one file in a tree of 10,000 published Spots publishes one Content version and no Spot versions, and its `spots` index is empty.
- **SC-005**: For 100% of published Updates, the author derived from the Update is the account that published it; for 100% of Updates altered in a signed part, it isn't.
- **SC-006**: A cancelled or failed publish leaves 100% of pending changes pending.
- **SC-007**: For a known test tree published across five Updates, mixing additions, moves, and removals, a tree rebuilt only from the latest Update's address matches the browsed tree exactly.

## Assumptions

- The document formats, field names, and Merkle search tree indexes are as given in the request; their encoding is a planning concern. Each Update and each version is content-addressed, so its address is fixed by what it contains.
- A mount removal names the mount's target Spot, and a Content removal names the Content's uuid.
- Creation time and comment are not covered by the signature (FR-029): anyone can store a copy with a different comment or time and the same valid signature, at a different address.
- Signing uses the wallet the user is signed in with, as the existing export already does. Delegated device keys are out of scope.
- The device identity is the existing per-user Device uuid, created once and reused for every publish from that device.
- The published Update is kept on the user's own storage node (pinned).
- Readers find a device's latest Update by looking it up in the on-chain registry of account → device → latest Update. Writing to that registry, and announcing Updates to peers, is out of scope here; until then a device's latest Update is known by its address.
- How the root is marked is a planning concern. A user's other devices use the root from the user's first Update rather than starting their own, and find that Update the way any reader does.
- Rebuilding a Spot's state from public storage may mean walking far back through Updates and versions. That cost is accepted, because the local graph (FR-023) is what gets queried.
- A user who has never connected a wallet keeps their changes pending until they do; reassigning those changes on first connection is out of scope.
- How Updates arrive (peer announcements, the on-chain registry, or someone pasting an address) is out of scope; this feature handles an Update once its address is known.
- Updates are recorded as they arrive, in any order. Two Updates with the same device and sequence that differ in a signed part are both recorded; resolving that conflict is left to the later import feature.
- This feature replaces the existing whole-tree export, which signs only a root address.
- Staging is by Spot, not by individual entry; staging only some of a Spot's changes is out of scope.
- New editing actions are out of scope: the app's only way to change a published entry today is moving it by dragging. Renaming, removing a name, a Content, or a mount, and removing a Spot entirely come in a later feature. Publishing records any of them that are made.
