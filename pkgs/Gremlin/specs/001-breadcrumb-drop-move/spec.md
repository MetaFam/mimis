# Feature Specification: Drop-to-Move onto Breadcrumbs

**Feature Branch**: `drag-to-move`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Make it so that when a file is dropped onto one of the items in the breadcrumbs list, it gets moved to that Spot unless that Spot is an ancestor of the Spot being moved."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move an item up the tree by dropping it on a breadcrumb (Priority: P1)

A user browsing deep inside the tree (for example `/media/book/by/Austen/`) wants to move a file or folder somewhere higher up without navigating away. They drag the item from the listing and drop it onto one of the breadcrumbs (for example `book/`). The item now lives in that Spot and disappears from the listing they are looking at.

**Why this priority**: This is the core of the request and the only way to move something to an ancestor Spot without first opening a second pane or navigating. It delivers value on its own.

**Independent Test**: In a Spot at least two levels deep, drag a file onto the root breadcrumb and onto an intermediate breadcrumb; verify each item lands in the chosen Spot and leaves the original one.

**Acceptance Scenarios**:

1. **Given** the user is viewing `/a/b/c/`, which holds the file `x`, **When** they drop `x` onto the `a/` breadcrumb, **Then** `x` is held by `/a/`, is no longer held by `/a/b/c/`, and the current listing no longer shows it.
2. **Given** the user is viewing `/a/b/c/`, which contains the folder `d`, **When** they drop `d` onto the root breadcrumb, **Then** `d` (with everything inside it) is at `/d/` and no longer at `/a/b/c/d/`.
3. **Given** the user is viewing `/a/b/c/`, which holds the full-size image shown as the Spot's sole content, **When** they drop that image onto the `b/` breadcrumb, **Then** the image's content moves to `/a/b/`.
4. **Given** dual panes are open with pane 1 at `/a/b/` and pane 2 at `/q/r/`, **When** the user drops a file from pane 2's listing onto pane 1's `a/` breadcrumb, **Then** the file moves to `/a/` and both panes reflect the change.

---

### User Story 2 - Refuse drops that would put a Spot inside itself (Priority: P2)

Breadcrumbs can themselves be dragged. When the user drags a breadcrumb (a Spot on the current path) onto a breadcrumb further along the path, that target is inside the Spot being moved, so the move would make the Spot contain itself. The breadcrumb signals that it will not accept the drop, and releasing over it changes nothing.

**Why this priority**: Without this guard the tree could be corrupted into a loop. It matters only once breadcrumbs are both drag sources and drop targets, so it builds on Story 1.

**Independent Test**: While viewing `/a/b/c/`, drag the `a/` breadcrumb over the `b/` and `c/` breadcrumbs; verify each shows the "won't accept" indication and that releasing leaves the tree unchanged.

**Acceptance Scenarios**:

1. **Given** the user is viewing `/a/b/c/`, **When** they drag the `a/` breadcrumb over the `c/` breadcrumb, **Then** `c/` indicates it will not accept the drop, and releasing leaves `/a/b/c/` intact.
2. **Given** the user is viewing `/a/b/c/`, **When** they drop the `b/` breadcrumb onto itself, **Then** nothing changes and no error is shown.
3. **Given** the user is viewing `/a/b/c/`, **When** they drop the `c/` breadcrumb onto the root breadcrumb, **Then** `c` moves to `/c/` and the view follows it to `/c/`.

---

### User Story 3 - Understand why a drop didn't work (Priority: P3)

When a drop onto a breadcrumb is refused for a reason other than being a no-op — the destination already has something with that name or of that type, or the user doesn't own one of the Spots involved — the user sees a message saying why, and nothing changes.

**Why this priority**: Moves already have these rules; today a refusal is silent. Explaining it is polish on top of Stories 1 and 2.

**Independent Test**: Create a name clash between a listing item and an ancestor Spot, drop the item on that ancestor's breadcrumb, and verify a message names the clash and the item stays put.

**Acceptance Scenarios**:

1. **Given** `/a/` already contains a folder named `d` and the user is viewing `/a/b/`, which also contains `d`, **When** they drop `/a/b/d` onto the `a/` breadcrumb, **Then** a message explains that the destination already contains “d” and both folders remain where they were.
2. **Given** the user is not signed in, **When** they drop an item onto a breadcrumb, **Then** a message explains the move isn't allowed and nothing changes.

