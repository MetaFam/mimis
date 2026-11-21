# Research: Publish Write-Layer Updates

Decisions for [plan.md](plan.md), with what was checked against the running system on 2026-11-18 and 2026-11-21. Updated 2026-11-21 for the spec's clarifications of 2026-11-20 and 2026-11-21, and for the findings of `/speckit-analyze`: R18–R22 are new, and R2, R9, R10, R13, R14, and R15 changed.

## What exists today

Probed against the local JanusGraph (gremlin-javascript 3.7.3) on 2026-11-18:

- One `User` −`WRITES`→ root `Spot`; 213 `Spot`s, 212 `CONTAINS`, 168 `AS` → `Content` → `IS` → `Blob`. No `MOUNT` edges, no `PREVIOUS` edges, and no recorded Updates: `Updates` has no out-edges.
- Every `Spot` and every `CONTAINS` edge has a `uuid`. `Content` has `uuid`, `type`, `order` & `createdAt`. `AS` has `order` (stored by `addFiles` as the **string** `'-1'`) & `createdAt`. `IS` has **no properties at all**. `Blob` has `cid`, `size` & `createdAt`.
- Every `Content` has exactly one `IS`. No `Content` is held by two `Spot`s, and no `Spot` has two parents.
- The write layer is the user's whole tree. Nothing records what has been published, so this feature has to add that.
- `addFiles` with a new file of an already-held type adds a **second** `Content` of that type rather than versioning the first (its `PREVIOUS` edge is commented out). Listing hides the older one by `createdAt`, which a reader of published versions can't see.
- The only removals are the edge drops in `moveSpotTraversal` & `moveContentTraversal`. Nothing creates a `MOUNT`.
- The whole-tree export (`janus2DAG.ts`) runs in the browser, makes one `nodeInfo` remote call per vertex, signs only the root CID, and is reached from “Export to CBOR-DAG” and “Export to CAR”.
- Kubo 0.43.1 is running locally, and `kubo-rpc-client` 6.0.2 has `pin.update`.

## R1: Where the publish runs

**Decision**: On the server, in three steps: `preparePublish` (server) → wallet signature (browser) → `commitPublish` (server).

- **prepare** reads the graph, selects what goes in (R3), encodes every Spot & Content version and both indexes (R4, R5), and writes those blocks to Kubo unpinned. It changes nothing in the graph. It returns the typed data to sign and a sealed plan (R8).
- **sign**: the browser asks the wallet to sign the typed data (R6).
- **commit** checks the plan's seal and that the signature recovers to the session's address, writes & pins the `Update` block (R7), then applies the plan to the graph in one transaction guarded by the device's sequence (R9).

**Rationale**: The server already has JanusGraph and Kubo, so 1,000 versions are a handful of traversals plus 1,000 unpinned `block.put`s, not 1,000 browser round trips as in the old export (SC-002). Only the signature needs the browser. Because prepare doesn't change the graph, cancelling or failing at any point before commit leaves everything pending and staged (FR-014), and the unpinned blocks it wrote are harmless.

**Alternatives considered**: Serializing in the browser like `janus2DAG.ts` is one remote call per vertex. Doing everything in commit after signing doesn't work, because the signature covers the index roots, which have to be computed first.

## R2: Tracking what is pending

**Decision**: Mark what has been published on the graph itself, and derive “pending” from those marks. One tree per user holds both the published state and the pending changes (FR-023, clarified 2026-11-21).

