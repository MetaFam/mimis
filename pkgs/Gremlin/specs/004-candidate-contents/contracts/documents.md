# Contract: Published documents, revised

This revises 003's [contracts/documents.md](../../003-publish-updates/contracts/documents.md). Its common rules, the `Update`, the signed typed data, and the MST nodes are unchanged.

## `Spot` version

`contents` entries no longer carry a numeric `order`:

```ts
contents?: Array<
  | { uuid: string, type: string, after?: string }  // after: the Content uuid ranked before it; absent for the first
  | { tombstone: string }                           // a Content uuid
>
```

- A Spot may list several Contents of one type.
- Moving a Content republishes, under their keys, only the entries whose `after` changed: at most three (FR-003).

## `Content` version

```ts
interface Content {
  uuid: string
  previous?: CID
  blobs?: Array<
    | { uuid: string, cid: CID, size: number, type: string, previous?: string }  // previous: the uuid of the representation it replaced
    | { tombstone: string }
  >
  mounts?: Array<                   // only on a proxy, which has no blobs
    | { target: string, creator?: string }  // target: a Content uuid; creator: 0x… lowercase, only outside the publisher's tree
    | { tombstone: string }                 // a target Content uuid
  >
}
```

- A Content is one candidate file. Its `blobs` are that file's versions, and a replaced version stays listed.
- 003's rule that "a Spot holds at most one Content of a type" no longer applies. Every `blobs` entry still has the Content's type.

## Reading

In addition to 003's steps:

5. **Rank**: order a Spot's current `contents` entries by `after`, as FR-005 describes. Entries whose `after` names no held Content come first, followers of the same entry are ordered by uuid, and entries left in a loop come last, by uuid.
6. **Current version**: of a Content's current `blobs`, those no other entry names as `previous`, and of those the one with the greatest `uuid`.
7. **Proxies**: a Content with a `mounts` entry shows the current version of the Content with uuid `target`, which belongs to `creator`'s tree.
