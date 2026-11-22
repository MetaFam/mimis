# Data Model: Rename Spots

This builds on 004's [data-model.md](../004-candidate-contents/data-model.md). Only the changes are listed.

## Graph

### `MOUNT` (Spot → Spot), now in two forms

| Form | Properties | Meaning |
| --- | --- | --- |
| Layer | `order: Integer`, `createdAt`, `published?` | Unchanged. The target's entries merge into the Spot's listing (union mount). |
| **Link** (new) | `uuid: String`, `path: String`, `base: String`, `createdAt`, `published?` | A mount of another layer's link, `uuid`, listed as one entry named `path`. `base` is the lower link's `path` when the mount was made. |

- A link is told from a layer by `has('path')`. A link has no `order`, and a layer has no `path` or `uuid`.
- Its out-vertex is the user's Spot at the mounted link's parent path, made by `spotAt()` if it's missing. Its in-vertex is the mounted link's target Spot.
- `uuid` equals the mounted link's `uuid`. That link may be a `CONTAINS` or another user's link `MOUNT`.
- One Spot holds at most one link `MOUNT` per `uuid` (FR-012). A Spot may both layer-mount and link-mount the same target.
- A link `MOUNT` never confers ownership: `ownersOf()` doesn't follow `MOUNT`.

### `CONTAINS` (Spot → Spot)

Unchanged in shape. Its `uuid` is now documented as immutable (FR-011). `relinkSpot` already copies it on a move, and a rename changes `path` in place.

### Rules

| Rule | Where it's enforced |
| --- | --- |
| A visible link is the highest-precedence edge of its `uuid` among the layers at a path (FR-013) | `resolveSpots()` per segment; `assembleListing()` for children |
| Path-less `MOUNT`s are layers; path-bearing ones are entries | `withMounts()`, `precedence()`, `childrenOf()` |
| No clash in the user's own Spot: no other `CONTAINS` or link `MOUNT` with the new `path` (FR-006) | `renameSpot()`, `followMount()` |
| Names are trimmed, non-empty, not `.` or `..`, and contain no `/` (FR-007) | `validName()` |

## Derived: mount state

For a link `MOUNT` `m` with uuid `U` in Spot `P` at view path `p`:

| State | Condition | Shown |
| --- | --- | --- |
| **in place** | Some layer at `p` other than `P` has an edge with uuid `U` | `m` under its `path` |
| **moved** | `m`'s target has an incoming `CONTAINS` with uuid `U` from a Spot that isn't a layer at `p` | `m` under its `path`, marked; a notice |
| **orphaned** | No edge with uuid `U` reaches `m`'s target | `m` under its `path` (FR-014) |

The states change as follows:

- **in place → moved**: when the owner moves the link.
- **moved → in place**: when it moves back, which withdraws the notice.
- **moved → (gone)**: on Remove.
- **moved → in place**, at the new parent: on Follow.
- **moved → (replaced)**: on Keep as own, by a `CONTAINS` to a new Spot that layer-mounts the target.

## Notice (derived, returned by `notices`)

```ts
interface Notice {
  mount: string                 // the MOUNT edge id
  uuid: string                  // the mounted link's uuid
  name: string                  // the mount's path, as the user sees it
  from: Array<string>           // view path of the mount's Spot
  to: Array<string> | null      // view path of the link's new parent, or null if unreachable
  ownerPath: Array<string>      // the new parent's path in the owner's tree
  owner: string                 // the owner's address
}
```

## `Child` (listing)

The new field is `moved: boolean`, true when the highest-precedence edge behind this name is the user's own link `MOUNT` and it is moved. The other fields are unchanged.

## Publishing: `Fields` and fingerprints

```ts
type Fields =
  | { kind: 'CONTAINS', path: string, child: string }
  | { kind: 'MOUNT', target: string, creator?: string, order?: number }          // layer, or a proxy Content's
  | { kind: 'MOUNT', target: string, creator?: string, uuid: string, path: string }  // link (new)
  | { kind: 'AS', content: string, type: string, after?: string }
  | { kind: 'IS', uuid: string, cid: string, size: number, previous?: string }
```

| Entry | Key | Fingerprint |
| --- | --- | --- |
| Link `MOUNT` (new) | `uuid` | `[target, creator ?? null, path]` |
| Layer `MOUNT` | target Spot uuid | unchanged |

- A rename of a published link `MOUNT` or `CONTAINS` changes only the fingerprint, so it republishes under the same key (FR-018).
- `retire()` keys a link `MOUNT`'s `REMOVED` marker by `uuid`.
- `selection` pairs link `MOUNT` markers and entries by `uuid`, as moves of `CONTAINS` are paired.

## Published documents

See [contracts/documents.md](contracts/documents.md).
