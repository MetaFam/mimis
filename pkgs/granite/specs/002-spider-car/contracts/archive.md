# Contract: Archive Contents & Load Validation

## Archive (CARv1)

Produced by Kubo `dag export <updateCid>`; consumed by `dag import`.

| Rule | Detail |
|------|--------|
| Roots | Exactly one, and it MUST decode as a feature-001 Update document |
| Closure | Every block reachable from the root is present: tree Nodes (dag-cbor) and file content (UnixFS) — `data.content` is a real CID link, so the export traverses it |
| Update | Normal shape: `granite: 1`, `publisher`, `root`, optional `prev`, `at`; `prev`'s *target* need not be in the archive (partial-snapshot rules apply after load) |
| Determinism | Same selection of same bytes ⇒ same root CID (FR-005); archives are therefore comparable and dedupe on load |

## File-leaf convention (inside the tree)

- Directory ⇒ Node with `edges` keyed by entry name.
- File ⇒ Node with empty `edges` and `data`: `{ content: <content root CID>, size: <int>, type?: <mime> }`, where the content root comes from Kubo `add` with **raw leaves + Rabin chunking** (UnixFS root when multi-chunk, bare raw block when single-chunk).
- The codec is unchanged — these are ordinary Nodes; `granite resolve` returns them like any node, and file bytes are fetched by `content` CID (Kubo `cat`).

## Load validation (in order, all offline)

1. `dag import` the CAR (Kubo hash-verifies every block).
2. The CAR MUST have exactly one root ⇒ else reject.
3. Fetch the root **offline**; it MUST validate as an Update via the existing codec guards ⇒ else `MalformedDocumentError` (offender named).
4. Walk the tree from `update.root` offline: every Node validates, every `edges[*].child` and CID `mounts[*].source` recurses, every `data.content` UnixFS closure is locally complete (`refs -r`, offline). First missing block ⇒ `UnreachableNodeError` naming the CID; first malformed document ⇒ `MalformedDocumentError`.
5. Only after the walk succeeds: report loaded; note in the cache (`putUpdate` + node structure as walked) when configured.

Failures leave imported blocks in place (harmless, content-addressed, idempotent to retry) but report nothing as loaded — "partial" is never presented as success (spec edge case; FR-008, FR-009, SC-003, SC-004).

## Explicitly out of contract

- No registry write, no announcement, no pin-by-default beyond what `dag import` implies (FR-010).
- No archive-level signing (the Update inside carries `publisher`; transport authenticity is out of scope for v1, matching feature 001's announcements-vs-content trust split).
