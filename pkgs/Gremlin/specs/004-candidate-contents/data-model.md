# Data Model: Candidate Contents

This revises 003's [data-model.md](../003-publish-updates/data-model.md). Only what changes is listed here; everything else stands.

## Local graph

### Vertices

| Label | Change |
| --- | --- |
| `Content` | One candidate file. A Spot may hold several of one `type`. A **proxy** is a `Content` with one `MOUNT` out-edge and no `IS`: it has its target's `type` and shows its target's current Blob. |
| `Blob` | One version of a file. `cid`, `size`, and `createdAt` are overwritten in place while its `IS` is unpublished (FR-007). |

### Edges

| Label | From → To | Properties | Change |
| --- | --- | --- | --- |
| `AS` | `Spot` → `Content` | `after?`, `createdAt`, `published?` | `order` is gone. `after` is the uuid of the Content ranked before this one in the same Spot; the first has none. |
| `IS` | `Content` → `Blob` | `uuid`, `createdAt`, `published?` | A Content keeps every version's `IS`. A new version no longer retires the old one. |
| `PREVIOUS` | `Blob` → `Blob` | | New: from a version to the one it replaced. It's the only `PREVIOUS` (FR-010). |
| `MOUNT` | `Content` → `Content` | `createdAt`, `published?` | New: a proxy's one mount. It has no `order`. `MOUNT` between Spots keeps its `order` (FR-011). |

### Derived

- **Rank**: a Spot's `AS` edges in `after` order, as `rank()` in `src/lib/rank.ts` puts them: first those whose `after` the Spot doesn't hold, then each one's followers. Ties are broken by uuid, and Contents left in a loop come last (FR-005). Listings, the rebuild reader, and the snapshot helper all use it.
- **Current Blob**: of a Content's Blobs, those no other names as `PREVIOUS`, and of those the one whose `IS` uuid is greatest (FR-008). For a proxy, it's found through the `MOUNT`, up to 10 deep (FR-012).
- **Best Content of a type**: the first non-proxy Content of that type in rank order. Dropping a file and the editor write to it (FR-018, FR-019).
- **Merged listing**: the layers at a path, folded from the lowest precedence upward by `overlay()` in `src/lib/server/listing.ts` (FR-013).

### Writes

| Action | Graph change |
| --- | --- |
| Add a Content (`hold`) | `AS` with `after` = the last Content's uuid |
| Remove a Content (`release`) | The follower's `after` becomes the removed one's `after`; the `AS` is retired |
| Reorder (`arrange`) | Only the `AS` edges whose predecessor changes get a new `after` |
| New data, published current Blob | New `Blob` + `IS`, and `PREVIOUS` to the old Blob |
| New data, unpublished current Blob | The Blob's `cid`, `size`, and `createdAt` are replaced |
| Reorder another layer (`placeContent`) | Proxies, in the user's own Spot at the path, for the other layers' Contents the move passes over. If checking the merge rule shows that isn't enough, every other-layer Content listed gets a proxy. |

### Fingerprints

| Edge | Fingerprint fields | Published as |
| --- | --- | --- |
| `AS` | `Content.uuid`, `after` (or `null`), `Content.type` | Spot `contents` entry `{ uuid, type, after? }` |
| `IS` | `uuid`, `Blob.cid`, `Blob.size`, and the replaced representation's uuid when there is one | Content `blobs` entry `{ uuid, cid, size, type, previous? }` |
| `MOUNT` from a Content | target uuid, `creator` (or `null`) | Content `mounts` entry `{ target, creator? }` |

An `IS` with no `previous` keeps its 003 fingerprint, so representations published before this feature stay published. Every `AS` fingerprint changes, so after the migration every Spot holding Content is pending.

### Validation rules

- A Content with more than one `MOUNT`, or with a `MOUNT` and an `IS`, throws when its entries are read.
- A Blob with more than one `PREVIOUS` throws when its entry is read.
- 003's rule that a Spot holds at most one Content of a type is removed.

## Migration (FR-025)

`backfillRepresentations()` (run by `scripts/backfill-representations.ts`) now ranks each Spot's Contents by `after`, in the order listings showed them: ascending `order` (from `Content.order` if it's still there, else `AS.order`), then newest `createdAt` first, then uuid. It then drops both `order`s. Running it again changes nothing.

## Rebuilt tree

```ts
interface Tree {
  contents: Array<{                // in rank order
    uuid: string
    type: string
    after?: string
    blobs: Array<{ uuid: string, cid: string, size: number, previous?: string }>  // by uuid
    mounts: Array<{ target: string, creator?: string }>                          // by target
  }>
  mounts: Array<{ target: string, creator?: string, order: number }>
  children: Record<string, Tree>
}
```
