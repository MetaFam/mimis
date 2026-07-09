# Feature Specification: Spider & CAR Transfer

**Feature Branch**: `002-spider-car`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Create a `granite` CLI option to \"spider\" a file system, and generate a CAR file with some UI for selecting which files in the spider to include. Also create an option for \"load\"ing the contents of a CAR file containing an update into the database."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Spider a Directory into an Archive (Priority: P1)

A user points the CLI at a directory. The system walks it, presents the discovered files and folders as a navigable tree in the terminal, and lets the user toggle which entries to include. Confirming produces a single archive file containing the selected content expressed as a Granite update — directories become graph nodes, files become leaves with their content and basic metadata preserved.

**Why this priority**: This is the capture side — without a way to turn existing files into Granite content, the graph can only be fed by hand-built trees. It delivers value alone as an archival snapshot even before loading exists.

**Independent Test**: Spider a small directory, deselect one file, confirm; verify the archive exists, contains everything selected and nothing deselected, and that generating it again from unchanged content produces the same content identifiers.

**Acceptance Scenarios**:

1. **Given** a directory with nested folders and files, **When** the user spiders it and confirms the default selection, **Then** an archive file is produced whose tree mirrors the directory structure, with every file's content preserved byte-for-byte.
2. **Given** the selection UI is showing the discovered tree, **When** the user deselects a file or an entire folder, **Then** the produced archive contains no trace of the deselected entries.
3. **Given** identical content spidered twice, **When** the archives are compared, **Then** the content identifiers are identical (dedup-friendly).
4. **Given** a directory containing unreadable entries (permissions), **When** the spider encounters them, **Then** they are shown as unselectable with the reason, and the run continues.

---

### User Story 2 - Load an Archive into the Database (Priority: P2)

A user has an archive file containing a Granite update (from a spider run, a colleague, or another machine). Loading it imports all of its content into the local database so the update is immediately mountable and resolvable — without publishing, registering, or announcing anything.

**Why this priority**: The consumption side — it makes archives portable between machines and lets content enter the system offline. Depends on archives existing (US1).

**Independent Test**: Load an archive produced by US1 on a clean database; mount the contained update and resolve a path to a file inside it; verify byte-identical content.

**Acceptance Scenarios**:

1. **Given** a valid archive containing an update, **When** the user loads it, **Then** the update and every document it references are present in the database, and mounting the update resolves paths to the archived content.
2. **Given** an archive that was already loaded, **When** it is loaded again, **Then** the operation succeeds without duplicating anything (idempotent).
3. **Given** an archive missing some referenced documents (incomplete), **When** the user loads it, **Then** the load fails loudly naming the first missing reference, and nothing partial is silently accepted as complete.
4. **Given** a file that is not a Granite update archive (wrong format or malformed documents), **When** the user attempts to load it, **Then** the load is rejected with the offending content identified.
5. **Given** a loaded update, **When** the user checks the registry or listens for announcements, **Then** nothing was published — loading is local-only.

---

### User Story 3 - Scripted (Non-Interactive) Spidering (Priority: P3)

A user automating captures runs the spider without the interactive UI, supplying include/exclude patterns and accepting the computed selection, so archives can be produced by scripts and scheduled jobs.

**Why this priority**: Automation convenience layered on US1's machinery; no new capability, but unlocks unattended use.

**Independent Test**: Run the spider with an exclude pattern and the no-interaction flag in a script; verify the archive matches the pattern selection exactly and no prompt was shown.

**Acceptance Scenarios**:

1. **Given** include/exclude patterns and the no-interaction flag, **When** the spider runs, **Then** no UI is shown and the archive contains exactly the pattern-matched entries.
2. **Given** patterns that match nothing, **When** the spider runs non-interactively, **Then** it exits with an error rather than producing an empty archive.

---

### Edge Cases

