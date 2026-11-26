# Research: Rename Spots

Decisions are numbered R1–R12. Each gives the decision, why, and what else was weighed.

## R1. A mounted link is a `MOUNT` edge with a `path`

**Decision**: B's rename of S's link `U` is `B's Spot −MOUNT{uuid: U, path, base, parent, createdAt}→ S's target Spot`, from B's Spot at the parent's path. A `MOUNT` with a `path` is a link. A `MOUNT` without one is a layer, as now, with its `order`.

**Rationale**: This is the user's model: the mount of the edge, with `path` changed, its uuid the only immutable attribute. JanusGraph edges can't point at edges, but the uuid names the edge, and the target Spot is the same. One label keeps "mounting" one concept, so a mounted link is to links what 004's `Content −MOUNT→ Content` proxy is to Contents.

**Alternatives considered**:

- A `CONTAINS` edge with an `overrides` property. Rejected by the user ("it will be a mount of the edge"), and it would make B an owner of S's Spot (R9).
- Reifying links as vertices. Every traversal would gain a hop and every graph would need migrating.
- A new label such as `RELABELS`. A second word for mounting, with no behavior a `path` doesn't already distinguish.

## R2. Path resolution moves to JavaScript, one traversal per segment

**Decision**: `resolvePath()` (a single composed traversal) is replaced by `resolveSpots({ source, from, path })`, which is async and returns `Array<{ id, key }>`. For each segment, one traversal starts from the current Spots and does the following:

1. It expands each Spot into its layers (`withMounts`, following path-less `MOUNT`s only), with a precedence key relative to its start.
2. It aggregates the layers, then projects for each one:
   - its key;
   - its links named for the segment (`CONTAINS` or `MOUNT`, `has('path', segment)`), with their uuids and targets;
   - its links of any name whose uuid matches a mount's uuid among the aggregated layers.

In JavaScript, each candidate's full key is its start's key, then the relative key, then a segment boundary. A candidate survives only if no layer that outranks it holds an edge with the same uuid (FR-013). `listingAt()`, `fsEntries`, `search.startOf()`, and `ranking.layersAt()` start from the survivors with `source.V(...ids)` and add their keys as prefixes.

**Rationale**: Shadowing is decided by precedence, and precedence keys are compared lexicographically in JavaScript (`compareKeys`). Gremlin has no list comparison. For example, B can mount S above T, where T's mount of S's link must lose to S's own link. A single traversal can't drop a shadowed branch mid-walk without that comparison. Per-segment queries are small (one Spot set), and a path of depth *d* costs *d* + 1 round trips on a local socket.

**Alternatives considered**:

- "A mount always shadows the link it mounts, whatever the precedence." This is one traversal, but it breaks FR-013 when two layers both mount a link, or when the owner's layer outranks the mounter's.
- Resolving every branch unfiltered and filtering afterwards. The work grows with every mount along the path.

## R3. The listing shadows by uuid, highest layer first

**Decision**: `childrenOf()` projects every `CONTAINS` and path-bearing `MOUNT` with its `label`, `uuid`, `path`, and target. `assembleListing()` walks the layers in precedence order, keeps the first edge it sees for each uuid, and drops later ones before merging names. The result is then merged by name, as today. A `MOUNT` link's target lists its own Contents, entries, and layers exactly as a `CONTAINS` child does.

**Rationale**: The listing already fetches every layer's children with their keys, so FR-013 there is a set lookup. `Child` keeps its shape. A child gains `moved` (R7), and `parents` keeps saying which layer each id came from.

## R4. Precedence counts a mounted link as a segment

**Decision**: `precedence()` maps a `MOUNT` with a `path` to the segment boundary, like `CONTAINS`. Only a path-less `MOUNT` contributes its `order`. `withMounts()` follows `outE('MOUNT').hasNot('path')`.