- A `Spot` or `Content` gets a `cid` property: its latest published version. With no `cid`, it has never been published. The next version names that `cid` as its `previous`, so a Spot published in several Updates forms a chain of versions (FR-008, FR-009).
- Each entry edge (`CONTAINS`, `MOUNT`, `AS`, `IS`) gets a `published` property: a canonical string of the entry's fields as last published (its **fingerprint**, see [data-model.md](data-model.md#fingerprints)). An edge is pending when `published` is missing or differs from its current fingerprint. A pending edge that was published before, such as a renamed link or a mount with a new order, is published again under the same key and replaces the earlier entry (clarified 2026-11-21). A `CONTAINS` fingerprint leaves out the target version, so a child's new version doesn't make its parent pending (FR-011).
- Removing a published entry replaces the edge with a `REMOVED` edge between the same two vertices, carrying `kind` (the old label), `key`, and the old `published` fingerprint. Removing an edge that was never published simply drops it, so an entry added and removed between publishes leaves no trace (FR-010). This happens in a single helper, `retire()`, that the moves use instead of `drop()`.
- A `REMOVED` marker and an edge with the same `kind`, `key`, & fingerprint on the same Spot cancel each other out, so moving something away and back leaves nothing to publish.
- A `Spot` has `staged: true` while it is staged.

**Rationale**: A new label hides removals from every existing traversal (listing, search, `fsEntries`, moves) without changing any of them, and keeps the old entry's key for the tombstone. Comparing fingerprints instead of setting a flag means an edit made while a publish is running leaves the edge pending, since its fingerprint no longer matches the one commit writes (FR-015). It also means no edit path has to remember to clear anything.

**Alternatives considered**:

- **A `dirty` flag set by every write**: every write path has to set it, and a missed one silently drops changes.
- **Diffing against the published versions**: needs the previous version of every Spot fetched and folded at each publish.
- **Separate dirty version vertices**, as in `docs/Claude’s graph structure.md`'s “Local Edits”: right for the eventual import & merge, but it doubles every vertex now and touches every traversal. The `cid` & `published` marks here are a subset of that design and don't stand in its way.

## R3: Selecting what goes into an Update

**Decision**: Start from the staged Spots and add to the selection until it is closed under three rules. The selection records, for each Spot and Content, which pending entries to publish.

1. **Staged Spots** (FR-030): every pending entry of a staged Spot, and every pending representation of each Content it holds through `AS`.
2. **Never-published targets** (FR-030): any selected entry whose target has no `cid` brings that target along, with all its pending entries: a contained Spot, or a held Content. This repeats through new Spots. A child that was published before and has pending changes isn't brought along.
3. **Connection** (FR-003, FR-004):
   - **New Spots**: a selected Spot with no `cid`, other than the root, needs an incoming `CONTAINS` in the Update. Its parent gets a partial version listing just that entry. If the parent is new too, the same rule applies to it, up to a published Spot or the root. A Spot with an already-published incoming `CONTAINS` is connected. Otherwise it takes the pending incoming `CONTAINS` with the lowest uuid, which is the oldest, since uuids are v7.
   - **Moves**: a selected `REMOVED` marker brings along the pending edge with the same `kind` and `key` elsewhere in the user's tree, and vice versa, as partial versions of the other Spot.

The Spots and Contents added by rules 2 & 3 that the user didn't stage are listed as “also included” before they sign. `MOUNT`s are published as entries but never followed (edge case), and each vertex is in the selection once, however many paths reach it.

**Rationale**: This follows the spec's scenarios exactly. In US2-3, `a/` lists only `one/`'s entry because `a/` is a connector, not staged. In US3-5, staging only `/a/` brings `b/`'s new entry. Partial versions are valid, since a version lists only changed entries, and the entries left out stay pending because their fingerprints still differ.

**Alternatives considered**: Publishing every pending change of every connector Spot breaks US2-3. Refusing to publish unconnected staged Spots breaks US2-2.

## R4: Document encoding

**Decision**: DAG-CBOR (`@ipld/dag-cbor`, already a dependency), CIDv1 with sha2-256, using the field names from the spec. UUIDs are their canonical 36-character strings. Links (`target`, `previous`, blob `cid`, `spots`, `contents`) are CID links, not strings. An empty or absent field is left out, never `null`, since DAG-CBOR forbids `undefined`. Entry arrays are sorted by key so equal versions get equal CIDs. A root version carries `root: true`. See [contracts/documents.md](contracts/documents.md).

