# Implementation Plan: Publish Write-Layer Updates

**Branch**: `drag-to-move` | **Date**: 2026-11-18, updated 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-publish-updates/spec.md`

**Update (2026-11-21)**: This revision brings in the spec's clarifications of 2026-11-20 (one type per Content) and 2026-11-21:

- version chains for large versions (FR-032);
- no new rename or remove actions;
- one tree for published and pending state (FR-023);
- edited entries replaced under their key;
- one mount per target.

It also fixes the `/speckit-analyze` findings: C1, C2, I2, I6, U1, U2, L1, L2, and L3. The new decisions are research.md R18–R22.

## Summary

A signed-in user stages Spots from their pending changes and publishes them as one signed `Update`: DAG-CBOR Spot and Content versions listing only changed entries and tombstones, indexed by two Merkle search trees, and signed with EIP-712 by their wallet.

- **Tracking**: One tree per user holds both the published state and the pending changes (FR-023, research.md R2).
  - Each published Spot and Content records its latest version's `cid`, which its next version names as `previous`.
  - Each entry edge gets a `published` fingerprint. An edited published entry is republished under the same key.
  - A removed published entry becomes a `REMOVED` marker edge, which no existing traversal follows.
  - “Pending” is derived from these marks, so browsing never changes.
- **Publishing**: three steps (R1):
  - `preparePublish` (server) selects what to send, closing the staged set under the bring-along, connection, and move-pairing rules (R3). It encodes the versions, splitting any over 1 MiB into a chain (R18), and writes them to Kubo unpinned, without changing anything pending.
  - The browser has the wallet sign the typed data (R6).
  - `commitPublish` (server) verifies the seal and the signer, then stores and pins the Update (R7). In one transaction guarded by the device's sequence, it applies the plan and records the Update (R9, R10).
- **Receiving**: Updates from other users are verified and recorded under their `User` → `Device` → `Updates` (R10).
- **Replaced and fixed**: the whole-tree export is removed (R12), and `addFiles` stops piling up same-type Contents (R11). Every thrown error is raised below the remotes, so it can be tested (R20).

## Technical Context

**Language/Version**: TypeScript 6, Svelte 5 (runes, experimental async), Node 24

**Primary Dependencies**:

- SvelteKit 3 with remote functions, and Valibot
- gremlin-javascript 3.7.3, using sessions via `g().tx()`
- `@ipld/dag-cbor` 9.2.5 and `multiformats` 13
- `kubo-rpc-client` 6.0.2, for `block.put`, `pin.add`, `pin.update`, and `pin.rm`
- viem 2.45, for `recoverTypedDataAddress` and `hashTypedData`
- `@wagmi/core` 3, for `signTypedData` and `getConnection`
- New dev dependency: `@atproto/repo`, only to cross-check MST roots in tests
- Removed: `ipfs-car`

**Storage**:

- **JanusGraph** (BerkeleyDB JE): structure and publish marks. A write conflict between transactions fails one commit, which the R9 probe confirmed.
- **Kubo** 0.43: the published blocks, pinned recursively from the newest Update. It accepts blocks up to 2 MiB (the R18 probe), and this feature caps them at 1 MiB (FR-032).

**Testing**: Vitest 4.

- **Server project** (Node): traversals run against the local JanusGraph in rolled-back `g().tx()`, and encoding and signing use real DAG-CBOR, real sha2-256, and real secp256k1 keys. Block storage is in memory, and the Kubo adapter is tested against the local Kubo (R21). The one committing test is listed under Complexity Tracking.
- **Client project** (Playwright Chromium): the components.

**Target Platform**: Evergreen browsers with an EIP-712-capable wallet. The SvelteKit server runs on Cloudflare (adapter-cloudflare) and on Node in development.

**Project Type**: Web application (a single SvelteKit app)

**Performance Goals**:

- 1,000 pending Spots and Contents in total, published in under 30 s, excluding the signature wait (SC-002). The design estimate is under 5 s: a fixed number of traversals, `block.put` 16 at a time, one `pin.update`, and writes batched 500 per traversal.
- Changing one file in a tree of 10,000 Spots publishes exactly one Content version (SC-004).

**Constraints**:

- GET handlers can't call commands, so `pending` is a `query`.
- Prepare must not change anything pending (FR-014). The one graph write near it is clearing stale `staged` flags when nothing is publishable (R19).
- Changes made during a publish must survive it (FR-015).
- Sequences must stay unique across tabs and server instances (FR-016).
- Nothing is stored when the wallet account doesn't match the session (FR-007).
- Listings are byte-identical before and after a publish (FR-013).
- The migration (research.md R11, R14) must run on each graph before this code is deployed to it, since `assertOwned` now reads `INCLUDES.author`. It also makes `sequence` a `LOCK`-consistency key (R9), without which two publishes can both commit one sequence.
- Every block is at most 1,048,576 bytes (FR-032). About 9,370 short-named `contains` entries fit in one version (R18).

**Scale/Scope**:

- Trees of up to 10,000 Spots, directories of 10,000 or more children, and Updates of up to 1,000 versions.
- New code:
  - 5 remotes;
  - 11 modules: 2 shared (`updates`, `mst`) and 9 server (`blocks`, `edits`, `changes`, `selection`, `staging`, `publish`, `received`, `rebuild`, `backfill`);
  - 1 component;
  - 1 one-off script.
- Edits:
  - `moves.ts`, `listing.ts`, `janusgraph.ts`, `auth.ts`, and `testing.ts`;
  - `addFiles.remote.ts` and `representations.remote.ts`;
  - `ipfs.ts`;
  - `+page.svelte`;
  - the tests `listing.test.ts`, `search.test.ts`, and `page.svelte.test.ts`.
- Deletions: `janus2DAG.ts` and `nodeInfo.remote.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-design | Post-design |
| --- | --- | --- | --- |
| I. Public Collaboration | Public, content-addressed, attributable, append-only; no private data; no trusted server | ✅ Every Update is signed and content-addressed, and versions link `previous` | ✅ The author comes from the signature alone (R6), and removals are tombstones, not deletions. Each version chains to the previous one (R2, R18). Nothing private is published: the comment is the user's own, and vertex ids stay in the sealed plan, which never reaches IPFS. Readers need only IPFS (contracts/documents.md, “Reading”). |
| II. Succinct Code | Smallest correct expression; reuse; no dead code; throw on unexpected shapes | ✅ Replaces the old export and its `nodeInfo` remote | ✅ Reuses the HMAC from `auth.ts`, `assertOwned`'s walk, `base()`'s merges, the existing typed-data signing, and the `source`-injection pattern. One `retire()` replaces the drops. Pending is derived rather than maintained by each write path. Version chains reuse `previous` instead of a second encoding (R18). Unread `Update` properties are dropped (`receivedAt`, `previous`). Unexpected shapes throw (data-model.md, “Validation rules”). The MST is about 80 lines instead of a large runtime dependency (R5). |
| III. Thorough Tests | Tests first; edge cases; every error; real JanusGraph in a rolled-back tx; real encodings | ✅ Planned | ✅ quickstart.md maps every user story, FR, and SC to a test file, and research.md R20 maps every thrown error to a server function and its test. The MST is checked against atproto vectors and a second implementation. Signatures come from real keys, and the Kubo adapter runs against a real Kubo (R21). One test, FR-016's, must commit, so it's justified under Complexity Tracking and cleans up after itself. |
| IV. Minimal Comments | Only a non-obvious *why* | ✅ | ✅ Expected comments: why `REMOVED` is a label rather than a flag, why `CONTAINS` fingerprints omit `target`, why the domain has no `chainId`, why commit retires vanished edges, why a failed commit means another publish won, and why the cap is 1 MiB when Kubo allows 2 |
| Tech: remote functions | `query` for reads, `command` for writes, Valibot input | ✅ | ✅ `pending` is a `query`; `stage`, `preparePublish`, `commitPublish`, and `receiveUpdate` are `command`s with bounded schemas |
| Tech: identity | EIP-712 signing | ✅ | ✅ R6 |
| Workflow gate | lint, check, and test pass before merge | ✅ | ✅ quickstart.md, “Automated” |