**Rationale**: Without this, B's `image −MOUNT{path}→ hatz` would be taken as a layer of `/image/`, merging S's `hatz` entries into `/image/`'s listing.

## R5. Renaming is one server function for both layers

**Decision**: `renameSpot({ source, address, path, from, to, now })` in a new `src/lib/server/renames.ts` works as follows:

1. It validates `to` with the shared `validName()` (FR-007).
2. It resolves the layers at `path` (R2) and finds the visible edges named `from` (R3). If there are none, it throws `404`.
3. If `to === from`, it returns without changes (FR-008).
4. If the user's own Spot at `path` already links `to` through another edge, it throws `409` (FR-006).
5. For each visible edge:
   - one in a Spot the user owns, whether `CONTAINS` or `MOUNT`, gets `path = to` (FR-003);
   - any other gets a mount in `spotAt({ address, path })`, with that edge's uuid, its target, `path = to`, and `base = from` (FR-004, FR-005).

The `renameSpot` command and `fsEntries.renameEntry` both call it (FR-017).

**Rationale**: One code path keeps the app and the editor alike. `spotAt()` already makes the user's Spot and parents for 004's proxies. Changing `path` in place keeps the edge, its uuid, and its `published` mark, so 003's fingerprints turn it pending and republish it under its key (FR-018). A rename back to the published name matches the baseline again, with no new code.

## R6. The original name is recorded on the mount as `base`

**Decision**: A mount stores `base`, the lower link's path when the mount was made. When a mount has never been published, `prepare()` emits that Spot's change as two versions in one Update:

- a *prelude* version listing `{ uuid, path: base, target, creator }`;
- the regular version, whose `previous` is the prelude's last block, listing `{ uuid, path, … }` with everything else that changed.

If `path === base`, there is no prelude.

**Rationale**: This is the user's "mount in one commit, then the name change in another" (FR-020). Readers already fold a version chain oldest-first, replacing entries by key (`rebuild.fold`), and 003's chains (R18 there) already place several blocks of one Spot in one Update. So readers need no change, and the history shows the name before and after (SC-006). Reading S's current path at publish time instead would record whatever S renamed it to since, not what B renamed. One signature covers both, which two Updates wouldn't.

## R7. Move notices are derived, not stored

**Decision**: A mount is *moved* when three things hold:

- its target has an incoming `CONTAINS` with the mount's uuid (`target.inE('CONTAINS').has('uuid', U)`);
- that edge's out-vertex `uuid` isn't the mount's `parent`, the holder recorded when the mount was made;
- the mount sits in the user's own Spot.

If there's no such edge, the link was removed, and nothing is shown (FR-014). The checks are:

- `childrenOf()` projects `moved` for path-bearing `MOUNT`s, so the listing can mark the tile;
- the `notices` query walks the user's tree (`treeOf`) for mounts and checks each one;
- each notice's `to` is the user's view path to the new parent, found by walking up from it through `CONTAINS`, path-bearing `MOUNT`s, and layer `MOUNT`s to the user's root, shortest first, up to 20 steps;
- when no such path exists, `to` is `null`, Follow isn't offered, and `ownerPath` gives the new place in the owner's tree.

**Rationale**: `relinkSpot` keeps a link's uuid and target, so the moved link is always an incoming edge of the same Spot. That makes the lookup vertex-centric, with no global edge index. A derived notice is withdrawn when S moves the link back, and always names the latest place, with nothing to keep in sync (FR-022). S's transaction never writes into B's tree (Principle I). Comparing with the recorded parent, not the current layers, means unmounting the owner's layer isn't mistaken for a move, and `childrenOf()` needs no layer set to decide it.

**Alternatives considered**:

- Writing a `Notice` vertex during S's move. S's write would touch B's state, and it would need cleanup on every later move.
- A composite edge index on `uuid` for `g.E().has('uuid', U)`. Not needed, since the target is known.

## R8. Resolutions reuse the edit helpers

