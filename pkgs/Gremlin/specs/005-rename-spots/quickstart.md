# Quickstart: Validating Rename Spots

## Prerequisites

- The local JanusGraph and Kubo are running, as in 003's [quickstart.md](../003-publish-updates/quickstart.md#prerequisites).
- There's no migration: link `MOUNT`s are new edges, and existing layer `MOUNT`s have no `path`.
- For the manual scenarios: two wallet accounts, B and S, with B's root mounting S's root.

## Automated

```sh
pnpm test:unit --run --project server
pnpm test:unit --run --project client
pnpm run lint && pnpm run check
```

Graph tests run in a rolled-back `g().tx()`, seeding two users with `seedUser` and `seedTree`, and B's mount of S with `mount`. Publishing tests use `memoryBlocks()` and real signatures.

| Test file | Proves |
| --- | --- |
| `src/lib/names.test.ts` (new) | `validName` trims, accepts Unicode, emoji, combining marks, `?`, `#`, `%`, inner spaces, and case-only changes, and refuses `''`, `'   '`, `.`, `..`, and `a/b`, each with its reason (FR-007) |
| `src/lib/server/listing.test.ts` | `resolveSpots` follows link `MOUNT`s and drops a link shadowed by a higher layer's mount of its uuid. It keeps the owner's link when the owner's layer outranks a third user's mount, and gives the same keys as before for trees without link mounts. Listings show a link `MOUNT` as an entry, not a layer, and show one name per uuid; `moved` is set only for a moved own mount (FR-012 to FR-014). Every existing listing test still passes. |
| `src/lib/server/renames.test.ts` (new) | Stories 1, 2, 4, and 6, and the errors in [contracts/remotes.md](contracts/remotes.md). The details are below. |
| `src/lib/server/changes.test.ts` | A link `MOUNT`'s key, fields, and fingerprint. A rename of a published link `MOUNT` or `CONTAINS` is pending under its old key, and renaming back clears it. Two link mounts of one uuid in one Spot throw. A layer mount and a link mount of one target coexist. |
| `src/lib/server/edits.test.ts` | `retire` of a published link `MOUNT` leaves a marker keyed by uuid. `unlinkSpot` removes a link `MOUNT` by name. |
| `src/lib/server/selection.test.ts` | Follow's two halves are selected together |
| `src/lib/server/publish.test.ts` | Story 5: US5-1 is one entry under the link's uuid. US5-2 is a prelude plus a version, with `previous` linking them, the MST naming the version, and `creator` set to S. US5-3 is one entry. US5-5 has nothing to publish. There is no prelude when `path === base`. Remove, Follow, and Keep publish as FR-024 says. |
| `src/lib/server/rebuild.test.ts` | FR-021: after renames and the three resolutions, `rebuild(latest)` matches `snapshot(root)`, including `linked` |
| `src/lib/server/fsEntries.test.ts` | The editor's rename goes through `renameSpot`: the clash, the invalid name, and another layer's link all behave as in the app (FR-017). The editor's listing hides shadowed links. |
| `src/lib/server/search.test.ts` | A search under B's root finds `hats` and not `hatz` |
| `src/lib/server/moves.test.ts` | A move keeps the link's uuid, as it already does (FR-011) |
| `src/lib/components/RenameDialog.svelte.test.ts` (new) | Rename is disabled with the reason for each invalid name. Cancel and the unchanged name make no call. Success calls `onrenamed` with the new path. A refusal calls `onerror` (FR-007, FR-008, FR-010). |
| `src/lib/components/FileBrowser.svelte.test.ts` | The menu offers Rename only when signed in, in both views. A moved child shows the badge and Resolve move. |
| `src/lib/components/NoticesDialog.svelte.test.ts` (new) | It lists notices, disables Follow when `to` is `null`, and calls each command and then `relocate` |
| `src/lib/relocations.test.ts` (new) | `follow` rewrites paths under `from`, leaves others alone, and handles the root's direct children and deeper prefixes (FR-016) |

### Key scenarios in `renames.test.ts`

1. **Own rename (US1-1, US1-2)**: B's `/image/hatz/{top,bowler}`, renamed to `hats`. Its edge id and uuid are unchanged, its `path` is `hats`, and `/image/hats/` lists both entries.
2. **Other's rename (US2-1, US2-2)**: S's `/image/hatz/{top,bowler}`, mounted at B's root, renamed by B to `hats`. B's `image` Spot is created and holds exactly one link `MOUNT`, with S's uuid, `path` `hats`, and `base` `hatz`. B lists `hats` and not `hatz`, and S's snapshot is unchanged (SC-003).
3. **Shows through (US2-3 to US2-5)**: S adds `fedora`, then renames to `caps`, then deletes. B still sees `hats` each time, with `fedora`.
4. **Merged name (US2-6, FR-005)**: B's own `hat` and S's `hat` become one `cap`, which is B's `CONTAINS` renamed plus one link `MOUNT`.
5. **Rename again (US2-7)**: the mount's `path` changes, and no second mount is made.
6. **Refusals (US4)**: a clash gives `409`, an invalid name `400`, and a stale name `404`, each with the tree unchanged. The same name makes no write.
7. **Moved (US6-1, US6-2, US6-7)**: S moves `hatz` into `/old/`. `noticesFor(B)` gives one notice, with `from: ['image']`, `to: ['old']`, and `name: 'hats'`. A second move updates `to`, and moving back clears the notice.
8. **Resolutions (US6-3 to US6-5)**: each runs from a fresh seed.
   - **Remove**: `/old/` lists `hatz`.
   - **Follow**: `/old/` lists `hats` and `/image/` no longer does.
   - **Keep**: `/image/hats/` lists S's entries through a new Spot of B's, and `ownersOf(S's hatz)` is still only S.
9. **Unreachable**: S moves `hatz` outside what B mounts. `to` is `null`, `ownerPath` is set, and `followMount` gives `400`.
10. **Follow clash**: B's own `/old/hats` exists, so `followMount` gives `409` and the notice stays.

## Manual

1. Sign in as B, open `/image/`, and open `hatz`'s menu. Choose **Rename “hatz”…** and type `ha/ts`: the button is disabled and the reason shown. Type `hats` and confirm. The tile reads `hats` in both panes.
2. Open `/image/hats/` and rename its `hats/` breadcrumb to `caps`. The address and both panes read `/image/caps/`.
3. As S, open `/image/`: it still lists `hatz`.
4. As S, drag `hatz` onto an `/old/` folder. As B, reload: the `caps` tile has the ⚠ badge, and the actions menu shows **Moved links (1)**. Choose **Follow to /old/**: `/old/` lists `caps`.
5. As B, publish. In the log, open the Update and B's `old` Spot version, then its `previous`: the prelude names the link `hatz`, and the version names it `caps`. The mount was never published before it followed, so it publishes from `/old/` alone.
