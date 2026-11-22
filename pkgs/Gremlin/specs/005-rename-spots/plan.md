# Implementation Plan: Rename Spots

**Branch**: `master` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-rename-spots/spec.md`

## Summary

Users rename any Spot they see, from a tile, a table row, or a breadcrumb.

- **Own links**: a rename of the user's own `CONTAINS` changes its `path` in place, keeping its uuid, so 003's publishing republishes it under its key.
- **Other layers' links**: a rename of another layer's link mounts that edge. The user's Spot at the parent's path gets `MOUNT{uuid, path, base}` to the same target, carrying the other link's uuid (research.md R1). Listings show, for each uuid at a path, only the edge from the highest-precedence layer. That requires resolving paths one segment at a time, with precedence compared in JavaScript (R2, R3).
- **First publish**: a mounted link publishes as two versions of its Spot in one Update. The prelude names it by its `base`, and the version by its new `path` (R6).
- **Moved links**: when a mounted link's owner moves it, the user sees a derived notice. It's found by the target's incoming `CONTAINS` with the same uuid, so no index or stored state is needed (R7). The user resolves it with Remove, Follow, or Keep as own (R8, R9).

## Technical Context

**Language/Version**: TypeScript 6, Svelte 5 (runes, experimental async), Node 24

**Primary Dependencies**: SvelteKit 3 remote functions with Valibot, gremlin-javascript 3.7.3, `@ipld/dag-cbor`, and `multiformats`. There are no new dependencies.

**Storage**: JanusGraph, with new edges only: path-bearing `MOUNT`s. There's no schema change, migration, or index. Kubo stores the published blocks, as in 003.

**Testing**: Vitest 4. The server project runs rolled-back `g().tx()` against the local JanusGraph with `memoryBlocks()` and real signing keys. The client project (Playwright Chromium) runs the components.

**Target Platform**: Evergreen browsers. The SvelteKit server runs on Cloudflare and on Node in development.

**Project Type**: Web application (a single SvelteKit app)

**Performance Goals**:

- A rename finishes and every visible pane shows it within 2 s (SC-005).
- A listing at depth *d* costs *d* + 1 traversals instead of 1 (R2). At depth 10 on a local socket, the target is under 150 ms.

**Constraints**:

- Renaming another user's Spot writes nothing in their tree (SC-003). `ownersOf()` must never come to include the renamer (R9).
- Existing trees without link mounts list exactly as before, with the same keys and order. The existing listing tests are the guard.
- GET handlers can't call commands, so `notices` is a `query` (raw traversals).
- Requests must stay under 64 KiB. The per-segment traversals are small.

**Scale/Scope**:

- Directories of up to 10,000 children, and up to 10 mount layers.
- New code:
  - 3 modules: `names.ts`, `relocations.svelte.ts`, and `server/renames.ts`;
  - 5 remotes: `renameSpot`, `notices`, `removeMount`, `followMount`, and `keepMount`;
  - 2 components: `RenameDialog` and `NoticesDialog`.
- Edits:
  - `listing.ts`, `edits.ts`, `changes.ts`, `selection.ts`, `publish.ts`, `rebuild.ts`, `fsEntries.ts`, `search.ts`, and `ranking.ts`;
  - `FileBrowser`, `Breadcrumbs`, `FileView`, and `+page.svelte`;
  - `listing.remote.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-design | Post-design |
| --- | --- | --- | --- |
| I. Public Collaboration | Public, attributable, append-only; others' trees layered, never overwritten | ✅ Others' links are renamed by mounting them in one's own layer | ✅ Nothing writes into another user's tree (SC-003, tested by snapshot). Notices are derived from S's graph without writing into B's (R7). Keep as own avoids a cross-tree `CONTAINS` that would grant ownership (R9). Removals publish as tombstones via `retire()`. The prelude keeps the original name in public history (R6). |
| II. Succinct Code | Smallest correct expression; reuse; throw on unexpected shapes | ✅ | ✅ One `renameSpot` serves the app and the editor (R5). It reuses `spotAt`, `retire`, `relink`, 003's fingerprints, and `rebuild.fold`'s replace-by-key, and readers need no new rule (R10). Notices need no storage or index (R7). The cost is `resolveSpots()` replacing a composed traversal (Complexity Tracking). Unexpected shapes throw: two link mounts of one uuid in one Spot, and a link `MOUNT` with an `order`. |
| III. Thorough Tests | Tests first; edge cases; every error; real JanusGraph in a rolled-back tx; real encodings | ✅ Planned | ✅ quickstart.md maps every story, FR, and error to a test. The edge cases covered are Unicode and reserved characters, case-only renames, merged names, three layers with inverted precedence, moves back and forth, unreachable moves, clashes on Follow, and rebuild equality. All are rolled back, and none commits. |
| IV. Minimal Comments | Only a non-obvious *why* | ✅ | ✅ Expected comments: why path resolution is per segment (precedence comparison), why a link `MOUNT` counts as a segment in `precedence()`, why Keep makes a Spot instead of a direct `CONTAINS`, and why the prelude reads `base` and not the lower link |
| Tech: remote functions | `query` for reads, `command` for writes, Valibot input | ✅ | ✅ `notices` and `listing` are `query`s. The four writes are `command`s, with `validName` via `v.check`. |
| Tech: identity | EIP-712 signing | ✅ | ✅ Unchanged. One signature covers prelude and version. |
| Workflow gate | lint, check, and test pass before merge | ✅ | ✅ quickstart.md, “Automated” |

