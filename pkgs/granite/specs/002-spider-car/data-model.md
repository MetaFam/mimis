# Data Model: Spider & CAR Transfer

**Date**: 2026-07-09 | **Plan**: [plan.md](./plan.md)

This feature adds **no new document schemas** — archives carry the existing Update/Node/Edge shapes from feature 001. What it adds: one in-memory model (the spider/selection tree), one graph *convention* (the file leaf), and one container (the CAR).

## In-memory: SpiderEntry (never persisted)

The walker produces a tree of entries; the selection model and UI operate on it; nothing of it survives into the DAG except what selection admits.

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Filesystem entry name; becomes the parent's edge name — MUST NOT contain `/` (impossible from a real walk; guarded anyway per spec edge case) |
| `kind` | `file` \| `dir` | Symlinks are recorded as absent (never followed, FR-011) |
| `size` | int | Bytes for files; aggregate for dirs (UI display) |
| `children` | SpiderEntry[] | Directories only |
| `defaultExcluded` | bool | Hidden (dot-prefixed) or matched by an ignore file (FR-003) — deselected by default, visible for opt-in |
| `unreadable` | string? | Reason (e.g. permission denied); shown, unselectable, never aborts the walk (FR-011) |
| `selected` | bool | The selection model's single mutable bit; UI toggles it, patterns compute it — one model for both (SC-005) |

**Selection invariants**: toggling a directory toggles its subtree; confirming with zero selected files is refused; unreadable entries can never be selected.

## Graph convention: the File Leaf

A file appears in the graph as an ordinary Node (existing schema — the codec is unchanged); the convention is in its `data` map:

| `data` key | Type | Rules |
|------------|------|-------|
| `content` | CID link | Root of the file's bytes from Kubo `add` with raw leaves + Rabin chunking — a UnixFS root for multi-chunk files, a bare raw block for single-chunk ones; being a real link, `dag export` traverses into the content |
| `size` | int | Byte length |
| `type` | string (optional) | MIME type where detectable from the extension |

A directory is a Node whose `edges` map its entries by name (no `data` needed). Files have empty `edges`. Deduplication is automatic and fine-grained: identical file bytes ⇒ identical content CID (FR-005), and Rabin's content-defined boundaries mean *partially* changed files still share their unchanged chunks; identical subtrees ⇒ identical Node CIDs.

## Container: the Archive (CARv1)

| Property | Value |
|----------|-------|
| Format | CARv1 as produced by Kubo `dag export` |
| Roots | Exactly one — the Update document's CID |
| Contents | The update's complete closure: Update doc, every tree Node, every UnixFS block of every selected file |
| Update inside | A normal feature-001 Update: `granite: 1`, `publisher` (the spider operator's key), `root`, `prev` (present when the registry was reachable at generation; absent otherwise), `at` |

**Completeness by construction**: `dag export` emits everything reachable from the root, so a well-formed archive cannot omit selected content. **Validation on load** (contracts/archive.md): offline walk from the root — shape-check every document with the existing codec guards, verify every referenced block (including UnixFS closures) is locally present; first failure is named and the load rejected (FR-008, SC-004).

## State transitions

- **Spider**: filesystem → SpiderEntry tree → (selection) → UnixFS imports + Node tree + Update → CAR file. Interruption before the CAR is finalized leaves no valid-named archive behind (write to temp name, rename on completion — spec edge case).
- **Load**: CAR file → blocks imported (hash-verified by Kubo) → offline validation walk → cache `putUpdate`/note (when configured). Idempotent: re-import of present blocks is a no-op by content addressing (FR-009, SC-003). No registry write, no announcement, ever (FR-010).
- A loaded update with an absent-or-unretrievable deeper chain behaves per feature 001's partial-snapshot rules: the update itself is usable; fall-through past the break fails loudly.