**Decision**: These go in `renames.ts`:

- **`removeMount`**: `retire()` the mount.
- **`followMount`**: copy the mount onto `spotAt(to)` with its uuid, `path`, and `base`, then retire the old one. It's a `relink()`, as `relinkSpot` does for `CONTAINS`. It throws `409` on a clash at the new place, and `400` when `to` is `null`.
- **`keepMount`**: make a Spot with a fresh uuid, add `Spot −MOUNT{order: 0}→ target`, add `CONTAINS{path, uuid: fresh}` from the mount's Spot, then retire the mount.

The commands `removeMount`, `followMount`, and `keepMount` wrap them.

**Rationale**: `retire()` already leaves a `REMOVED` marker for a published edge, so each removal publishes as a tombstone (FR-024). `relink()` already turns a move into a marker plus an edge with the same key, which `selection` pairs (R10).

## R9. "Keep as own" links to a new Spot of the user's, which mounts the target

**Decision**: The `CONTAINS` link that replaces the mount points to a new Spot of the user's, which layer-mounts the mount's target. It doesn't point at the target itself.

**Rationale**: `ownersOf()` walks `in('CONTAINS', 'WRITES', 'AS')` to a `User`. A `CONTAINS` from B's Spot to S's Spot would make B an owner of S's Spot and everything under it. `assertOwned()` would then let B edit S's tree, and `treeOf()` would publish S's Spots as B's. The extra Spot gives the same listing (FR-012 merges a layer's entries) and keeps both trees separate.

**Alternatives considered**: a direct `CONTAINS`, as the user's wording reads. It's rejected for the reasons above, and this is flagged for the user to confirm.

## R10. Entries, fingerprints, tombstones, and pairing learn the mounted link

**Decision**:

- **`changes.entriesOf()`**: a `MOUNT` with a `path` is keyed by its `uuid`. Its `Fields` are `{ kind: 'MOUNT', uuid, path, target, creator? }`, with no `order`, fingerprinted as `[target, creator, path]`. The "mounts twice" check counts layer mounts only, and a second mount of one uuid in one Spot throws (FR-012).
- **`edits.retire()`**: a `MOUNT` with a `uuid` uses it as the tombstone key.
- **`selection`**: pairs path-bearing `MOUNT` markers and entries by uuid, as it does for `CONTAINS`, so a Follow publishes both sides together.
- **`publish.prepare()`**: lists mounted links in the Spot version's `mounts` (R6).
- **`rebuild()`**: returns them as `Tree.linked`.

**Rationale**: `keyOf` in `updates.ts` already prefers `uuid` to `target`, and `rebuild.fold` already keys by `uuid ?? target`. So the published form needs one new entry shape and no new reader rule.

## R11. Names are validated once and shared

**Decision**: `src/lib/names.ts` exports `validName(name)`, which returns the trimmed name or throws `error(400, reason)`. It refuses empty names, `.`, `..`, and anything containing `/`. The client uses it to disable the dialog's confirm button and show the reason. `renameSpot` uses it, and the `RenameSchema` also checks it with `v.check`.

**Rationale**: FR-007 requires that an invalid name can't be confirmed. The client and server must agree, so one function serves both.

## R12. Panes follow a rename through a shared relocation

**Decision**: `src/lib/relocations.svelte.ts` exports `relocate({ from, to })`, which records the latest rename (`from` and `to` are full paths). It also exports `follow(path, relocation)`, which rewrites a path that starts with `from`. Each `FileView` has an `$effect` that rewrites its own `path` when the latest relocation covers it. `Breadcrumbs` and `FileBrowser` call `relocate` after a rename, a Follow, or a Keep, and refresh the parent's `listing`.

**Rationale**: The panes are sibling `FileView`s with their own `path`. One reactive value reaches all of them, without threading callbacks through `+page.svelte`. The first pane's `bind:path` already drives the URL, so the address follows too (FR-016).
