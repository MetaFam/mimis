# Contract: Publish remotes & server modules

The remotes are thin wrappers: they resolve the session address and the graph source, then call the server modules below. The server modules take a `source` (a traversal source or a transaction) and a `Blocks`, so tests can pass a rolled-back `g().tx()` and an in-memory store. Commands are POST-only, as remotes always are.

Every remote rewrites a failure the same way `listing` does: `HttpError`s pass through unchanged, and anything else becomes 500, `"<Name>: \"<message>\""`.

## `pending` (query)

**Module**: `src/lib/remotes/pending.remote.ts`. **Input**: none. **Requires** a session (401 otherwise).

```ts
type PendingSpot = {
  id: number | string
  uuid: string
  path: Array<string>            // one path from the root, by lowest CONTAINS uuid at each step
  isNew: boolean                 // no cid
  added: number                  // pending entries & representations
  removed: number                // pending REMOVED markers
  staged: boolean
}
→ { staged: Array<PendingSpot>, unstaged: Array<PendingSpot> }
```

Both arrays are sorted by `path`. A pending Spot whose only changes are in its Content counts them in `added` & `removed`.

## `stage` (command)

**Module**: `src/lib/remotes/stage.remote.ts`.

```ts
v.union([
  v.object({ ids: v.pipe(v.array(v.union([v.number(), v.string()])), v.minLength(1)), staged: v.boolean() }),
  v.object({ all: v.literal(true) }),
])
→ { staged: number }   // how many Spots are now staged
```

- **Effect**: sets or clears `staged` on the given Spots, or stages every pending Spot. Then it refreshes `pending()`.
- **403**: an id that isn't in the session user's tree (`assertOwned`).
- **400**: an id that isn't pending, `"Spot #12 has nothing to publish."`
- Staging reads every entry through `entriesOf`, so it also raises `entriesOf`'s errors: the 400 for a Spot that mounts one target twice, and the 500 for a mount target with no single owner.

**Server module**: `src/lib/server/staging.ts`, `stageSpots({ source, address, ids, staged })` or `stageSpots({ source, address, all: true })`. It raises both errors, so they're tested without a request (research.md R20). It also exports `cleanStaged({ source, address })` (research.md R19).

## `preparePublish` (command)

**Module**: `src/lib/remotes/preparePublish.remote.ts`. **Input**: `v.object({ comment: v.optional(v.pipe(v.string(), v.maxLength(2_000))) })`.

```ts
→ { nothing: true }
| {
    nothing: false
    typedData: TypedData            // contracts/documents.md, “Signed typed data”, with bigint sequence as a decimal string
    plan: string                    // sealed, opaque; valid for 10 minutes
    included: Array<{ path: Array<string>, reason: 'connect' | 'new' | 'move' }>
    counts: { spots: number, contents: number }
  }
```

- **Effect**: no change to anything pending. Writes the version and MST blocks to Kubo unpinned. Versions over 1 MiB are split into chains (research.md R18).
- **`nothing: true`**: no Spot is staged, or every staged Spot's changes cancel out (FR-019). Nothing is stored. The remote then calls `cleanStaged`, which clears `staged` on staged Spots that have nothing pending (research.md R19).
- **`included`**: the Spots added by the selection rules that weren't staged (FR-003).
- **400**: a Spot that mounts one target twice, `"Spot #12 mounts Spot #40 twice."`; a single entry too large for a block, `"An entry of Spot #12 is too large to publish."`; a `CONTAINS` cycle among the selected Spots, `"CONTAINS cycle at Spot #12."`
- **401** without a session.

**Server module**: `src/lib/server/publish.ts`, `prepare({ source, blocks, address, comment, now })`. It uses:

- `src/lib/server/changes.ts`: `pendingSpots`, `entriesOf`
- `src/lib/server/selection.ts`: `select`
- `src/lib/updates.ts`: `encodeSpot`, `encodeContent`, `typedDataFor`
- `src/lib/mst.ts`: `build`

## `commitPublish` (command)

**Module**: `src/lib/remotes/commitPublish.remote.ts`. **Input**: `v.object({ plan: v.string(), signature: v.pipe(v.string(), v.regex(/^0x[0-9a-f]{130}$/i)) })`.

```ts
→ { cid: string, sequence: number }
```

- **Effect**: stores and pins the Update, then applies the plan in one transaction (research.md R9).

| Condition | Result |
| --- | --- |
| Plan seal invalid, or for another address | 400, `"That publish plan isn’t valid."` |
| Signature can't be recovered | 400, `"That signature can’t be recovered."` |
| Plan expired | 410, `"That publish expired; publish again."` |
| Recovered signer ≠ session address | 403, `"The signature is from 0x…, not 0x…."` |
| Kubo unreachable, or a CID mismatch | 502, `"Storing the Update failed: …"`, with no graph change |
| Sequence guard fails, or the transaction loses a lock (another publish won) | 409, `"Another publish finished first; publish again."`, after unpinning this Update |

**Server module**: `src/lib/server/publish.ts`:

