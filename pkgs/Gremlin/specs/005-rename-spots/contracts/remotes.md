# Contract: Remotes and server functions

Every remote resolves the session address and runs in `inTransaction()`. Remotes rethrow `HttpError`s from the server functions and wrap anything else as `500`. Every thrown error below is raised in a server function, so it can be tested there.

## Commands

### `renameSpot({ path, from, to })`

`path: Array<string>` is the parent's view path. `from` and `to` are names. `to` passes `validName()`, using `v.check`.

The server function is `renames.renameSpot({ source, address, path, from, to, now })`. It returns `{ path: Array<string> }`, the renamed Spot's new view path.

| Error | When |
| --- | --- |
| `401` | No session |
| `400` `“…” isn’t a name: …` | `to` fails `validName()` (FR-007) |
| `404` `No entry named “from” at /path/` | Nothing visible has that name (stale menu) |
| `409` `/path/ already contains “to”` | The user's own Spot at `path` links another Spot as `to` (FR-006) |
| `409` `This Spot already mounts that link` | A second link `MOUNT` of one uuid in one Spot (FR-012). It can't arise through `renameSpot`, and is a guard. |

Renaming to the current name returns without writing (FR-008).

### `removeMount({ mount })`, `followMount({ mount })`, and `keepMount({ mount })`

`mount` is the edge id from a `Notice`. Each one asserts that the mount's Spot is the user's own (`assertOwned`, `403`).

| Function | Effect | Errors |
| --- | --- | --- |
| `removeMount` | `retire()` the mount | `404` if there is no such mount |
| `followMount` | Recompute the notice. Relink the mount onto `spotAt(notice.to)`, keeping `uuid`, `path`, and `base`. | `404` if there is no such mount; `409` if it isn't moved (the notice is stale); `400` if `to` is `null`; `409` on a clash at `to` |
| `keepMount` | New Spot plus `MOUNT{order: 0}` to the target, plus `CONTAINS{path, uuid: v7}` from the mount's Spot, then `retire()` the mount | `404` if there is no such mount |

Each returns `{ from: Array<string>, to: Array<string> | null }`, the full view paths before and after, for `relocate()`.

## Queries

### `notices()`

Returns `Array<Notice>` ([data-model.md](../data-model.md#notice-derived-returned-by-notices)) for the session user, sorted by `from` and then `name`. It's empty without a session.

### `listing({ path })`

Its shape is unchanged, plus `Child.moved`. It shadows links by uuid (FR-013) and lists link `MOUNT`s as entries.

## Server modules

| Module | Change |
| --- | --- |
| `server/listing.ts` | `resolveSpots()` replaces `resolvePath()` (R2). `listingAt()` replaces `listingTraversal()` for callers. `withMounts()` and `precedence()` skip link `MOUNT`s (R4). `childrenOf()` and `assembleListing()` shadow by uuid and mark `moved` (R3, R7). |
| `server/renames.ts` (new) | `renameSpot`, `noticesFor`, `removeMount`, `followMount`, `keepMount`, `viewPathOf` |
| `server/edits.ts` | `retire()` keys link `MOUNT`s by uuid. `unlinkSpot()` also retires a link `MOUNT` with that name, so deleting a renamed tile removes the rename. |
| `server/changes.ts` | Link `MOUNT` `Fields`, key, fingerprint, and the duplicate check (R10) |
| `server/selection.ts` | Pairs link `MOUNT` moves |
| `server/publish.ts` | Link `MOUNT` entries in `mounts`, and the prelude version (R6) |
| `server/rebuild.ts` | `Tree.linked: Array<{ uuid, path, target, creator? }>` |
| `server/fsEntries.ts` | `listEntries`, `statEntry`, and `spotTraversal` use `resolveSpots()` and `assembleListing()`'s children. `renameEntry()` calls `renameSpot()` once the extension check passes (FR-017). |
| `server/search.ts` | `startOf()` uses `resolveSpots()`. Descent and names include link `MOUNT`s. |
| `server/ranking.ts` | `layersAt()` uses `listingAt()` |
| `lib/names.ts` (new) | `validName()` |