**Rationale**: Content addressing makes each block's CID depend only on its fields. Sorting entries makes encoding independent of edge iteration order, so publishing again after a crash between storing the blocks and committing reproduces the same blocks.

**Alternatives considered**: 16-byte binary UUIDs save 20 bytes per entry but make keys unreadable and give MST keys a different sort order from the strings the graph uses. Keeping `null` for absent fields would make two encodings of the same version.

## R5: Merkle search tree

**Decision**: A small implementation in `src/lib/mst.ts` of atproto's repository MST, version 3: fanout 4, so a key's layer is half the number of leading zero bits of `sha256(utf8(key))`, rounded down. Nodes are `{ l: CID | null, e: [{ p, k, v, t }] }` with prefix-compressed keys, as in <https://atproto.com/specs/repository#mst-structure>. An Update's trees hold only that Update's entries, so the tree is built from a sorted list, and only `build()` and `get()` are needed, with no inserts or deletes. An empty tree is a single node with no entries.

**Testing**: Layers are checked against `key_heights.json` from <https://github.com/bluesky-social/atproto-interop-tests/tree/main/mst>, vendored with its URL. That directory has no root CIDs, so roots are checked against `@atproto/repo`'s MST, added as a dev dependency. Both are built from the same key sets: atproto-valid keys such as `spot/<uuid>`, since that library requires `collection/rkey`, run through the 156 keys in `example_keys.txt`.

**Rationale**: A published, documented format with readers in several languages, checked against a second implementation rather than hand-written fixtures (Constitution III). Using it at runtime would pull in `@atproto/repo`, which rejects keys without a `/` and brings a large dependency tree for about 80 lines of tree building.

**Alternatives considered**: A HAMT (`ipld-hashmap`) or Prolly tree isn't what the spec names. A plain sorted CBOR map is simpler, but it isn't a search tree and doesn't share structure.

## R6: Signing & author derivation

**Decision**: EIP-712 typed data, with the browser signing through `signTypedData` from `@wagmi/core` and the server recovering the signer with viem's `recoverTypedDataAddress`.

```ts
domain: { name: 'Mïmis Graph', version: '1' }
types: { Update: [
  { name: 'device', type: 'string' },
  { name: 'sequence', type: 'uint64' },
  { name: 'spots', type: 'string' },     // CID, base32
  { name: 'contents', type: 'string' },  // CID, base32
  { name: 'previous', type: 'string' },  // CID, or '' for the first
] }
```

- The signature is stored as its 65 bytes.
- **Author**: `recoverTypedDataAddress` over the five signed fields as stored in the Update (FR-020). Changing any of them changes the digest, so the recovered address changes (FR-006, SC-005).
- **Malformed**: an Update is rejected if a signed field is missing or has the wrong type, if the signature isn't 65 bytes, or if recovery throws (FR-026).
- **Wrong account** (FR-007): before preparing, the browser compares the wallet's connected account (`getConnection(wagmiConfig).address`) with the session's address and refuses if they differ, so nothing is stored. At commit, the server refuses unless the recovered address is the session's.

The domain omits `chainId`: an Update isn't bound to a chain, and MetaMask refuses typed data whose `chainId` isn't the active chain. The existing `Root` signing used `chainId: 1`, and it goes away with the old export (R12). The typed data is defined once in `src/lib/updates.ts`, which both the browser and the server import.

**Rationale**: viem is already a dependency, and the old export already signed EIP-712 typed data with wagmi. Recovery needs only the Update itself, so no trust in the storing device is needed. Strings for the CIDs mean the wallet shows the user readable addresses.

**Alternatives considered**: An EIP-191 `personal_sign` of a CBOR digest is opaque to the user in the wallet. EIP-1271 contract wallets can't be recovered from the signature alone, so they are out of scope, as the spec's assumption says.

## R7: Storing & pinning