- `commit({ source, blocks, address, plan, signature, now })` does the work in a given source.
- `commitInTransaction({ tx, blocks, address, plan, signature, now })` runs `commit` in `tx`, commits it, and rolls it back on any error. It maps the lock-conflict failure to the 409 after unpinning the Update.

The remote calls `commitInTransaction` with `g().tx()`, so the 409 is tested without a request (research.md R20). Commit records its own Update through `recordUpdate` in the same transaction (FR-027).

## `receiveUpdate` (command)

**Module**: `src/lib/remotes/receiveUpdate.remote.ts`. **Input**: `v.object({ cid: v.string() })`. **Requires** a session.

```ts
→ { recorded: boolean, author: string, device: string, sequence: number }
```

- **`recorded`**: `false` when an Update with the same digest is already recorded under that Device (FR-026).
- **400**: an unparseable CID, `"“x” isn’t a CID."`, or a malformed Update, `"That Update is malformed: <reason>."`, with nothing recorded.
- **504**: the block can't be fetched within `settings.ipfsTimeout`.

**Server module**: `src/lib/server/received.ts`, `recordUpdate({ source, blocks, cid, now })`. `cid` is the string as given. `recordUpdate` parses it and raises the 400 itself, so every error above is tested without a request. `commit` calls the same function in its transaction (FR-027).

## Other server modules

| Function | Module | Contract |
| --- | --- | --- |
| `retire({ source, edge })` | `src/lib/server/edits.ts` | data-model.md, “Retiring an entry”. Returns nothing; throws if `edge` isn't an entry edge. |
| `putRepresentation({ source, spot, type, cid, size, now })` | `src/lib/server/edits.ts` | Adds or replaces the representation of `type` on `spot`'s current Content of that type, creating the Content if there is none (research.md R11). Returns the Content id. |
| `pendingSpots({ source, address })` | `src/lib/server/changes.ts` | Every pending Spot in the tree under `address`'s root, with its counts and one path. |
| `select({ source, address, staged })` | `src/lib/server/selection.ts` | The closed selection (research.md R3): per vertex, its entries to publish and why it was included. |
| `kuboBlocks({ format? })` / `memoryBlocks()` | `src/lib/server/blocks.ts` / `src/lib/server/testing.ts` | `Blocks`: `put(bytes) → CID` (throws on a CID mismatch; `format` is Kubo's codec, `dag-cbor` unless a test sets it), `get(cid) → bytes`, `pin(cid, previous?)` (keeps `previous` pinned), `unpin(cid)`. |
| `rebuild({ head, blocks })` | `src/lib/server/rebuild.ts` | data-model.md, “Rebuilt tree”, by contracts/documents.md, “Reading”. Throws on a missing block or an unmarked root. |
| `seal(payload)` / `unseal(token)` | `src/lib/server/auth.ts` | The existing HMAC `sign`/`verify`, exported under these names. |
| `stageSpots(…)` / `cleanStaged({ source, address })` | `src/lib/server/staging.ts` | See `stage` above, and research.md R19. |
| `backfillRepresentations({ source })` / `lockSequences(client)` / `assertLocalGraph(url, { remote })` | `src/lib/server/backfill.ts` | The one-off migration (research.md R11, R14) returns its change counts and is idempotent. `lockSequences` sets `ConsistencyModifier.LOCK` on `sequence` (research.md R9) through a Groovy management script. `assertLocalGraph` throws `Refusing to migrate <url>; pass --remote to allow it.` for a non-localhost URL without `remote`. `scripts/backfill-representations.ts` only connects and calls both. |

## Changed modules

| Module | Change |
| --- | --- |
| `src/lib/server/moves.ts` | `moveSpotTraversal` & `moveContentTraversal` become the async `relinkSpot` & `relinkContent`, which add the new edge and then retire the old one instead of dropping it, keeping its key on the new edge. The move remotes run them in one transaction (`inTransaction` in `janusgraph.ts`). |
| `src/lib/remotes/addFiles.remote.ts` | Uses `putRepresentation`. Writes `order` only on `AS`, as a number. |
| `src/lib/server/listing.ts`, `src/lib/remotes/representations.remote.ts` | Sort Contents by `AS.order` instead of `Content.order`. |
| `src/lib/server/testing.ts` | `attach()` puts `order` on the `AS` edge. |
| `src/lib/server/auth.ts` | Exports `seal`/`unseal`. |
| `src/lib/server/janusgraph.ts` | `assertOwned`'s ownership walk becomes `ownersOf({ source, spot })`, returning the `INCLUDES.author` of each `User` whose tree holds the Spot. It's used by `assertOwned`, `stageSpots`, and mount creators (research.md R14). `base()`'s merge steps become `mergeDevice`, so `recordUpdate` can merge `User` → `Device` → `Updates` for any address in a given source, and it sets `INCLUDES.author`. |
| `src/lib/ipfs.ts` | Loses `blocksToCAR`. |
| `src/lib/janus2DAG.ts`, `src/lib/remotes/nodeInfo.remote.ts` | Deleted. |
