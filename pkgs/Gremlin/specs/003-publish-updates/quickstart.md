# Quickstart: Validating Publish Write-Layer Updates

## Prerequisites

- The local JanusGraph (`authed-janusgraph`) and Kubo (`localhost:5001`, 0.43+) are running, and `.env.local` points at them. The graph tests refuse to run unless `PUBLIC_JANUSGRAPH_URL` is on localhost (`transaction()` in `src/lib/server/testing.ts`).
- `pnpm install` has run. It adds `@atproto/repo` as a dev dependency for the MST cross-check.
- For the manual scenarios: a browser wallet with two accounts, `0xB0B…` and another.
- Existing data has been backfilled once: `node scripts/backfill-representations.ts`. It gives every `IS` edge a `uuid`, moves `Content.order` onto the `AS` edge (research.md R11), copies each `User`'s `address` onto its `INCLUDES` edge as `author` (R14), and makes `sequence` a `LOCK`-consistency key (R9). Running it again changes nothing.

## Automated

```sh
pnpm test:unit --run --project server   # graph, encoding, MST, signing, rebuild
pnpm test:unit --run --project client   # PublishDialog & the page menu
pnpm run lint && pnpm run check
```

Graph tests run inside `g().tx()` and roll back. The one exception is scenario 8 below, which must really commit and then deletes everything it made (plan.md, Complexity Tracking). Block tests use `memoryBlocks()` with real DAG-CBOR and sha2-256, and `blocks.test.ts` also runs against the local Kubo. Signing tests use viem `privateKeyToAccount` keys, so their signatures are real. Every error in [contracts/remotes.md](contracts/remotes.md) is raised by a server function and tested there (research.md R20).

| Test file | Proves |
| --- | --- |
| `src/lib/mst.test.ts` | Layers match atproto's `key_heights.json`; roots match `@atproto/repo` for the `example_keys.txt` sets and for 1, 2, and 1,000 keys; `get` finds each key and misses absent ones; the empty tree is `{l: null, e: []}` |
| `src/lib/updates.test.ts` | Encoding omits absent fields and sorts entries; equal versions get equal CIDs; Unicode and `/` names round-trip; a 10,000-entry version splits into a chain of blocks each ≤ 1 MiB, linked by `previous`, with `root` only on the first link (FR-032); a single oversized entry throws; `typedDataFor` → sign → recover gives the signer; altering `device`, `sequence`, `spots`, `contents`, or `previous` changes the recovered address, and altering `createdAt` or `comment` doesn't (SC-005); every malformed case in contracts/documents.md is rejected |
| `src/lib/server/blocks.test.ts` | Against the local Kubo (skipped otherwise): `put` returns the locally computed CID; a mismatched CID throws; `pin`, `pin` with `previous` (`pin.update`), and `unpin` work (research.md R21) |
| `src/lib/server/staging.test.ts` | `stageSpots` sets and clears `staged`, stages all pending Spots, refuses a Spot outside the user's tree (403) and one with nothing pending (400); `cleanStaged` clears only staged Spots with nothing pending (R19) |
| `src/lib/server/backfill.test.ts` | `backfillRepresentations` gives `IS` edges a `uuid`, moves `Content.order` onto `AS` as a number, sets `INCLUDES.author` from `User.address`, and changes nothing the second time; `assertLocalGraph` refuses a non-localhost URL without `remote` |
| `src/lib/server/auth.test.ts` | `seal`/`unseal` round-trip; a tampered token unseals to `null` |
| `src/lib/server/edits.test.ts` | `retire` drops unpublished edges and leaves markers for published ones, for all four kinds; `putRepresentation` replaces a blob in the same Content |
| `src/lib/server/changes.test.ts` | Pending detection for each kind of change; an edited published entry is pending under its old key; a child's new version doesn't make its parent pending; moving away and back cancels out; added-then-removed leaves nothing (FR-010); each malformed shape (an `IS` or `CONTAINS` without `uuid`, a non-numeric `order`, two same-type Contents on one Spot) throws |
| `src/lib/server/selection.test.ts` | US2-1 to US2-3, US3-1, US3-5, and the closure rules: new files come along while new folders wait, published children with changes don't, mounts aren't followed, and a Spot with two parents appears once |
| `src/lib/server/publish.test.ts` | US1-1 to US1-6, US3-1 to US3-4, US4-3, FR-014 to FR-016, FR-027, FR-032, SC-003, SC-004, and every prepare and commit error in contracts/remotes.md (details below) |
| `src/lib/server/received.test.ts` | US5-1 to US5-4, the 400 for an invalid CID, and the 504 for a missing block |
| `src/lib/server/rebuild.test.ts` | SC-007: five Updates mixing additions, moves, and removals; `rebuild(latest)` deep-equals `snapshot(root)` |
| `src/lib/server/moves.test.ts` | Moves still work, keep the uuid, and now leave a marker when the moved edge was published |
| `src/lib/server/publish.perf.test.ts` | SC-002: 1,000 pending Spots and Contents, prepare plus commit with a pre-made signature, in under 30 s (expected under 5 s) |