**Decision**: A `Blocks` interface, `{ put(bytes): Promise<CID>, get(cid): Promise<Uint8Array> }`, with a Kubo implementation in `src/lib/server/blocks.ts`. It calls `block.put` with `pin: false`, at most 16 at a time, and throws if Kubo's CID differs from the one computed locally. Commit stores the `Update` block, then calls `pin.update(previous, update, { unpin: true })`, or, for a first Update, `pin.add(update, { recursive: true })`. Tests use an in-memory `Blocks` with the same real encodings.

**Implemented (2026-11-21)**: `pin(update, previous)` calls `pin.update(previous, update, { unpin: false })`, and `commitInTransaction` unpins `previous` only once the transaction has committed. With `unpin: true`, a publish that lost the race or failed after pinning would leave the published history unpinned. Both pin calls take `settings.ipfsTimeout`, because a recursive pin otherwise searches the network forever for file data that isn't on the node.

**Rationale**: Per-item pins cost about ¼ s each (see the Kubo pinning note), and an Update links its previous one, so one recursive pin on the newest covers the whole history. `pin update` walks only what's new. A pin succeeds only once every block it reaches is present, which proves FR-017's “retrievable by address” without a separate check. File data is already in Kubo from upload and is referenced by its CID, not stored again.

**Alternatives considered**: Pinning each block is ~4 minutes for 1,000. Unpinning the previous Update after pinning the new one does the same work as `pin update` in two steps.

## R8: Carrying the plan from prepare to commit

**Decision**: Prepare returns a **plan**: the five signed fields, `createdAt`, and the graph changes to apply on commit. The changes are the new `cid` of each published vertex, the fingerprint of each published entry edge with that edge's id, out-vertex, kind & key, the ids of the `REMOVED` markers it consumes, and the ids of the Spots to clean. The plan is sealed with the session HMAC (`sign`/`verify` in `auth.ts`, exported as `seal`/`unseal`) along with the address and a 10-minute expiry. Commit accepts only a plan it sealed, for the same address, before it expired.

**Rationale**: Remote functions are stateless across requests, and Cloudflare may serve them from different isolates. A sealed plan needs no server storage and can't be edited to mark someone else's edges or make up CIDs.

**Alternatives considered**: Recomputing at commit would include changes made since prepare, whose CIDs the signature doesn't cover. Storing the plan in the graph needs cleanup for cancelled publishes.

## R9: Applying a publish & serializing publishes

**Decision**: Commit runs in one `g().tx()`, which it commits only if every step succeeds:

1. **Sequence guard**: `V(device).where(coalesce(values('sequence'), constant(0)).is(plan.sequence − 1))`, then set `sequence` and `head`. If no row comes back, another publish finished first.
2. Set `cid` on every published `Spot` and `Content`, and `published` on every listed edge that still exists.
3. Retire listed edges that have gone since prepare. Each becomes a `REMOVED` marker carrying the fingerprint that was just published, so a removal made during the publish isn't lost (FR-015).
4. Drop the consumed markers, and clear `staged` on the planned Spots and on staged Spots whose changes cancelled out (R19).
5. Record the Update under `Users` → `User` → `Device` → `Updates` (R10, FR-027). This is part of the MVP's commit, not a later addition.

Writes are batched by id, 500 per traversal.

**Probe (2026-11-18)**: Two sessions each ran `V(id).has('seq', 0).property('seq', 1)` in a transaction with an overlapping commit. With and without a read before the write, exactly one committed and the other failed with “Could not commit transaction due to exception during persistence (500)”. BerkeleyDB JE's record locks make the guard safe across tabs and server instances, so two Updates never commit with the same sequence (FR-016). Commit maps that failure to a 409, “Another publish finished first; publish again.”

**Correction (2026-11-21)**: The guard alone isn't safe. In `publish.concurrent.test.ts`, it sometimes let both publishes commit, because `cache.db-cache = true` in `config/janusgraph/mimis.properties` serves reads from a cache that takes no BerkeleyDB lock, and JanusGraph doesn't check write-write conflicts by itself. The 2026-11-18 probe only saw one failure because its commits overlapped. The fix is to make `sequence` an Integer key with `ConsistencyModifier.LOCK`. `lockSequences()` in `backfill.ts` does this, run by the migration script, so it has to run on every graph. With the lock, every race had exactly one winner. The loser fails in one of three ways: a BerkeleyDB "Deadlock was detected" while the traversals run, a failed lock check, or "Could not commit transaction". `commitInTransaction` maps all three to the 409. Graph test files share one BerkeleyDB-backed graph and deadlock each other when run in parallel, so the server Vitest project runs its files one at a time (`fileParallelism: false`).

