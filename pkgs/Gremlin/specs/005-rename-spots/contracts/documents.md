# Contract: Published documents, revised

This revises 004's [contracts/documents.md](../../004-candidate-contents/contracts/documents.md). The `Update`, the signed typed data, the MST nodes, `contains`, `contents`, and Content versions are unchanged.

## `Spot` version: `mounts`

```ts
mounts?: Array<
  | { target: string, creator?: string, order: number }              // a layer; key: target (a Spot uuid)
  | { uuid: string, path: string, target: string, creator?: string } // a mounted link; key: uuid (the link's)
  | { tombstone: string }                                            // either key
>
```

- A mounted link names the link it mounts by that link's `uuid`. `target` is that link's target Spot uuid, and `creator` is the target's owner when it's outside the publisher's tree, lowercase `0x…`.
- Entries are sorted by key bytes, as before. The uuid keys of links and the Spot uuid keys of layers can't collide.
- An edited mounted link, such as a rename, is listed again under its `uuid` and replaces the earlier entry.

## First publish of a mounted link

When a Spot's pending changes include a mounted link that has never been published, the Update holds two versions of that Spot:

1. **Prelude**: `{ uuid, previous?: <the Spot's last published version>, mounts: [{ uuid, path: <base>, target, creator? }, …] }`. It holds one entry for each such link, under the name it had in the lower layer.
2. **Version**: `{ uuid, previous: <the prelude's last block>, … }`. It holds every changed entry, including those links under their current `path`.

The Update's `spots` MST points to the version. If every such link's `path` equals its `base`, there is no prelude. The first block of a never-published Spot carries `root: true` only if the Spot is the root, as before.

### Example

B renames S's `/image/hatz` to `hats`, and B's `image` Spot is new:

```text
spots MST: <B image uuid> → bafy…V
bafy…P (prelude) { uuid: <B image>, mounts: [{ uuid: <S's hatz link>, path: "hatz", target: <S hatz Spot>, creator: "0xs…" }] }
bafy…V (version) { uuid: <B image>, previous: bafy…P, mounts: [{ uuid: <S's hatz link>, path: "hats", target: <S hatz Spot>, creator: "0xs…" }] }
```

The root's version links `image` through `contains`, as for any new folder.

## Reading

In addition to 004's steps:

8. **Mounted links**: a `mounts` entry with a `path` lists `target`, from `creator`'s tree, as an entry named `path`. It is not a layer. Among the links a reader sees at one path that share a `uuid`, the one from the highest-precedence layer is shown.
9. **History**: following a Spot's `previous` chain shows a mounted link's earlier `path` values in order, starting with its prelude entry, which names the link as it was in the lower layer.