### Key scenarios in `publish.test.ts`

1. **First publish (US1-1)**: seed `/icon/hat/top.svg` on a device that has never published, stage everything, prepare, sign, and commit. Expect the following:
   - The Update has `sequence` 1 and no `previous`.
   - Its `spots` tree has exactly one key, `/`'s uuid, whose version has `root: true`, and its `contents` tree has exactly one key, `top.svg`'s Content.
   - Each of the four Spots and the Content has a `cid` equal to its version's CID, and `pendingSpots` is empty.
   - The Device has `sequence` 1 and `head` set to the Update's CID, and its `Updates` `SPANS` the Update (FR-027, US5-5).
2. **Incremental (US1-2)**: add `fedora.svg`, stage `hat/`, and publish. Expect `sequence` 2, `previous` = Update 1, `hat/` v2 with `previous` = v1 and only `fedora`'s entry, and a `spots` tree with only `hat/`. `/` and `icon/` keep their `cid`s.
3. **Comment (US1-3)**: the comment “hats” appears in the Update and isn't in the signed data.
4. **Cancel and failure (US1-4, FR-014)**: prepare and don't commit. Separately, commit with a `Blocks` whose `pin` throws. In both cases, no graph property changed, and staged Spots are still staged.
5. **Nothing staged (US1-5, FR-019)**: with unstaged changes only, prepare returns `nothing: true` and `put` was never called. With a staged Spot whose changes cancelled out, the same holds, and `cleanStaged` then leaves it unstaged (R19).
6. **Listings unchanged (US1-6, SC-003)**: `listing` rows for every path are equal before and after the publish.
7. **Concurrent changes (FR-015)**: between prepare and commit, add a file under a staged Spot, rename an entry being published, and move one away. After commit, all three are still pending. The moved one's old parent has a `REMOVED` marker with the published fingerprint.
8. **Two publishes at once (FR-016)**, in its own file, `publish.concurrent.test.ts`: on a throwaway user with a random address, committed for real, prepare twice for sequence 1, then run both through `commitInTransaction` in separate transactions. One succeeds. The other gets a 409 and its Update is unpinned. The Device has one Update. Afterward, everything under that user is deleted.
9. **Wrong account (US4-3)**: a signature from another key is refused with 403, and nothing is recorded or pinned.
10. **Removals (US3-2, US3-3, US3-4)**: on a Spot holding separate SVG and PNG Contents, retire the PNG Content's `AS` edge, then a mount. Expect one Spot version with a `contents` tombstone for the PNG Content and a `mounts` tombstone, and no Content version. An entry added and then retired before publishing appears nowhere.
11. **One file in a big tree (SC-004)**: in a seeded tree of 10,000 Spots marked published (each with a `uuid`, a `cid`, and `published` fingerprints, via `seedWide` and `markPublished` in `testing.ts`), replace one file's blob and publish. Expect one Content version, an empty `spots` tree, and no Spot `cid` changed.
12. **A wide new directory (FR-032)**: stage a new Spot with 10,000 children and publish. Expect its version to be a chain of two blocks, each ≤ 1 MiB, with the first's `previous` absent and the second's `previous` the first. Its parent's entry targets the second, and its vertex's `cid` is the second.
13. **Edited entry (FR-008)**: rename a published link, keeping its uuid. The parent's next version lists `{ uuid, path: <new>, target }` with the old uuid, and no tombstone.
14. **Empty Spot**: a new Spot with no children and no Content publishes a version with only `uuid`.
15. **Prepare errors**: a Spot with two `MOUNT`s to one target gives a 400 naming both. A `CONTAINS` cycle gives a 400. A single entry over 1 MiB gives a 400.

## Manual (in the app)

1. `pnpm dev`, sign in as `0xB0B…`, and create `/icon/hat/` with “Add Directory”. Import `top.svg` into it.
2. Open **Publish…**. `/`, `icon/`, `hat/`, and `top` are listed under **Not staged**, each marked “new”.
3. Press **Stage all**, type “hats” as the comment, and press **Publish**. The wallet shows typed data `Update` with `device`, `sequence: 1`, and two CIDs. Approve it.
4. The dialog shows “Published Update 1: bafy…”. Open the link and check that the gateway shows the DAG-CBOR Update, then follow `spots` to the root version, which has `root: true`.
5. Reopen **Publish…**: nothing is pending. Browse `/icon/hat/`: `top.svg` is still listed.
6. Switch the wallet to the other account and try to publish a new change. The dialog refuses, saying which account the wallet is connected as, and nothing is stored.
7. Decline a signature request. The dialog says “Publish cancelled.”, and the changes are still pending.
8. Paste the Update's address into **Record Update**. The log says “Already recorded.” (US5-5 recorded it at commit).