**Ordering**: The Update block is stored and pinned before the transaction. If the transaction then loses the race, the losing Update is unpinned and never recorded. If storage fails, the transaction never runs (FR-014).

The loser's Update block therefore exists in Kubo briefly, unpinned and unreferenced. This plan reads the spec's “never produce two Updates with the same sequence” as never *recording or announcing* two, which is what readers and the device's chain see. No lock can be taken earlier without leaving a stale lock when a signature is cancelled. The spec's wording should say “record”.

**Testing**: Proving the guard takes two transactions that really commit, because a rollback never conflicts. That one test commits a throwaway user with a random address and deletes everything under it afterward. Plan.md's Complexity Tracking justifies the exception to Principle III's rolled-back transactions.

**Alternatives considered**:

- **An in-process mutex**: doesn't hold across isolates or instances.
- **A JanusGraph unique index on (device, sequence)**: needs schema management, and received Updates may legitimately repeat a sequence.
- **A lock taken at prepare**: leaves a stale lock when the user cancels the signature.

## R10: Recording Updates (own & received)

**Decision**: `recordUpdate({ source, cid, blocks })` does the following:

1. Fetches the block, validates its shape with Valibot, and recovers the author (R6).
2. Merges `User{address}` under `Users`, then `Device{uuid}` under that `User` via `USES`, then its `Updates` via `COMMITS`.
3. Adds `Update{cid, sequence, digest, createdAt}`, where `createdAt` is when it was recorded locally, as on every other vertex, with an `Updates` −`SPANS`→ `Update` edge, unless that `Device`'s `Updates` already spans an `Update` with the same `digest`.

The `digest` is the EIP-712 hash of the signed fields, so copies that differ only in `createdAt` or `comment` are the same Update, and the first one received is kept (FR-026). Two Updates with the same sequence and different digests are both recorded, as the spec's assumption says. The browsable graph is never touched (FR-025). Commit records its own Update the same way, inside its transaction.

**Rationale**: The spec keys sameness on signed content. A signature can differ for the same content, for example with a non-deterministic signer, but the digest can't. `SPANS` is the name `docs/update structure options.md` already uses.

## R11: Content & representations

**Decision**: Bring the local model in line with what's published:

- **One type per Content** (FR-031): separate types are separate Contents, as `addFiles` and listing already assume. The type stays on the `Content` vertex, and each `blobs` entry's `type` is that Content's type, so a Content version alone says what it holds.
- **`IS` edges**: each gets a `uuid`, the blob entry's key, and `addFiles` sets it. A one-off migration gives the 168 existing `IS` edges a UUIDv7: `backfillRepresentations({ source })` in `src/lib/server/backfill.ts`, so it can be tested in a rolled-back transaction, run by `scripts/backfill-representations.ts`. Serializing an `IS` without one throws.
- **`addFiles`**: when the Spot already holds a current Content of the file's type with a different blob, it retires that Content's `IS` and adds the new `IS` → `Blob` to the same Content, instead of adding a second Content. The Content keeps its uuid, and its next version lists the blob removal and the addition, which a reader can rebuild.
- **`order`**: it moves to `AS` alone. Today `addFiles` writes it twice: `Content.order = -1` (a number), which is what `contentsOf` in `listing.ts` and `representations.remote.ts` sort by, and `AS.order = '-1'` (a string), which only `moveContentTraversal` reads, to copy it. (Found 2026-11-21: the graph's automatic schema made `order` an Integer key, so JanusGraph stored the string as the number −1 all along.) The order is the holding Spot's arrangement of its Contents, and a Spot's `contents` entry publishes it, so it belongs on the `AS` edge. `addFiles` and moves write `AS.order` as a number, and `contentsOf`, `representations`, and the `attach()` test helper read and write it there. The backfill script copies each `Content.order` onto its `AS` edge as a number and drops `Content.order`. Publishing reads `AS.order` and throws if it isn't a finite number.

A Spot's `contents` entry is `{ uuid, order, type }` from the `AS` edge and the `Content`. A Content's `blobs` entry is `{ uuid, cid, size, type }` from the `IS` edge, the `Blob`, and the `Content`'s type. Removing one of a Spot's types (US3-2) retires its `AS` edge, which publishes a `contents` tombstone in a new Spot version and no Content version.

**Rationale**: Without this, replacing a file publishes two `contents` entries of the same type, which a reader can't order the way listing does. That would break FR-018 and SC-007. It's the smallest change that makes the published state match what's browsed.

## R12: Removing the old export

**Decision**: Delete `src/lib/janus2DAG.ts`, `src/lib/remotes/nodeInfo.remote.ts` (used only by it), `blocksToCAR` in `src/lib/ipfs.ts`, the `ipfs-car` dependency, and the “Export to CAR” and “Export to CBOR-DAG” menu items, replacing them with “Publish…”. “Export to CSV” stays.

**Rationale**: The spec says this feature replaces the whole-tree export, and Principle II says to remove dead code.

## R13: Removals in the UI

**Decision**: No new rename or removal UI, as the spec settled on 2026-11-21. Moves and `addFiles` replacements are the removals the app makes today, and both go through `retire()`. Removals of one of a Spot's Contents (US3-2) or of a mount (US3-3) are tested by calling `retire()` directly, since nothing creates mounts yet. Publishing handles any removal however it was made.

**Rationale**: The FRs require publishing removals, not new ways to make them, and the editor deliberately doesn't support deletion. Also, the editor's “stage” means bytes written to Kubo before an SCM commit, which is unrelated to staging here; user-facing text says “staged for publishing” to keep them apart.

## R14: Mount creators

**Decision**: A Spot mounts a given target at most once, so the target's uuid is the mount's key (clarified 2026-11-21). Encoding a Spot with two `MOUNT`s to the same target throws a 400, `Spot #12 mounts Spot #40 twice.`, naming both. A mount's `creator` comes from the `author` property of the `INCLUDES` edge between `Users` and the `User` whose tree holds the target:

- **The walk**: `ownersOf({ source, spot })` in `src/lib/server/janusgraph.ts` follows incoming `CONTAINS` and `WRITES` up to each `User` that reaches the Spot, then reads `inE('INCLUDES').values('author')`. It returns the deduplicated authors. This is `assertOwned`'s walk, which is now `ownersOf(…).includes(address)`.
- **Encoding**: a mount gets no `creator` when the target's owners include the publisher. Otherwise its `creator` is the target's single owner. With no owner, or more than one, it throws a 500 `Can’t tell who owns mount target Spot #40.`.
- **Where it's computed**: in `entriesOf` (`src/lib/server/changes.ts`), so the `MOUNT` fingerprint and the published entry use the same `creator`.
- **A `User` reached with no `INCLUDES` `author`** is an unexpected shape and throws.

`INCLUDES.author` is new. `mergeDevice` sets it on every new edge, and the migration (`backfill.ts`) copies each `User`'s `address` onto its `INCLUDES` edges that lack it. `User.address` stays, since every lookup by account uses it.

**Rationale**: This follows the design doc's base graph, where the `INCLUDES` edge carries the `author`, as requested on 2026-11-21. Returning every owner keeps `assertOwned`'s current “any path to this user” behavior exact.

## R15: Rebuilding from public storage

**Decision**: `rebuild({ head, blocks })` in `src/lib/server/rebuild.ts` reads an Update chain from IPFS alone:

1. Walk `previous` back to collect the Updates.
2. Find the root in the first Update's `spots` tree, which has exactly one entry. Follow `previous` from that entry's version within the Update to the first version, which must carry `root: true` (R18).
3. Resolve each Spot's latest version by looking its uuid up in each Update's `spots` tree, newest first. If no tree has it, the latest version is the entry's target.
4. Fold the Spot's versions from oldest to newest, where an entry replaces the same key and a tombstone removes it. A chain within one Update (R18) folds the same way. Content is folded the same way through the `contents` trees.

It returns the same `Tree` shape as `snapshot({ source, root })`, a test helper that reads the raw `CONTAINS`/`MOUNT`/`AS`/`IS` edges from the graph, and tests compare the two (FR-018, SC-007).

**Rationale**: FR-018 needs a reader to be testable, and the later import feature starts from this one. It lives in `src/lib/server/` because it reads through the same `Blocks` interface.

## R16: Staging & publishing UI

**Decision**: A `PublishDialog.svelte` opened from “Publish…” in the actions menu:

- It lists pending Spots by path, each with a staging checkbox and a summary of its change, such as “new” or “+2 −1”, split into **Staged** and **Not staged**. It has a “Stage all” button and an optional comment field.
- **Publish** calls prepare, shows what was added to connect the staged Spots (FR-003) along with the sequence, then asks the wallet to sign and calls commit. On success it shows the Update's address, linked through `toHTTP`.
- With nothing staged, it says so and stores nothing (FR-019). Without a wallet, it says one is needed.
- A cancelled signature leaves everything as it was and says “Publish cancelled.” (US1-4)

SC-001's three actions are “Publish…”, “Stage all”, and “Publish”, then the wallet's approval. Pending Spots come from a `pending` query remote. Staging is a `stage` command that refreshes it.

A small “Record Update” field in the same menu takes an Update's address and calls `receiveUpdate`, which is how US5 is reached in the app. Received Updates aren't displayed, so FR-029 needs nothing beyond never showing `comment` or `createdAt` as the author's. The publish result labels the comment “your comment (unsigned)”.

## R17: Performance

**Decision**: Prepare uses a fixed number of traversals regardless of size, not one per vertex:

1. Pending Spot ids from the root, via `repeat(out('CONTAINS'))` with an `aggregate`d visited set so Spots with several parents are visited once.
2. The candidate Spots' entry edges and markers, projected in one traversal.
3. Content representations, likewise.

Encoding is in-process, and `block.put` runs 16 at a time. Commit's writes are batched (R9). The estimate for 1,000 items is under 5 s, measured by the SC-002 test in [quickstart.md](quickstart.md). An Update changing one file publishes one Content version, an empty `spots` tree, and a one-entry `contents` tree (SC-004), since the Content's Spot has no pending entries.

## R18: Versions too large for one block

**Decision**: Every published document is at most `MAX_BLOCK = 1_048_576` bytes (FR-032). `encodeSpot` and `encodeContent` split a version whose encoding would be larger into a **chain** within the same Update:

1. Sort all of the version's entries (`contains`, then `mounts`, then `contents`, or `blobs`) by key.
2. Fill one version at a time, greedily, measuring each entry's own encoded size against the budget left after the version's fixed fields and the array headers.
3. Each later link names the one before it as `previous`. The first link's `previous` is the Spot's `cid` (or absent), and it alone carries `root: true` when the chain is the root's first version (FR-028).
4. The last link is what gets the index entry (FR-021, FR-022), what parents' `contains` entries target, and what the vertex's `cid` becomes.

After encoding, each block is checked against `MAX_BLOCK`. A single entry too large for a block on its own (in practice, a name of about a megabyte) throws a 400, `An entry of Spot #12 is too large to publish.`.

**Probe (2026-11-21)**:

- **Kubo's limit**: Kubo 0.43.1's `block put` accepted 2,097,152 bytes and refused 2,097,153 with “produced block is over 2MiB: big blocks can't be exchanged with other peers”. The spec's 1 MiB cap is kept, because older Kubo releases, other implementations, and gateways still enforce 1 MiB.
- **Entries per version**: 10,000 `contains` entries with short names and one shared CID encode to 1,118,996 bytes, about 112 bytes each. So about 9,370 fit in one version, and a 10,000-entry directory needs a chain of two. (With five-character names such as `n9999`, an entry is about 103 bytes and 10,000 fit in one block. The tests use 11-character names.)

**Rationale**: As clarified, a chain needs no new document shape: readers already fold `previous` chains, and the index and parent links already point at a Spot's newest version. Putting the root flag on the first link keeps FR-028's “the root's first version” literal.

**Alternatives considered**: A per-version entry tree (the design doc's large-`Rollup` idea) adds a second encoding for readers. A fixed count of entries per version mis-sizes long names.

## R19: Cleaning staged Spots with nothing to publish

**Decision**: A staged Spot whose changes all cancel out (moved away and back, added and removed) is no longer pending, so it has nothing to publish. Its `staged` flag is cleared:

- **During a publish**: commit clears it with the other planned Spots (R9 step 4). Prepare lists such Spots in the plan's `clean` ids.
- **Nothing to publish**: when prepare finds nothing at all, the `preparePublish` remote calls `cleanStaged({ source, address })`. It clears `staged` on every staged Spot that isn't pending, and returns `{ nothing: true }`.

**Rationale**: This is the spec's edge case “has nothing to publish and is cleaned”. Clearing the flag on a Spot with no pending changes loses nothing, so it doesn't conflict with FR-014's “every staged Spot MUST remain staged”, which is about Spots whose changes are still pending. Without it, a stale `staged` flag would silently stage the Spot's next, unrelated change.

## R20: Every thrown error is testable below the remotes

**Decision**: Each remote is a thin wrapper that resolves the session address, `g()` or `g().tx()`, and `kuboBlocks()`. Every error it can raise, other than SvelteKit's 400 for a failed schema and the 401 for no session, comes from a server function with its own test (Principle III):

| Error | Raised by |
| --- | --- |
| Stage: 403 not yours; 400 nothing to publish | `stageSpots({ source, address, ids \| all, staged })` in `src/lib/server/staging.ts` |
| Receive: 400 not a CID | `recordUpdate`, which takes the CID string and parses it |
| Commit: 409 another publish won | `commitInTransaction({ tx, … })` in `src/lib/server/publish.ts`, which maps the lock-conflict failure |
| Storage: CID mismatch | `kuboBlocks()`, tested against the local Kubo with unpinned throwaway blocks, as the R18 probe did |
| Migration: refusing a non-localhost graph | `assertLocalGraph(url, { remote })` in `src/lib/server/backfill.ts`, beside `backfillRepresentations({ source })`; the script only wires them to a connection |

**Rationale**: The 002 feature followed the same pattern for `searchSpots`. Remotes need a request event, which tests don't have, so errors raised inside them can't be tested without one.

## R21: Testing the real Kubo adapter

**Decision**: `src/lib/server/blocks.test.ts` runs against the local Kubo and is skipped unless `settings.ipfsAPI` is on localhost, the way `transaction()` refuses a remote graph. It covers:

- `put` of a real DAG-CBOR block returning the CID computed locally;
- the CID-mismatch error, by giving `put` a different codec than the local encoder uses;
- `pin`, then `pin` with `previous` (`pin.update`), then `unpin`.

It cleans up with `pin.rm`. The blocks are unpinned throwaways that Kubo's garbage collection removes.

**Rationale**: Principle III requires IPFS logic to be tested against real encodings. `memoryBlocks()` covers the encodings, but only Kubo can show that `block.put` and `pin.update` behave as expected.

## R22: Spec wording this plan reads narrowly

One spec sentence, read literally, contradicts the plan, which follows the spec's intent:

- **Edge case**: “never **produce** two Updates with the same sequence” is read as “never record or announce”, as explained under R9. The spec should say “record”.

FR-011's “no **staged** changes” was the other one. As of 2026-11-21 it reads “no changes included in the Update”, which matches FR-003 and US2-1.