There are no unjustified violations. Complexity Tracking lists one judgment call.

## Project Structure

### Documentation (this feature)

```text
specs/005-rename-spots/
├── plan.md              # This file
├── research.md          # Phase 0: R1–R12
├── data-model.md        # Phase 1: link MOUNT, mount states, Notice, Fields
├── quickstart.md        # Phase 1: validation
├── contracts/
│   ├── documents.md     # mounts entries for links, the prelude
│   ├── remotes.md       # commands, queries, server modules, errors
│   └── ui.md            # RenameDialog, NoticesDialog, menus, breadcrumbs
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/lib/
├── names.ts                        # NEW: validName()
├── names.test.ts                   # NEW
├── relocations.svelte.ts           # NEW: relocate(), follow(), latest
├── relocations.test.ts             # NEW
├── server/
│   ├── listing.ts                  # EDIT: resolveSpots(), listingAt(), link MOUNTs as entries, shadowing, moved
│   ├── listing.test.ts             # EDIT
│   ├── renames.ts                  # NEW: renameSpot, noticesFor, removeMount, followMount, keepMount, viewPathOf
│   ├── renames.test.ts             # NEW
│   ├── edits.ts                    # EDIT: retire() keys link MOUNTs by uuid; unlinkSpot() takes link MOUNTs
│   ├── edits.test.ts               # EDIT
│   ├── changes.ts                  # EDIT: link MOUNT Fields, key, fingerprint, duplicate check
│   ├── changes.test.ts             # EDIT
│   ├── selection.ts                # EDIT: pair link MOUNT moves
│   ├── selection.test.ts           # EDIT
│   ├── publish.ts                  # EDIT: link entries, prelude version
│   ├── publish.test.ts             # EDIT
│   ├── rebuild.ts                  # EDIT: Tree.linked
│   ├── rebuild.test.ts             # EDIT
│   ├── fsEntries.ts                # EDIT: resolveSpots, shared children, renameEntry → renameSpot
│   ├── fsEntries.test.ts           # EDIT
│   ├── search.ts                   # EDIT: startOf via resolveSpots; descend link MOUNTs
│   ├── search.test.ts              # EDIT
│   ├── ranking.ts                  # EDIT: layersAt via listingAt
│   ├── moves.test.ts               # EDIT: uuid kept
│   └── testing.ts                  # EDIT: mountLink() seed helper
├── remotes/
│   ├── listing.remote.ts           # EDIT: listingAt
│   ├── renameSpot.remote.ts        # NEW: command
│   ├── notices.remote.ts           # NEW: query
│   └── resolveMount.remote.ts      # NEW: removeMount, followMount, keepMount commands
└── components/
    ├── RenameDialog.svelte         # NEW
    ├── RenameDialog.svelte.test.ts # NEW
    ├── NoticesDialog.svelte        # NEW
    ├── NoticesDialog.svelte.test.ts # NEW
    ├── FileBrowser.svelte          # EDIT: Rename… & Resolve move… menu items, moved badge
    ├── FileBrowser.svelte.test.ts  # EDIT
    ├── Breadcrumbs.svelte          # EDIT: ✎ rename per crumb
    └── FileView.svelte             # EDIT: follow relocations
src/routes/[...path]/
└── +page.svelte                    # EDIT: Moved links (n) action, NoticesDialog
```

**Structure Decision**: This stays the existing single SvelteKit app.

- **Graph code** is in `src/lib/server/`, as functions taking a `source`, so tests pass a transaction. Every error the remotes surface comes from these functions.
- **Shared code**: `names.ts` is in `src/lib/` because the dialog and the server validate alike.
- **Remotes** stay thin wrappers that resolve the address and open `inTransaction()`.

## Complexity Tracking

| Judgment call | Why | Simpler alternative rejected because |
| --- | --- | --- |
| `resolveSpots()` resolves a path one segment at a time in JavaScript, replacing the single composed `resolvePath()` traversal, at *d* + 1 round trips per listing | FR-013's "highest layer wins" needs precedence keys compared lexicographically, which Gremlin can't do mid-traversal (R2) | "A mount always shadows what it mounts" is one traversal, but it shows the wrong name when two layers mount a link, or when the owner's layer outranks the mounter's. Resolving every branch unfiltered grows with every mount along the path. |