There are no unjustified violations. Complexity Tracking lists the one exception to a MUST and one judgment call.

## Project Structure

### Documentation (this feature)

```text
specs/003-publish-updates/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R22, probes, rejected alternatives
├── data-model.md        # Phase 1: graph additions, fingerprints, states, version chains, published documents
├── quickstart.md        # Phase 1: validation scenarios
├── contracts/
│   ├── documents.md     # The public IPFS document formats & signed typed data
│   ├── remotes.md       # Remotes, server modules & their errors
│   └── ui.md            # Menu & PublishDialog
├── checklists/
│   ├── requirements.md  # Spec quality
│   └── publishing.md    # Requirements quality for publishing
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── updates.ts                  # NEW: document types, encodeSpot/encodeContent (with chains)/encodeUpdate, typedDataFor, validateUpdate, authorOf, digestOf
│   ├── updates.test.ts             # NEW
│   ├── mst.ts                      # NEW: build() & get() for atproto v3 MSTs
│   ├── mst.test.ts                 # NEW
│   ├── fixtures/mst/               # NEW: vendored key_heights.json & example_keys.txt
│   ├── ipfs.ts                     # EDIT: remove blocksToCAR
│   ├── janus2DAG.ts                # DELETE
│   ├── server/
│   │   ├── auth.ts                 # EDIT: export seal/unseal
│   │   ├── auth.test.ts            # NEW
│   │   ├── janusgraph.ts           # EDIT: ownersOf() from INCLUDES.author; mergeDevice() sets it
│   │   ├── janusgraph.test.ts      # NEW: ownersOf(), mergeDevice()
│   │   ├── blocks.ts               # NEW: Blocks interface, kuboBlocks(), putAll()
│   │   ├── blocks.test.ts          # NEW: against the local Kubo (R21)
│   │   ├── edits.ts                # NEW: retire(), putRepresentation()
│   │   ├── edits.test.ts           # NEW
│   │   ├── changes.ts              # NEW: rootOf(), fingerprints, entriesOf(), pendingSpots()
│   │   ├── changes.test.ts         # NEW
│   │   ├── selection.ts            # NEW: select() (R3)
│   │   ├── selection.test.ts       # NEW
│   │   ├── staging.ts              # NEW: stageSpots(), cleanStaged() (R19, R20)
│   │   ├── staging.test.ts         # NEW
│   │   ├── publish.ts              # NEW: prepare(), commit(), commitInTransaction()
│   │   ├── publish.test.ts         # NEW
│   │   ├── publish.concurrent.test.ts  # NEW: FR-016, the one committing test
│   │   ├── publish.perf.test.ts    # NEW: SC-002
│   │   ├── received.ts             # NEW: recordUpdate()
│   │   ├── received.test.ts        # NEW
│   │   ├── rebuild.ts              # NEW: rebuild() (R15)
│   │   ├── rebuild.test.ts         # NEW: SC-007
│   │   ├── backfill.ts             # NEW: backfillRepresentations(), assertLocalGraph()
│   │   ├── backfill.test.ts        # NEW
│   │   ├── listing.ts              # EDIT: contentsOf sorts by AS.order
│   │   ├── listing.test.ts         # EDIT: for attach()'s new shape
│   │   ├── search.test.ts          # EDIT: likewise
│   │   ├── moves.ts                # EDIT: retire instead of drop
│   │   ├── moves.test.ts           # NEW
│   │   └── testing.ts              # EDIT: seedUser, seedTree, uuids in seed/seedWide, markPublished, memoryBlocks, snapshot, test keys
│   ├── remotes/
│   │   ├── pending.remote.ts       # NEW: query
│   │   ├── stage.remote.ts         # NEW: command → stageSpots
│   │   ├── preparePublish.remote.ts  # NEW: command → prepare, cleanStaged
│   │   ├── commitPublish.remote.ts   # NEW: command → commitInTransaction
│   │   ├── receiveUpdate.remote.ts   # NEW: command → recordUpdate
│   │   ├── addFiles.remote.ts      # EDIT: putRepresentation(), order only on AS
│   │   ├── representations.remote.ts  # EDIT: sorts by AS.order
│   │   └── nodeInfo.remote.ts      # DELETE
│   └── components/
│       ├── PublishDialog.svelte    # NEW
│       └── PublishDialog.svelte.test.ts  # NEW
├── routes/[...path]/
│   ├── +page.svelte                # EDIT: Publish… & Record Update replace the CAR/DAG exports
│   └── page.svelte.test.ts         # EDIT
scripts/
└── backfill-representations.ts     # NEW: connects & runs backfill.ts once
```