---

### Edge Cases

- Dropping an item onto the breadcrumb of the Spot that already holds it (the current Spot's own crumb, for a listing item) is a no-op: nothing changes and no error is shown.
- The root breadcrumb is a valid drop target but cannot itself be dragged.
- Dropping files from the user's computer (rather than items from the listing) onto a breadcrumb keeps today's behavior of importing them into that Spot.
- Spot and file names containing Unicode or URL-reserved characters move and display correctly.
- If the moved Spot is on the current path (a dragged breadcrumb), the current path no longer exists after the move; the view navigates to the Spot's new location.
- If the destination Spot was removed or changed by someone else between the start of the drag and the drop, the move is refused with a message and nothing changes.
- Leaving a breadcrumb mid-drag, or cancelling the drag, removes any accept/refuse indication from it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every breadcrumb, including the root, MUST accept drops of items dragged from any file listing (folders, files, and a Spot's displayed sole content) and of other breadcrumbs.
- **FR-002**: Dropping an item onto a breadcrumb MUST move that item into the Spot the breadcrumb represents, keeping its name and its contents.
- **FR-003**: Dropping a Spot onto a breadcrumb MUST be refused when the breadcrumb's Spot is the dragged Spot itself or lies inside it.
- **FR-004**: While dragging, a breadcrumb that would refuse the drop under FR-003 MUST look different from one that would accept it, before the user releases.
- **FR-005**: Dropping an item onto the breadcrumb of the Spot that already holds it MUST change nothing and MUST NOT show an error.
- **FR-006**: The existing move rules MUST continue to apply to breadcrumb drops: no duplicate names in the destination, no duplicate content type in the destination, and only Spots the user owns may be moved from or into.
- **FR-007**: When a breadcrumb drop is refused for any reason other than FR-005, the user MUST see a message explaining why, and the tree MUST be unchanged.
- **FR-008**: After a successful move, every visible listing of the origin and destination Spots MUST show the new arrangement without a manual reload.
- **FR-009**: When the moved Spot is on the path currently being viewed, the view MUST navigate to the path where that Spot now lives.
- **FR-010**: Dropping files from outside the application onto a breadcrumb MUST continue to import them into that breadcrumb's Spot.

### Key Entities

- **Spot**: A named location in the tree; it can contain other Spots and hold Content. Each breadcrumb stands for one Spot.
- **Content**: A typed piece of data (a "file") held by a Spot; at most one current Content of each type per Spot.
- **Breadcrumb trail**: The ordered list of Spots from the root down to the Spot being viewed. Every crumb is an ancestor of the Spots and Content in the current listing.
- **Dragged item**: The Spot or Content being moved, together with the Spot it is currently in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can move an item from the current listing to any ancestor Spot with one drag gesture and zero navigations.
- **SC-002**: 100% of drops that would place a Spot inside itself are refused, leaving the tree unchanged.
- **SC-003**: After a successful drop, the item appears in its new Spot and disappears from its old one in every visible pane within 2 seconds, without a reload.
- **SC-004**: Every refused drop, other than a no-op, shows the user a reason; zero refusals are silent.
- **SC-005**: Before releasing, a user can tell whether a breadcrumb will accept a Spot being dragged, for every breadcrumb on the trail.

## Assumptions

- The request's "unless that Spot is an ancestor of the Spot being moved" is read as the loop guard: refuse when the *dragged* Spot is an ancestor of (or the same as) the breadcrumb's Spot. Read literally, every breadcrumb is an ancestor of everything in the current listing, so no drop would ever succeed.
- "File" covers anything draggable in a listing — folders (Spots), files, and a Spot's displayed sole content — as well as breadcrumbs themselves.
- A drop always moves; the copy modifier indication shown during a drag is unchanged, and copying is out of scope.
- Moving requires being signed in and owning both the origin and destination Spots, as moves already do.
- Keyboard-driven moves and touch-only drag gestures are out of scope.
- Moves use the existing move rules and behavior already in the application; this feature extends where a drop can land, not what a move does.
