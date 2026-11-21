---
description: "Task list for Publish Write-Layer Updates"
---

# Tasks: Publish Write-Layer Updates

**Input**: Design documents from `specs/003-publish-updates/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Regenerated 2026-11-21**: This version follows the plan's update for the spec's 2026-11-20 and 2026-11-21 clarifications and the `/speckit-analyze` findings:

- **C1**: the committing concurrency test is justified, and written before its implementation.
- **C2**: every thrown error has a test task.
- **I2**: staged Spots whose changes cancel out are cleaned.
- **U1**: the SC-004 seeding gets uuids and publish marks.
- **L1**: own Updates are recorded in the MVP.
- **O1**: the `Blocks` interface comes first.

**Tests**: Tests are MANDATORY (Constitution III). Every story includes test tasks that are written first and seen to fail.

**Organization**: Tasks are grouped by user story, so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US5)
- All paths are relative to the package root `pkgs/Gremlin/`

## Conventions for every task

- **Style:**
  - Two-space indents.
  - `if(` / `for(` / `while(` / `catch(` with no space before the parenthesis.
  - Single-expression arrow bodies are wrapped in parentheses, with the body on its own indented line.
  - `.method()` chain continuation lines aren't indented. Indent only after a line ending in an open grouping symbol.
  - Trailing commas on multi-line entries.
  - Real glyphs (… → ’) in user-facing text.
- **Imports:** from `src/lib`, use `#lib/…` with a `.js` extension for `.ts` modules (for example `#lib/updates.js`, `#lib/server/publish.js`). `.svelte` keeps its extension. Server-only modules live in `src/lib/server/`.
- **Errors:**
  - Unexpected shapes throw, and sentinels are used only where an absence is legitimate.
  - User-facing failures are SvelteKit `error(status, message)`s with the messages in [contracts/remotes.md](contracts/remotes.md), raised in server modules, never only in remotes (research.md R20).
  - In remotes, `HttpError`s pass through, and anything else becomes `error(500, '<Name>: "<message>"')`, as in `listing.remote.ts`.
- **Graph code:** every function takes a `source` (a traversal source or a transaction), as `listing.ts` and `moves.ts` do. Never call `g()` inside it; only remotes and the migration script do.
- **Graph tests:** they run against the local JanusGraph inside `transaction()` from `src/lib/server/testing.ts` and are rolled back in `afterEach`. Use `.next()` or `.toList()`, never `.iterate()`. The one exception is `publish.concurrent.test.ts` (T026), which commits and cleans up after itself, as plan.md's Complexity Tracking justifies.
- **Block tests:** use `memoryBlocks()` (T003), with real DAG-CBOR and sha2-256 and no hand-written bytes. `blocks.test.ts` (T009) uses the local Kubo. Signatures come from real viem keys (T003).
- **Comments:** only for a non-obvious *why*. The plan's Constitution Check lists the expected ones.
- **Terms:** a **Spot vertex** is a JanusGraph vertex, and a **Spot version** is a published DAG-CBOR document. The formats are in [contracts/documents.md](contracts/documents.md), and the graph properties, fingerprints, and version chains are in [data-model.md](data-model.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, vendored test vectors, the `Blocks` interface, and the test helpers every later phase uses.

- [X] T001 Add the MST cross-check dependency and vendor the atproto vectors.
  - **Dependency:** run `pnpm add -D @atproto/repo`. It's used only by `src/lib/mst.test.ts`.
  - **Vectors:** download `key_heights.json` and `example_keys.txt` from `https://raw.githubusercontent.com/bluesky-social/atproto-interop-tests/main/mst/` into `src/lib/fixtures/mst/`, unchanged.
  - **Check:** `pnpm exec vitest --run --project server src/lib/search.test.ts` still passes.
- [X] T002 [P] Create the block cap and the `Blocks` interface. T014 and T015 fill in the rest of these files.
  - **`src/lib/updates.ts`** is shared with the browser. Add `export const MAX_BLOCK = 1_048_576`, with a comment saying why it's 1 MiB though Kubo 0.43 allows 2 MiB: older peers and gateways enforce 1 MiB (research.md R18).
  - **`src/lib/server/blocks.ts`:** `export interface Blocks { put(bytes: Uint8Array): Promise<CID>; get(cid: CID): Promise<Uint8Array>; pin(cid: CID, previous?: CID): Promise<void>; unpin(cid: CID): Promise<void> }`.
- [X] T003 Extend the test helpers in `src/lib/server/testing.ts`. Depends on T002.
  - **`attach()`:** puts `order` on the `AS` edge, not the `Content`. Gives the `Content` a v7 `uuid` and the `IS` edge a v7 `uuid`. Returns `{ content: Id, is: Id }`. Update its callers in `src/lib/server/listing.test.ts` and `src/lib/server/search.test.ts` if they use the old return value.
  - **`seed()` and `seedWide()`:** give every Spot and every `CONTAINS` a v7 `uuid`. In `seedWide`, generate them in JS and `inject` them with the names.
  - **`seedUser(source, { address })`:** creates `Users` −`INCLUDES{author: address}`→ `User{address}` −`USES`→ `Device{uuid}` −`COMMITS`→ `Updates`, and `User` −`WRITES`→ root `Spot{uuid}`, with the same labels as `base()` in `src/lib/server/janusgraph.ts`. Returns `{ user, device, root }`. If `Users` already exists, it reuses it rather than adding a second one.
  - **`dropUser(source, { user })`:** drops every vertex reachable from `user` by out-edges, plus `user`. Used only by T026.
  - **`seedTree(source, { root, tree })`:** like `seed`, but grows under an existing root. A key with an extension, such as `'top.svg': { file: 'bafy…' }`, gets a `Content` of the type `splitName` from `#lib/mimetypes.js` gives, through `attach()`. Returns the path → id map.
  - **`memoryBlocks({ failPin = false } = {})`:** implements `Blocks` over a `Map<string, Uint8Array>`.
    - `put` computes the CID with dag-cbor + sha2-256 and throws `Block over 1 MiB.` above `MAX_BLOCK`, the way Kubo would at its own limit.
    - `get` throws `Block <cid> not found.`.
    - `pin` and `unpin` record into an exposed `pins: Set<string>`, and `failPin` makes `pin` throw.
  - **`testAccount()`:** `privateKeyToAccount(generatePrivateKey())` from `viem/accounts`.
  - **`signUpdate(account, typedData)`:** `account.signTypedData(typedData)`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The foundation every story needs:

- document formats with chains and validation, the MST, and block storage;
- graph-side change tracking: `retire`, fingerprints, and pending detection;
- the migration, the ownership and merge helpers, and the plan seal.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for the foundation ⚠️

> Write these first and see them fail.

- [X] T004 [P] MST tests in `src/lib/mst.test.ts`:
  - **Layers:** `layerOf(key)` equals `height` for every entry of `src/lib/fixtures/mst/key_heights.json`.
  - **Roots:** `build(entries, blocks)` gives the same root CID as `@atproto/repo`'s `MST`, built with `MST.create(new MemoryBlockstore())`, then `add(key, cid)` per key, then `getPointer()`. The key sets:
    - every key of `example_keys.txt`, prefixed `spot/`;
    - the first 1, 2, and 10 of them;
    - 1,000 `spot/<uuidv7>` keys.
    - Values are the CIDs of dag-cbor encodings of `{ n: i }`.
  - **Empty tree:** `build([])` is the CID of `{ l: null, e: [] }`.
  - **Lookup:** `get(root, key, blocks)` returns each value, returns `null` for absent keys (before the first, between two, after the last), and works with bare UUID keys.
  - **Errors:** `build` throws on a duplicate key, and `get` throws on a missing block.
- [X] T005 [P] Document tests in `src/lib/updates.test.ts`:
  - **Encoding:**
    - `encodeSpot`/`encodeContent`/`encodeUpdate` omit absent and empty fields. They sort each entry array by key in UTF-8 byte order, and equal inputs in a different order give equal CIDs.
    - Names with `/`, `é`, `σοφία`, and `✨` round-trip byte-identically.
    - An entry and a tombstone with the same key throw.
    - An empty new Spot encodes to `{ uuid }` alone.
  - **Chains (FR-032):** `encodeSpot` returns an array of `{ bytes, cid }` links.
    - Under 1 MiB, there's one link.
    - With 10,000 `contains` entries, there are two links, each `bytes.length ≤ MAX_BLOCK`. Entries are split in key order with none lost or duplicated, and the second link's `previous` is the first's CID.
    - The first link's `previous` is the given `previous`, and `root: true` is only on the first.
    - A single entry whose `path` is 1,100,000 characters throws a 400 `An entry of Spot … is too large to publish.`.
  - **Typed data:** `typedDataFor(update)` matches contracts/documents.md, “Signed typed data”, with `previous: ''` when absent and `sequence` as a `bigint`.
  - **Authorship (SC-005):**
    - `authorOf` recovers a `testAccount()`'s lowercased address.
    - Altering `device`, `sequence`, `spots`, `contents`, or `previous` changes `authorOf`, and altering `createdAt` or `comment` doesn't.
    - `digestOf(update)` equals viem's `hashTypedData(typedDataFor(update))`.
  - **`validateUpdate`:** decoding an `encodeUpdate` round trip validates. It rejects every malformed case with `Malformed Update: <field …>.`:
    - a missing field;
    - a wrong type;
    - a 64-byte signature;
    - `sequence` 0 or 1.5;
    - `previous` present with sequence 1, or absent with sequence 2;
    - an unrecoverable signature.
- [X] T006 [P] Edit tests in `src/lib/server/edits.test.ts`:
  - **`retire`, unpublished:** for each of `CONTAINS`, `MOUNT`, `AS`, and `IS`, an edge without `published` is dropped and leaves no `REMOVED`.
  - **`retire`, published:** an edge with `published` becomes `REMOVED{kind, key, published, createdAt}` between the same vertices, with the key per data-model.md.
  - **`retire`, errors:** it throws on a non-entry edge (`WRITES`).
  - **`putRepresentation`:**
    - No Content of the type: it creates `Content{uuid, type}`, `AS{order: -1}` (a number), and `IS{uuid}` → `Blob{cid, size}`.
    - The same type and CID: no change.
    - The same type with another CID: it retires the old `IS` and adds a new `IS` → `Blob` to the same Content (same id and `uuid`, FR-031).
    - Another type: a separate Content.
- [X] T007 [P] Change-tracking tests in `src/lib/server/changes.test.ts`:
  - **Fingerprints:** `fingerprint(edge)` follows data-model.md for each kind, and a `CONTAINS` fingerprint ignores the child's `cid`.
  - **`pendingSpots`, what counts:** a Spot under a `seedUser` root is pending when:
    - it has no `cid`;
    - an entry has no `published`;
    - an entry's `published` differs from its fingerprint: a renamed `CONTAINS` (same `uuid`) or a changed `AS.order`. It's pending under its old key, with no marker;
    - it has a `REMOVED` out-edge;
    - it holds a pending Content: no `cid`, a pending `IS`, or a `REMOVED` from it.
  - **`pendingSpots`, what doesn't count:**
    - A published Spot whose child got a new `cid` isn't pending (FR-011).
    - A marker and an edge with the same `kind`, `key`, and fingerprint cancel out.
    - An edge added and then retired leaves nothing (FR-010).
    - A Spot reachable only through `MOUNT`, or only through `REMOVED`, isn't listed.
  - **Output:** `PendingSpot` per contracts/remotes.md. A Spot with two parents is listed once, by its lowest-`uuid` path, and the list is sorted by path.
  - **`markPublished` (T017):** afterwards, `pendingSpots` is empty.
  - **Errors from `entriesOf`:**
    - an `IS` without `uuid`, or a `CONTAINS` without `uuid` or `path`;
    - an `order` that isn't a finite number;
    - two current same-type Contents on one Spot;
    - two `MOUNT`s from one Spot to one target, which is a 400 `Spot #… mounts Spot #… twice.`.
  - **Mount creators (R14):** `entriesOf` gives each `MOUNT` its `creator`, which the fingerprint includes.
    - A target in the publisher's own tree has none.
    - A target in a second seeded user's tree has that user's `INCLUDES.author`.
    - A target no `User` reaches, or one reached by two other users, is a 500 `Can’t tell who owns mount target Spot #….`.
- [X] T008 [P] Move tests in `src/lib/server/moves.test.ts`:
  - `moveSpotTraversal` keeps `path` and `uuid`.
  - Moving an unpublished edge leaves no marker.
  - Moving a published one leaves `REMOVED{kind: 'CONTAINS', key: <uuid>}` on the old parent, and the new edge has no `published`.
  - `moveContentTraversal` does the same for `AS`, keeping `order` as a number.
- [X] T009 [P] Kubo adapter tests in `src/lib/server/blocks.test.ts` (research.md R21), with `describe.skipIf` unless `settings.ipfsAPI` is on localhost:
  - `kuboBlocks().put(encode({ t: Date.now() }))` returns the locally computed CID.
  - `put` with an encoder whose codec differs from Kubo's format throws `CID mismatch: expected …, got ….`.
  - `pin(a)` pins `a`. `pin(b, a)` moves the pin to `b`, which links `a`, and `a` stays reachable.
  - `unpin(b)` removes it.
  - `putAll` of 40 blocks puts them all.
  - `afterAll` calls `pin.rm` on anything still pinned.
- [X] T010 [P] Seal tests in `src/lib/server/auth.test.ts`: `unseal(seal(p)) === p`, and a token with one changed character unseals to `null`.
- [X] T011 [P] Migration tests in `src/lib/server/backfill.test.ts`, in a rolled-back transaction, on data shaped as today's:
  - **The data:** an `IS` without properties, `Content.order = -1`, `AS.order = '-1'`, and an `INCLUDES` with only `createdAt`.
  - **First run:** `backfillRepresentations({ source })` gives each `IS` a v7 `uuid`, sets `AS.order` to the number `-1`, drops `Content.order`, and sets `INCLUDES.author` to its `User`'s `address`. It returns the counts.
  - **Second run:** it returns zero counts.
  - **`assertLocalGraph`:** `assertLocalGraph('wss://janus.example.org/gremlin', { remote: false })` throws `Refusing to migrate wss://janus.example.org/gremlin; pass --remote to allow it.`. It passes for localhost and for `{ remote: true }`.
- [X] T012 [P] Ownership and merge tests in `src/lib/server/janusgraph.test.ts`:
  - **`ownersOf({ source, spot })`:**
    - It returns the `INCLUDES.author` of each `User` whose `WRITES` reaches `spot` through incoming `CONTAINS`, deduplicated.
    - It returns `[]` for a Spot no `User` reaches, and two authors for a Spot in two users' trees.
    - A `User` whose `INCLUDES` has no `author` throws `User #… has no INCLUDES author.`.
  - **`assertOwned`:** still passes for the owner and throws a 403 for anyone else.
  - **`mergeDevice({ source, address, device, now })`:**
    - It creates `Users` −`INCLUDES{author: address}`→ `User{address}` → `Device{uuid: device}` → `Updates` and returns the `Updates` id.
    - Run again, it returns the same id and adds nothing.
    - It merges under the right `User` when two users exist.

### Implementation for the foundation

- [X] T013 [P] Implement `src/lib/mst.ts` to make T004 pass.
  - **`layerOf(key)`:** `sha256` over the UTF-8 bytes, leading zero bits ÷ 2, rounded down. Use `multiformats/hashes/sha2`.
  - **`build(entries: Array<[string, CID]>, blocks: { put(bytes): Promise<CID> }) → Promise<CID>`:** sorts by key bytes and throws on a duplicate. Builds recursively by layer, with nodes `{ l, e: [{ p, k, v, t }] }`: `k` is prefix-compressed (a `Uint8Array`), and `l`/`t` are `null` when empty. It `put`s each node.
  - **`get(root, key, blocks)`:** returns the `CID` or `null`.
  - Keep it near 80 lines.
- [X] T014 [P] Implement `src/lib/updates.ts` to make T005 pass.
  - **Types:** `Update`, `SpotVersion`, `ContentVersion`, and `Entry`.
  - **Encoding:** `encodeSpot(v)` and `encodeContent(v)` return `Array<{ bytes, cid }>`, splitting per research.md R18. The first link carries the given `previous` and `root`, each later link's `previous` is the one before, and each block is checked against `MAX_BLOCK` (from T002). `encodeUpdate(u)` returns `{ bytes, cid }`. All use dag-cbor with CIDv1 and sha2-256.
  - **`typedDataFor(u)`:** the domain is `{ name: 'Mïmis Graph', version: '1' }` with no `chainId`. Comment why.
  - **`authorOf(u)`**, lowercased, and **`digestOf(u)`**.
  - **`validateUpdate(value: unknown): Update`:** a Valibot schema plus the cross-field checks, then `authorOf` to rule out an unrecoverable signature.
  - The module imports nothing server-only.
- [X] T015 [P] Add `kuboBlocks()` and `putAll(blocks, items)` to `src/lib/server/blocks.ts` to make T009 pass.
  - **`kuboBlocks()`** uses `getIPFS()` from `src/lib/server/ipfs.ts`:
    - `put` calls `block.put(bytes, { format: 'dag-cbor', mhtype: 'sha2-256', pin: false })` and throws on a CID mismatch.
    - `get` calls `block.get` with `timeout: settings.ipfsTimeout`.
    - `pin` calls `pin.update(previous, cid, { unpin: true })` when `previous` is given, else `pin.add(cid, { recursive: true })`.
    - `unpin` calls `pin.rm`.
  - **`putAll`** `put`s at most 16 at a time.
- [X] T016 [P] Implement `src/lib/server/edits.ts` to make T006 pass.
  - **`retire({ source, edge, now })`** follows data-model.md, “Retiring an entry”. Comment why `REMOVED` is a label and not a flag.
  - **`putRepresentation({ source, spot, type, cid, size, now })`** behaves as in T006 and returns the Content id.
- [X] T017 [P] Implement `src/lib/server/changes.ts` to make T007 pass.
  - **`rootOf({ source, address })`:** the root, through `User{address}` −`WRITES`→.
  - **`fingerprint`:** the `JSON.stringify` of an array, in this order:
    - `CONTAINS`: `[path, childUuid]`
    - `MOUNT`: `[targetUuid, creator ?? null, order]`
    - `AS`: `[contentUuid, order, type]`
    - `IS`: `[uuid, cid, size]`
    - Comment why `CONTAINS` omits the target.
  - **`entriesOf({ source, ids, address })`:** in one traversal, gathers each Spot's `CONTAINS`/`MOUNT`/`AS` out-edges with their encoding fields, and its `REMOVED` out-edges. Each `MOUNT`'s `creator` comes from `ownersOf` on its target (T020): none if the owners include `address`, otherwise the single owner, else a 500 (R14). For each held Content, it gathers its `uuid`, `type`, `cid`, `IS` edges with `Blob.cid`/`size`, and its `REMOVED` edges. Each comes with a `pending` flag, and it raises the errors in T007.
  - **`pendingSpots({ source, address })`:** from `rootOf`, one traversal collects the Spot ids under the root by `CONTAINS`, visiting each once with `aggregate`. Then it calls `entriesOf` with `address` and derives pending, path, and counts.
  - **Test helper:** add `markPublished(source, { ids })` to `src/lib/server/testing.ts`, as T007 and T025 expect. For each Spot id, it sets a `cid` (the CID of `encode({ uuid })`) and sets `published` on its `CONTAINS`/`MOUNT`/`AS` out-edges and its Contents' `IS` edges, using `fingerprint()`.
- [X] T018 [P] Export `seal(payload)` and `unseal(token)` from `src/lib/server/auth.ts` as the existing `sign`/`verify`, renamed, with the internal callers updated. Makes T010 pass.
- [X] T019 [P] Implement `src/lib/server/backfill.ts` (`backfillRepresentations`, `assertLocalGraph`) to make T011 pass, and the wrapper `scripts/backfill-representations.ts`.
  - **The wrapper** runs with `node scripts/backfill-representations.ts [--remote]`. It reads `PUBLIC_JANUSGRAPH_URL`/`_USERNAME`/`_PASSWORD` from `.env.local` and calls `assertLocalGraph`.
  - It connects with gremlin's `DriverRemoteConnection`, runs `backfillRepresentations` in one `tx()`, commits, and prints the counts.
  - `backfill.ts` imports only `gremlin` and `uuid`, so the script runs without SvelteKit's `$app` modules.
  - **Run it now:** once T011 passes, run `node scripts/backfill-representations.ts` against the local graph and check that a second run reports zero changes. It must run before T020 lands, because `ownersOf` throws for a `User` whose `INCLUDES` has no `author`, and moving a Spot would then fail.
- [X] T020 [P] Refactor `src/lib/server/janusgraph.ts` to make T012 pass:
  - **`ownersOf({ source, spot })`:** `assertOwned`'s walk (`repeat(__.in_('CONTAINS', 'WRITES').simplePath()).until(__.hasLabel('User'))`), then `.inE('INCLUDES').values('author')`, deduplicated. It throws for a reached `User` without an `INCLUDES` `author`. `assertOwned` becomes `(await ownersOf({ source: g(), spot: id })).includes(address)`, throwing its 403 as today.
  - **`mergeDevice({ source, address, device, now })`:** `base()`'s `Users`/`User`/`INCLUDES`/`Device`/`USES`/`Updates`/`COMMITS` steps for any address and device uuid. The `INCLUDES` `mergeE` sets `author: address` on create. `base()` calls it with the session address and a new uuid only when the user has no `Device` yet, and keeps its `WRITES` root step.
  - **Check:** the existing behavior of `base()`, `writeLayer()`, and `assertOwned` is unchanged (`moveSpot`'s and `upsertSpot`'s remotes still work).
- [X] T021 Retire instead of drop in `src/lib/server/moves.ts`. Depends on T016.
  - In `moveSpotTraversal` and `moveContentTraversal`, replace `.sideEffect(__.select('old').drop())` with `retire()` after the new edge is added.
  - Keep the new edge's `uuid` (`CONTAINS`) and write `order` as a number (`AS`).
  - Makes T008 pass. `listing.test.ts` and `search.test.ts` still pass.
- [X] T022 Make `addFiles` use `putRepresentation`, and move `order` onto `AS`. Depends on T003 and T016. The files:
  - **`src/lib/remotes/addFiles.remote.ts`:** replace the per-file `existing` lookup and `addV('Content')…` block with `putRepresentation({ source: g(), spot: spotId, type, cid, size, now })`, and delete the commented-out `PREVIOUS` code.
  - **`contentsOf` in `src/lib/server/listing.ts`:** sort by `AS.order`, projecting the `AS` edge before `inV()`.
  - **`src/lib/remotes/representations.remote.ts`:** the same change.
  - **Check:** `listing.test.ts` and `search.test.ts` still pass.

**Checkpoint**: Documents encode (with chains), sign, and validate. The MST matches atproto, and the Kubo adapter works against Kubo. Moves and imports leave correct markers, pending is derived, and the migration is tested. Browsing is unchanged.

---

## Phase 3: User Story 1 - Stage and publish changes (Priority: P1) 🎯 MVP

**Goal**: Stage pending Spots, all at once or one at a time, then publish them as one signed Update. The user sees its address, it's recorded under their `Device`, nothing published stays pending, and browsing is unchanged.

**Independent Test**: On a fresh user, add `/icon/hat/top.svg`, stage all, and publish. The Update and every version it lists can be fetched by CID, the `Device` spans the Update, `pendingSpots` is empty, and `/icon/hat/` still lists `top.svg` (quickstart.md scenarios 1–6).

### Tests for User Story 1 ⚠️

- [X] T023 [P] [US1] Selection tests (rules 1 & 2 of research.md R3) in `src/lib/server/selection.test.ts`:
  - Staging a Spot selects all its pending entries and its Contents' pending representations.
  - A selected entry to a never-published Spot or Content brings it along recursively, with `reason: 'new'`.
  - A published child with pending changes isn't brought along (FR-030).
  - `MOUNT` targets are never followed.
  - A Spot reachable twice is selected once.
  - Spots whose changes cancel out select nothing and are listed in the selection's `clean` ids.
- [X] T024 [P] [US1] Staging tests in `src/lib/server/staging.test.ts`:
  - `stageSpots({ ids, staged: true })` sets `staged`, and `staged: false` clears it.
  - `{ all: true }` stages exactly the pending Spots.
  - An id in another user's tree → 403 `The Spot, Spot #…, doesn't belong to the user ….`. An id that isn't pending → 400 `Spot #… has nothing to publish.`.
  - `cleanStaged` clears `staged` only on staged Spots that aren't pending (R19).
- [X] T025 [P] [US1] Publish tests in `src/lib/server/publish.test.ts`, one `describe` per scenario, using `seedUser`, `seedTree`, `memoryBlocks`, `testAccount`, and `signUpdate`:
  - **US1-1:**
    - The Update has sequence 1 and no `previous`.
    - `spots` keys = [the root's uuid], and that version has `root: true`. `contents` keys = [top's Content uuid].
    - Every listed block is in the store.
    - The five vertices have `cid`s equal to their versions' CIDs, and `pendingSpots` is empty.
    - The Device has `sequence: 1` and `head`, `pins` has the Update, and the Device's `Updates` `SPANS` an `Update{cid, sequence: 1, digest}` (FR-027).
  - **US1-2:** `fedora.svg`, staging `hat/` → sequence 2, `previous`, `hat/` v2 with `previous` = v1 and only `fedora`, and `spots` = [hat]. The `cid`s of `/` and `icon/` are unchanged.
  - **US1-3:** the comment “hats” is in the Update, not in `typedDataFor`.
  - **US1-4 / FR-014:** prepare without commit leaves every `cid`, `published`, and `staged` as it was. Commit with `memoryBlocks({ failPin: true })` throws a 502 `Storing the Update failed: …` and also changes nothing.
  - **US1-5 / FR-019:**
    - With only unstaged changes, prepare returns `{ nothing: true }` and `put` is never called.
    - With a staged Spot whose changes cancelled out, the same holds, and the prepare result lists it for cleaning.
  - **US1-6 / SC-003:** `assembleListing(listingTraversal(…))` for every path is deep-equal before and after.
  - **FR-015:** between prepare and commit, add a file under a staged Spot, rename an entry being published, and move one away. All three are pending afterwards, and the moved entry's old parent has a `REMOVED` with the published fingerprint.
  - **SC-004:** 10,000 Spots via `seedWide`, then `markPublished`. Replace one file's blob → one Content version, `spots` empty, and no Spot `cid` changed.
  - **FR-032:** stage a new Spot with 10,000 children (`seedWide`) and publish.
    - Its version is a chain of two blocks, each ≤ 1 MiB.
    - The parent's entry targets the second link, and the vertex's `cid` is the second link.
    - Every child is reachable from one of the two links.
  - **Empty Spot:** a new Spot with no children or Content publishes `{ uuid }`.
  - **Prepare errors:**
    - A `CONTAINS` cycle among selected Spots, built with raw `addE` in the test, is a 400 `CONTAINS cycle at Spot #….`.
    - A name over 1 MiB is a 400.
  - **Commit errors:**
    - A bad seal is a 400, and another address's plan is a 400.
    - An expired plan (an injected `now`) is a 410.
    - Another `testAccount()`'s signature is a 403 `The signature is from …, not ….`, and nothing is pinned.
    - A Device already at the planned sequence is a 409 `Another publish finished first; publish again.`, and the Update is unpinned.
- [X] T026 [P] [US1] Concurrency test (FR-016) in `src/lib/server/publish.concurrent.test.ts`. This is the one committing test; see plan.md's Complexity Tracking.
  - **Setup:** `beforeEach` seeds a `seedUser` with a random address in its own `g().tx()` and commits it. `afterEach` deletes it with `dropUser` in another committed transaction.
  - **Race:** two `prepare`s for sequence 1, then two `commitInTransaction`s on two `g().tx()`s in parallel.
  - **Expect:**
    - Exactly one resolves, and the other rejects with a 409.
    - The loser's Update isn't in `pins`.
    - The Device has `sequence: 1`, and its `Updates` `SPANS` one `Update`.
- [X] T027 [P] [US1] Recording tests in `src/lib/server/received.test.ts`. US1 needs them for its own Updates (FR-027), and they also cover US5's acceptance scenarios. Use Updates built and signed by a second `testAccount()` with `encodeUpdate` into `memoryBlocks`:
  - **US5-1:** `User`, `Device`, `Updates`, and `SPANS` → `Update{cid, sequence, digest, createdAt}` are created, and `snapshot` of the local root is unchanged (FR-025).
  - **US5-2:** recording the same CID again → `recorded: false`, and there's still one `Update`.
  - **FR-026:** a copy with another `comment` (another CID, the same digest) → `recorded: false`, and the first is kept.
  - **US5-3:** sequence 4, then 3 → both recorded.
  - **Same sequence, different digest:** both recorded.
  - **Errors:**
    - **US5-4:** a malformed signature → 400 `That Update is malformed: …`, and nothing is recorded.
    - `'not-a-cid'` → 400 `“not-a-cid” isn’t a CID.`.
    - A CID with no block → 504.
  - **Test helper:** add `snapshot({ source, root })` to `src/lib/server/testing.ts`. It reads `CONTAINS`, `MOUNT`, and current `AS` → `Content` → `IS` → `Blob` under `root` by `CONTAINS` only, and returns data-model.md's `Tree`, sorted by key. A mount's `creator` comes from `ownersOf`, left out when the owners include the root's own author.
- [X] T028 [P] [US1] Component tests in `src/lib/components/PublishDialog.svelte.test.ts`. Mock `pending`, `stage`, `preparePublish`, `commitPublish`, `signTypedData`, and `getConnection` with `vi.hoisted`, as in `src/routes/[...path]/page.svelte.test.ts`. They cover every state in contracts/ui.md except the account mismatch (T050):
  - loading, no session or wallet, nothing staged, prepared with `included`;
  - declined signature (no `commitPublish` call), committed (the address link and “(yours, unsigned)”), and an error;
  - a checkbox → `stage({ ids: [id], staged })`, and “Stage all” → `stage({ all: true })`;
  - Publish disabled while in flight.
- [X] T029 [P] [US1] Page tests in `src/routes/[...path]/page.svelte.test.ts`:
  - The menu has “Publish…” (`commandfor="publish"`), disabled without a session, and has no “Export to CAR” or “Export to CBOR-DAG”.
  - Replace the `#lib/janus2DAG.js` mock with a `PublishDialog` stub, the way `SIWE.stub.svelte` is used.

### Implementation for User Story 1

- [X] T030 [US1] Implement `select({ source, address, staged })` in `src/lib/server/selection.ts`, rules 1 & 2, using `entriesOf`.
  - **Returns** `{ spots, contents, clean }`. `spots` and `contents` are `Map<Id, { uuid, cid?, root, reason: 'staged' | 'new' | 'connect' | 'move', entries: Array<EntryRef>, markers: Array<MarkerRef> }>`, and `clean` is `Array<Id>`.
  - **`EntryRef`:** `{ edge, kind, key, fingerprint, encoded }`. Cancelled-out marker/edge pairs are `MarkerRef`s with `cancel: true`.
  - Makes T023 pass.
- [X] T031 [P] [US1] Implement `stageSpots` and `cleanStaged` in `src/lib/server/staging.ts`, using `ownersOf` (T020) and `pendingSpots`. Makes T024 pass.
- [X] T032 [US1] Implement `recordUpdate({ source, blocks, cid, now })` in `src/lib/server/received.ts` to make T027 pass:
  1. Parse `cid`, with a 400 if invalid.
  2. `get` the block, with a 504 on a timeout or a missing block.
  3. `validateUpdate`, with a 400 on failure.
  4. `authorOf`, then `digestOf`.
  5. `mergeDevice` (T020).
  6. Unless that `Updates` already `SPANS` an `Update` with the same `digest`, add one.
  7. Return `{ recorded, author, device, sequence }`.
- [X] T033 [US1] Implement `prepare({ source, blocks, address, comment, now })` in `src/lib/server/publish.ts`:
  1. **Select:** `rootOf` → staged ids → `select`. If nothing is selected, return `{ nothing: true, clean }`.
  2. **Order:** topologically order the selected Spots children-first over `CONTAINS` entries to selected children, with a 400 on a cycle.
  3. **Encode** with `encodeContent`/`encodeSpot` (chains). A `contains` entry targets the child's last new link, or else its `cid`. Add no guard for a child with neither: selection rule 2 brings every never-published child along, and if that ever failed, dag-cbor's encoder would already throw on the `undefined` target.
  4. **Store** with `putAll`.
  5. **Index:** build `spots` from the last links of selected Spots that had a `cid`, plus the root's, and `contents` from every Content's last link.
  6. **Sequence:** read `Device.sequence` (absent = 0) and `head`.
  7. **Seal:** return `{ nothing: false, typedData, plan: seal(JSON.stringify({ address, expires, device, sequence, previous, spots, contents, createdAt, comment, apply })), included, counts }`.
     - `expires` is `now` plus 10 minutes, and `previous` is `head`.
     - `apply` lists `{ vertex, cid }` with each vertex's last link, and `{ edge, out, kind, key, fingerprint }` per entry.
     - It also lists the consumed marker ids and the ids to clean: the staged and `clean` Spots.
- [X] T034 [US1] Implement `commit({ source, blocks, address, plan, signature, now })` and `commitInTransaction({ tx, … })` in `src/lib/server/publish.ts`:
  1. **Unseal**, then check the address and expiry: 400 or 410.
  2. **Signer:** if `authorOf` isn't `address`, a 403.
  3. **Store:** `put` the Update, then `pin(update, previous)`. A failure is a 502.
  4. **Guard:** set `sequence`/`head` on the Device only where `coalesce(values('sequence'), constant(0)).is(sequence − 1)`. With no row, `unpin` and a 409.
  5. **Apply**, in batches of 500:
     - Set `cid`s.
     - Set `published` on listed edges that still exist.
     - `retire` listed edges that are gone, with the planned fingerprint, and comment why.
     - Drop consumed markers, and clear `staged` on the clean ids.
  6. **Record:** `recordUpdate` for the Update's CID (FR-027).
  7. **Return** `{ cid, sequence }`.

  `commitInTransaction` runs `commit` on `tx.begin()` and calls `tx.commit()`, or `tx.rollback()` on error. It maps a `tx.commit()` rejection containing `Could not commit transaction` to `unpin` plus the 409, with a comment that BerkeleyDB's lock conflict means another publish won.

  Together with T033, this makes T025 and T026 pass.
- [X] T035 [P] [US1] Create `src/lib/remotes/pending.remote.ts`: a `query()` with no input that calls `pendingSpots({ source: g(), address })` and splits the result into `{ staged, unstaged }`. It returns 401 without a session.
- [X] T036 [P] [US1] Create `src/lib/remotes/stage.remote.ts`: a `command` with contracts/remotes.md's union schema. It calls `stageSpots`, then `void pending().refresh()`.
- [X] T037 [P] [US1] Create `src/lib/remotes/preparePublish.remote.ts` with input `{ comment? }` (at most 2,000 characters).
  - It calls `prepare({ source: g(), blocks: kuboBlocks(), address, comment, now: new Date() })`.
  - On `nothing`, it calls `cleanStaged` and returns `{ nothing: true }`.
- [X] T038 [US1] Create `src/lib/remotes/commitPublish.remote.ts` with input `{ plan, signature: /^0x[0-9a-f]{130}$/i }`. It calls `commitInTransaction({ tx: g().tx(), blocks: kuboBlocks(), … })`, then refreshes `pending()`.
- [X] T039 [US1] Create `src/lib/components/PublishDialog.svelte` per contracts/ui.md, taking the `me` prop.
  - **Lists:** `pending()` in `{#await}`, as two `<section>`s with checkboxes, plus “Stage all”, the comment input, Publish, and `<output aria-live="polite">`.
  - **Publish flow:**
    1. `preparePublish({ comment })`. If `nothing`, show “Nothing is staged to publish.”.
    2. Show `included`.
    3. `signTypedData(wagmiConfig, { ...typedData, message: { ...typedData.message, sequence: BigInt(typedData.message.sequence) } })`, with `getWagmiAdapter` from `#lib/appkit.js` as in `SIWE.svelte`. Any rejection before a signature shows “Publish cancelled. Your changes are still pending.”
    4. `commitPublish`.
    5. Show `Published Update ${sequence}:` with a `toHTTP({ cid })` link, and “Comment: … (yours, unsigned)”.
    6. Refresh `pending()`.
  - Makes T028 pass.
- [X] T040 [US1] Wire up the page and remove the old export:
  - **`src/routes/[...path]/+page.svelte`:**
    - Remove “Export to CAR”, “Export to CBOR-DAG”, `buildDAG`, `buildCAR`, `build`, and the `janusToDAG` import.
    - Add `<li><button disabled={!whoAmI} commandfor="publish" command="show-modal">Publish…</button></li>`.
    - Render `<PublishDialog me={whoAmI}/>`.
  - **Deletions:** `src/lib/janus2DAG.ts`, `src/lib/remotes/nodeInfo.remote.ts`, and `blocksToCAR` with its `CAREncoderStream` import in `src/lib/ipfs.ts`.
  - **Dependency:** `pnpm remove ipfs-car`.
  - Makes T029 pass.

**Checkpoint**: Quickstart manual steps 1–5 work, and T023–T029 pass. A user can stage everything and publish.

---

## Phase 4: User Story 2 - Publish only some of the pending changes (Priority: P2)

**Goal**: Staging part of the write layer publishes just that part, plus whatever connects it to the published graph, which the user is shown before signing.

**Independent Test**: With pending changes under `/a/` and `/b/`, stage only `/a/new/` and publish. The Update has only `/a/new/`'s changes plus `/a/`'s entry for it, and `/b/` is still pending and unstaged.

### Tests for User Story 2 ⚠️

- [X] T041 [P] [US2] Connection tests (research.md R3 rule 3, new Spots) in `src/lib/server/selection.test.ts`, in a `describe('connection')`:
  - **US2-1:** staging `/a/one/` selects `a/` with only `one/`'s entry and `reason: 'connect'`, and leaves `/b/two/` out.
  - **US2-2:** staging `/p/q/r/` connects `q/`, `p/`, and the root.
  - **US2-3:** only `one/`'s entry in `a/`.
  - **Parents:** a Spot with a published incoming `CONTAINS` needs no connector. With two pending parents, the lowest `CONTAINS` uuid is used.
- [X] T042 [P] [US2] Partial-publish tests in `src/lib/server/publish.test.ts`, in a `describe('partial')`:
  - **US2-1 end to end:** `a/`'s new `cid`, and `two/` still pending.
  - **US2-4:** stage two, unstage one → only the other is published.
  - **US2-5:** `pendingSpots` splits into staged and unstaged exactly.
  - **Included list:** prepare's `included` lists the connector paths.
- [X] T043 [P] [US2] Component tests in `src/lib/components/PublishDialog.svelte.test.ts`: unchecking a staged row calls `stage({ ids, staged: false })` and moves it to “Not staged” after the refresh. `included` renders with its reasons before the wallet is asked.

### Implementation for User Story 2

- [X] T044 [US2] Add rule 3's new-Spot connection to `select` in `src/lib/server/selection.ts`:
  - Each selected Spot without a `cid` that isn't the root, and has no published incoming `CONTAINS`, takes the pending incoming `CONTAINS` with the lowest `uuid`.
  - Its parent is added or extended with just that entry and `reason: 'connect'`.
  - This repeats until nothing changes.
  - Makes T041 and T042 pass.
- [X] T045 [US2] In `src/lib/components/PublishDialog.svelte`, label each `included` path by its reason: “to connect”, “new”, or “moved”. Makes T043 pass.

**Checkpoint**: Partial publishing works, and US1's tests still pass.

---

## Phase 5: User Story 3 - Publish moves and removals (Priority: P2)

**Goal**: Moves, renames, and removals of published entries are published as same-key replacements and tombstones. A move's two halves always travel together, and mounts record their creator.

**Independent Test**: Move a published `/a/s/` into `/b/` and publish. `a/` gets a `contains` tombstone, `b/` gets the entry, and `s/` gets no new version.

### Tests for User Story 3 ⚠️

- [X] T046 [P] [US3] Move-pairing tests in `src/lib/server/selection.test.ts`, in a `describe('moves')`:
  - A selected `REMOVED{kind: 'CONTAINS', key}` brings along the pending `CONTAINS` with that `uuid` elsewhere under the root, with `reason: 'move'`, and vice versa.
  - The same holds for `AS` by Content uuid.
  - **US3-5:** staging only `/a/` includes `b/`'s entry, and a new destination parent is connected by rule 3.
- [X] T047 [P] [US3] Removal tests in `src/lib/server/publish.test.ts`, in a `describe('removals')`:
  - **US3-1:** `a/` v2 has `contains: [{ tombstone: <link uuid> }]`, `b/` v2 has the entry, and `s/` has no new version.
  - **US3-2:** on separate SVG and PNG Contents, retiring the PNG's `AS` → a `contents` tombstone and no Content version.
  - **US3-3:** retiring a published `MOUNT` → a `mounts` tombstone keyed by the target uuid.
  - **US3-4:** an entry added and retired before publishing appears nowhere.
  - **Edits and names:**
    - **Rename (FR-008):** a renamed published link → `{ uuid: <same>, path: <new>, target }` and no tombstone.
    - **Two names:** with `hat` and `cap` pointing at one Spot, retiring `cap` tombstones only its link.
    - **Move and back:** nothing is published for that Spot, and it's cleaned.
  - **Mounts:**
    - Two `MOUNT`s to one target → a 400 from prepare, naming both.
    - **Creators (R14):** a mount within the user's tree is published with no `creator`. A mount into a second seeded user's tree is published with that user's `INCLUDES.author`. A mount to a Spot no `User` reaches → 500 from prepare, `Can’t tell who owns mount target Spot #….`.

### Implementation for User Story 3

- [X] T048 [US3] Add rule 3's move pairing to `select` in `src/lib/server/selection.ts`.
  - Selecting a `CONTAINS` or `AS` marker or entry adds its counterpart with the same key under the root, with just that entry or marker and `reason: 'move'`.
  - This repeats with the connection rule until neither changes anything.
  - Makes T046 and T047's move cases pass.
- [X] T049 [US3] Encode mount creators in `prepare` in `src/lib/server/publish.ts`.
  - Each `mounts` entry takes the `creator` that `entriesOf` found (T017), left out when absent.
  - Makes T047's creator cases pass.

**Checkpoint**: Moves, renames, and removals publish correctly, and the US1 and US2 tests still pass.

---

## Phase 6: User Story 4 - Know who published an Update (Priority: P3)

**Goal**: Anyone can derive an Update's author from the Update alone. Tampering with a signed part breaks it, and a mismatched wallet is refused before anything is stored.

**Independent Test**: Publish as a test account, then derive the author from the stored Update's CID alone. Altering `sequence` changes it.

**Note**: The derivation and the tamper checks (`authorOf`, `validateUpdate`, and T005's SC-005 cases) are foundational, since US1's commit and recording need them. The server-side refusal of a mismatched signer is T025's 403. What remains for this story is the browser's check, which runs before anything is stored (US4-3).

### Tests for User Story 4 ⚠️

- [X] T050 [P] [US4] Wallet-mismatch tests in `src/lib/components/PublishDialog.svelte.test.ts`. When `getConnection().address` differs from `me`, Publish shows “Your wallet is connected as 0x…, but you’re signed in as 0x….”, and neither `preparePublish` nor `signTypedData` is called.

### Implementation for User Story 4

- [X] T051 [US4] Add the account check to `src/lib/components/PublishDialog.svelte`, before `preparePublish`. Makes T050 pass.

**Checkpoint**: Authorship is derivable and tamper-evident, and a mismatched wallet is refused both in the browser and on the server.

---

## Phase 7: User Story 5 - Record Updates received from others (Priority: P3)

**Goal**: A received Update is verified and recorded under its author's `User` → `Device` → `Updates`, once, with no change to any listing.

**Independent Test**: Paste the address of an Update signed by another account into “Record Update”. A `User`, a `Device`, and an `Update` appear under `Users`, and every listing is unchanged.

**Note**: `recordUpdate` and all its acceptance tests (T027, T032) are in US1, because the MVP records its own Updates (FR-027). This story adds the way to receive one.

### Tests for User Story 5 ⚠️

- [X] T052 [P] [US5] Page tests in `src/routes/[...path]/page.svelte.test.ts` for the “Record Update” form, with `receiveUpdate` mocked:
  - Submitting an address calls `receiveUpdate({ cid })` and logs `Recorded Update ${sequence} from ${author} (device ${device}).`, or “Already recorded.” when `recorded` is false.
  - An error goes to `ErrorDialog`.

### Implementation for User Story 5

- [X] T053 [P] [US5] Create `src/lib/remotes/receiveUpdate.remote.ts`: a `command` with input `{ cid: v.string() }` that runs `recordUpdate` in a `g().tx()`, committing on success and rolling back on error. It returns 401 without a session.
- [X] T054 [US5] Add the “Record Update” form (`aria-label="Update address"`) to the actions menu in `src/routes/[...path]/+page.svelte`, per contracts/ui.md. Makes T052 pass.

**Checkpoint**: All five stories work on their own and together.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Reconstruction from IPFS alone (FR-018, SC-007), performance (SC-002), and the merge gates.

- [X] T055 [P] Write rebuild tests in `src/lib/server/rebuild.test.ts` (SC-007). They publish five Updates against `memoryBlocks`:
  1. the initial tree, with a 10,000-child directory so a chain is included;
  2. an addition;
  3. a move;
  4. a removal, a rename, and a blob replacement;
  5. a partial stage.
  - **Equality:** after each, `rebuild({ head, blocks })` deep-equals `snapshot({ source, root })`.
  - **Errors:** a missing block throws `Block … not found.`. A chain whose first Update's root chain has no `root: true` throws `No root in Update ….`.
- [X] T056 Implement `rebuild({ head, blocks })` in `src/lib/server/rebuild.ts`, per contracts/documents.md, “Reading”:
  1. Collect and `validateUpdate` the Updates through `previous`.
  2. Find the root through the first Update's single `spots` entry, back to its first link.
  3. Resolve each uuid's latest version with `get`, newest Update first.
  4. Fold versions from oldest to newest, with entries set by key, replaced by the same key, and deleted by tombstones.
  5. Return a `Tree`.
  - Makes T055 pass.
- [X] T057 [P] Write a performance test in `src/lib/server/publish.perf.test.ts` (SC-002): 500 new Spots, each with one Content (1,000 items in total), staged all, then time `prepare` plus `commit` with a pre-signed plan. Assert under 30 s and log the time. Record it under “Validation notes”.
- [X] T058 Run `pnpm run lint`, `pnpm run check`, and `pnpm test:unit --run`. Fix every new error. The baseline lint errors are recorded in `specs/002-subtree-name-search/tasks.md`.
- [ ] T059 Check that `node scripts/backfill-representations.ts` still reports zero changes on the local graph (it ran in T019). Then run quickstart.md's “Manual” steps 1–8 against the local Kubo and JanusGraph, and record the results under “Validation notes”.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 ∥ T002, then T003, which needs T002's interface. T003 adds only helpers with no Phase 2 dependencies. `markPublished` comes with T017 and `snapshot` with T027.
- **Foundational (Phase 2)**:
  - The tests T004–T012 come first, all in parallel.
  - Then T013–T020 in parallel.
  - T021 needs T016. T022 needs T003 and T016.
  - The whole phase blocks every story.
- **US1 (Phase 3)**:
  - The tests T023–T029 come first, in parallel.
  - T030 and T031 come next, in parallel. T032 needs T020 and T014.
  - Then T033 → T034, in order.
  - T035–T037 can start after T033. T038 needs T034.
  - T039 needs T035–T038, and T040 needs T039.
- **US2 (Phase 4)**: needs US1. The tests T041–T043 come first, then T044 and T045.
- **US3 (Phase 5)**: needs US1. The tests T046–T047 come first, then T048 and T049. If US2 is done, T048 runs its fixed-point loop together with T044's rule.
- **US4 (Phase 6)**: needs T039 (the dialog).
- **US5 (Phase 7)**: needs T032 (`recordUpdate`) and T040 (the page). T052 comes first, then T053 ∥, then T054.
- **Polish (Phase 8)**: T055/T056 need US3. T057 needs US1. T058 and T059 come last.

### User Story Dependencies

- **US1 (P1)**: Phases 1–2. This is the MVP, and it includes recording its own Updates.
- **US2 (P2)**: US1. It extends `select` and the dialog.
- **US3 (P2)**: US1. It can be built alongside US2, merging in `selection.ts` and `publish.test.ts`.
- **US4 (P3)**: US1's dialog.
- **US5 (P3)**: US1's `recordUpdate` and page.

### Within Each User Story

- Tests are written and seen to fail before the code they cover.
- The order is: server module (selection, staging, received → publish) → remotes → component → page wiring.

### Parallel Opportunities

- T001 ∥ T002.
- The nine foundation test files T004–T012 can be written together, and the eight modules T013–T020 built together.
- US1's seven test tasks T023–T029 run together, then T030 ∥ T031, and T035–T037 together.
- US2 ∥ US3 after US1, by two people.
- T055 ∥ T057.

---

## Parallel Example: Phase 2

```bash
# Write the foundation's tests together:
Task: "T004 MST tests in src/lib/mst.test.ts"
Task: "T005 Document tests in src/lib/updates.test.ts"
Task: "T006 Edit tests in src/lib/server/edits.test.ts"
Task: "T007 Change-tracking tests in src/lib/server/changes.test.ts"
Task: "T008 Move tests in src/lib/server/moves.test.ts"
Task: "T009 Kubo adapter tests in src/lib/server/blocks.test.ts"
Task: "T010 Seal tests in src/lib/server/auth.test.ts"
Task: "T011 Migration tests in src/lib/server/backfill.test.ts"
Task: "T012 Ownership & merge tests in src/lib/server/janusgraph.test.ts"

# Then the independent implementations:
Task: "T013 src/lib/mst.ts"
Task: "T014 src/lib/updates.ts"
Task: "T015 src/lib/server/blocks.ts"
Task: "T016 src/lib/server/edits.ts"
Task: "T017 src/lib/server/changes.ts"
Task: "T018 src/lib/server/auth.ts"
Task: "T019 src/lib/server/backfill.ts + scripts/backfill-representations.ts"
Task: "T020 src/lib/server/janusgraph.ts"
```

## Parallel Example: User Story 1

```bash
Task: "T023 Selection tests in src/lib/server/selection.test.ts"
Task: "T024 Staging tests in src/lib/server/staging.test.ts"
Task: "T025 Publish tests in src/lib/server/publish.test.ts"
Task: "T026 Concurrency test in src/lib/server/publish.concurrent.test.ts"
Task: "T027 Recording tests in src/lib/server/received.test.ts"
Task: "T028 PublishDialog tests in src/lib/components/PublishDialog.svelte.test.ts"
Task: "T029 Page menu tests in src/routes/[...path]/page.svelte.test.ts"

# After T033:
Task: "T035 src/lib/remotes/pending.remote.ts"
Task: "T036 src/lib/remotes/stage.remote.ts"
Task: "T037 src/lib/remotes/preparePublish.remote.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (T001–T003), then Phase 2 (T004–T022).
2. Phase 3 (T023–T040).
3. **Stop and validate**: run the US1 suites, then quickstart's manual steps 1–5. Staging everything and publishing works, wide directories become chains, own Updates are recorded, and the old export is gone.

### Incremental Delivery

1. **Foundation**: browsing is unchanged, moves leave markers, replacing a file keeps its Content, and the migration is ready.
2. **US1**: publish everything staged.
3. **US2**: publish part of the pending changes, with automatic connections.
4. **US3**: moves, renames, and removals as replacements and tombstones, plus mount creators.
5. **US4**: the wallet check in the browser.
6. **US5**: record others' Updates from the app.
7. **Polish**: reconstruction from IPFS proven (SC-007), and performance measured (SC-002).

---

## Validation notes

*(Recorded during `/speckit-implement`, 2026-11-21.)*

### Results

- **Tests (T058)**: `pnpm exec vitest --run` passes 330 tests in 25 files, in 3 min 24 s. The server project runs its files one at a time (see “Departures”).
- **Lint & check (T058)**: `pnpm run lint` reports only the baseline errors listed in `specs/002-subtree-name-search/tasks.md`. `pnpm run check` reports 0 errors and 2 warnings, both unused selectors this feature didn't touch.
- **SC-002 (T057)**: 500 new Spots with one Content each, so 1,000 items, against the local Kubo 0.43.1 and JanusGraph. Prepare took 1.06 s and commit 1.08 s, 2.14 s in all.
- **SC-007 (T055)**: after each of six Updates (a 10,000-child directory published as a chain, an addition, a move, a removal with a rename, a blob replacement and a mount, a partial publish, then the rest), `rebuild()` from blocks alone deep-equals `snapshot()` of the graph.
- **Migration (T019, T059)**: on the local graph, the first run changed 168 representations, 168 orders, and 1 author. Later runs change nothing, and `sequence` reports `LOCK`.
- **Manual steps (T059)**: **not run.** Steps 1–8 need a browser wallet to sign in and to sign, which this session can't drive. The dev server compiles and serves the page. T059 stays open until someone runs them.

### Departures from the plan

1. **The sequence guard needs a lock (FR-016)**: the `has()` + `property()` guard alone let two publishes both commit sequence 1, because `cache.db-cache` serves reads without BerkeleyDB locks. `sequence` is now an Integer key with `ConsistencyModifier.LOCK`, set by `lockSequences()` in the migration script, which every graph needs before this code runs on it. Losers fail as a deadlock, a lock check, or a failed commit, and all three map to the 409 (research.md R9).
2. **Pins**: `pin(update, previous)` keeps `previous` pinned (`pin.update` with `unpin: false`), and `commitInTransaction` unpins it after the commit lands. With `unpin: true`, a lost race or failed commit would leave the history unpinned. Pins time out after `settings.ipfsTimeout` (research.md R7).
3. **`REMOVED.entry`**: JanusGraph reserves `key` as a property name, so markers store their entry key as `entry` (data-model.md).
4. **`order` is an Integer key**: the automatic schema typed it on first use, so the old string `'-1'` was always stored as a number. Only a missing `order` can fail the numeric check, so its error reads `… has no numeric order.`.
5. **Request size**: the Gremlin server refuses requests over 64 KiB, and a chain of more than about 100 mid-traversal steps fails. Batched writes go through `writeAll()` (a `union()` of up to 100 writes), `seedWide` injects 250 rows at a time, and `V(...ids)` reads take 500 ids. A name long enough to make one entry over 1 MiB can't be written to the graph, so that 400 is tested in `updates.test.ts` only.
6. **Moves**: `moveSpotTraversal` and `moveContentTraversal` became the async `relinkSpot` and `relinkContent`, since retiring is a second step. The move remotes run both steps in one transaction (`inTransaction`).
7. **Test details**: `example_keys.txt` already has atproto's `collection/rkey` form, so its keys are used as they are, not prefixed. `markPublished` and `snapshot` need the owner's address for mount creators. `kuboBlocks({ format })` exists so the CID-mismatch test can make Kubo use another codec. 10,000 entries only exceed 1 MiB with names of about 11 characters.
8. **Parallel graph tests**: test files sharing the BerkeleyDB-backed graph deadlock each other, so the server project sets `fileParallelism: false` (plan.md, Complexity Tracking).
9. **The local Device**: prepare uses the session user's oldest Device by `createdAt`. A user whose `User` was first created by recording someone else's copy of their Update would get that remote Device instead. The security checklist's CHK020 asks about this case.
10. **Security (checklists/security.md CHK008)**: the “Record Update” log line is HTML-escaped, since a received `device` is whatever its sender wrote. A test checks that markup in it stays text.