**Structure Decision**: This stays the existing single SvelteKit app.

- **Graph code** lives in `src/lib/server/`, beside `listing.ts` and `moves.ts`, as functions taking a `source` so tests can pass a transaction. They also take a `Blocks`, so tests can pass a memory store.
- **Shared code**: the document formats and the MST are in `src/lib/`, because the browser needs the typed data to sign and the rebuild reader uses the same decoders.
- **Remotes** stay thin wrappers that resolve the session address, `g()` or `g().tx()`, and `kuboBlocks()`. Every error they surface comes from a server function (R20).

## Complexity Tracking

| Exception or judgment call | Why | Simpler alternative rejected because |
| --- | --- | --- |
| **Principle III exception**: FR-016's concurrency test commits two transactions instead of rolling back | A lock conflict between transactions only shows up at commit, and a rollback never conflicts, so no rolled-back test can prove that two publishes can't share a sequence. The test seeds a throwaway `User` with a random address and deletes everything under it in `afterEach`. | A rolled-back test of the guard alone shows the condition but not that a concurrent publish fails. An in-process mutex test would test a mechanism the plan doesn't use (R9). |
| The server Vitest project runs its files one at a time (`fileParallelism: false`) | The graph test files share one BerkeleyDB-backed JanusGraph, and parallel files deadlock each other's transactions, which also breaks FR-016's race test | Separate graphs per test file need one JanusGraph each |
| `rebuild()` lives in `src/lib/server/` though only tests call it for now | FR-018 requires the tree to be reconstructable from IPFS alone, which can only be proven with a reader. It's also the first half of the later import feature, so it isn't speculative. | A reader only in test code would be thrown away and rewritten for the import |