- The user deselects everything in the UI: confirming is disabled/refused — an empty update is never produced silently.
- Symbolic links: not followed (recorded as absent); a symlink cycle therefore cannot hang the spider.
- Hidden files and ignore files: hidden entries and entries matched by standard ignore files in the tree are excluded from the default selection but visible in the UI for opt-in.
- Very large files: included faithfully; the spider reports per-entry sizes in the UI so the user can judge before confirming.
- Interrupting the spider or the load midway: no partial archive is left behind with a valid name; a partially loaded database remains safe because loading is idempotent (re-running completes it).
- An archive containing an update whose chain link (`prev`) is not in the archive and not otherwise retrievable: loading succeeds (the update itself is complete); only operations that need the deeper chain fail later, per the existing partial-snapshot rules.
- File or directory names that are not representable as graph edge names (e.g. containing the path separator — impossible on most filesystems, but possible via crafted archives): rejected loudly, never silently renamed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to point the spider at a directory and have it discover all contained files and directories recursively.
- **FR-002**: The spider MUST present the discovered tree in an interactive terminal UI where entries can be selected and deselected individually or by subtree, showing name, kind, and size.
- **FR-003**: The default selection MUST exclude hidden entries and entries matched by standard ignore files, while keeping them visible for opt-in.
- **FR-004**: Confirming a selection MUST produce a single archive file containing the selected content expressed as a Granite update: directory structure preserved as the graph tree, file content preserved byte-for-byte, with at least name and size retained per file.
- **FR-005**: Identical content MUST yield identical content identifiers across spider runs (deterministic, dedup-friendly).
- **FR-006**: Users MUST be able to run the spider non-interactively with include/exclude patterns; a selection that matches nothing MUST be an error, not an empty archive.
- **FR-007**: Users MUST be able to load an archive into the local database, after which the contained update is mountable and every selected file's content is resolvable.
- **FR-008**: Loading MUST validate the archive: every document reachable from the update must be present and well-formed, or the load fails naming the offending/missing reference.
- **FR-009**: Loading MUST be idempotent — re-loading an archive (or loading overlapping archives) never duplicates or corrupts content.
- **FR-010**: Loading MUST be local-only: no registry write, no announcement, no publication of any kind.
- **FR-011**: Unreadable filesystem entries MUST be surfaced (with reasons) without aborting the spider; symbolic links MUST NOT be followed.
- **FR-012**: Both operations MUST follow the project's error conventions: malformed or unreachable content fails loudly with the offender named; legitimate absence is not an error.

### Key Entities

- **Spider Result**: The discovered filesystem tree — entries with name, kind (file/directory), size, and readability; input to selection.
- **Selection**: The user's chosen subset of the spider result, produced interactively (US1) or from patterns (US3).
- **Archive (CAR)**: A single portable file containing a complete Granite update — the update document, its node tree, and the content of every selected file.
- **File Leaf**: How a file appears in the graph — a node preserving the file's content and basic metadata (name via its edge, size; type where known).
- **Update**: The existing publication unit (feature 001); archives contain exactly one, unpublished.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can spider a directory of 1,000 files, adjust the selection, and produce an archive in under 2 minutes of interaction.
- **SC-002**: 100% of selected files survive the round trip — spider → archive → load on a clean database → resolve — byte-identical.
- **SC-003**: Re-loading an already-loaded archive completes successfully and adds nothing (verifiable by comparing database content before/after).
- **SC-004**: 100% of incomplete or malformed archives are rejected at load time with the offending reference named — none are silently accepted.
- **SC-005**: A scripted spider run with patterns produces the same archive as an interactive run with the equivalent manual selection.
- **SC-006**: The selection UI is operable without documentation: first-time users complete select-and-confirm using only on-screen hints.

## Assumptions

- The archive format is the standard content-addressed archive (CAR) used across the IPFS ecosystem, so archives are portable to and from other tools; this is treated as a given of the ecosystem rather than an implementation choice.
- An archive contains one complete update: the update document plus its whole asserted tree and file content. Chaining to the publisher's previous update happens at generation time when the registry is reachable; otherwise the update is generated chainless and publishing it later is a separate, existing concern (feature 001).
- Loading targets the local database (block store and, when configured, the cache) — publication remains the existing `publish` flow's job.
- File metadata preserved is name, size, and detected type where available; ownership, permissions, and timestamps are out of scope for v1.
- The interactive UI is terminal-based (the `granite` CLI is the only surface); mouse support is not required.
- Spidering follows the constitution's minimalism: no watch mode, no incremental re-spidering, no diffing against previous archives in v1.
