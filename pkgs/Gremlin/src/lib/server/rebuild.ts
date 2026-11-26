import * as dagCBOR from '@ipld/dag-cbor'
import type { CID } from 'multiformats/cid'
import { compareBytes, list } from '#lib/mst.js'
import { rank } from '#lib/rank.js'
import { validateUpdate } from '#lib/updates.js'
import type { Blocks } from '#lib/server/blocks.js'

export interface Tree {
  /** In rank order. */
  contents: Array<{
    uuid: string
    type: string
    after?: string
    blobs: Array<{ uuid: string, cid: string, size: number, previous?: string }>
    mounts: Array<{ target: string, creator?: string }>
  }>
  mounts: Array<{ target: string, creator?: string, order: number }>
  /** Mounted links, by the uuid of the link each mounts. */
  linked: Array<{ uuid: string, path: string, target: string, creator?: string }>
  children: Record<string, Tree>
}

const utf8 = new TextEncoder()
export const byKey = <T>(key: (item: T) => string) => (a: T, b: T) => (
  compareBytes(utf8.encode(key(a)), utf8.encode(key(b)))
)

type Entry = Record<string, unknown>
type Version = { uuid: string, previous?: CID, root?: true } & Record<string, unknown>

/**
 * The tree published by the Update chain ending at `head`, read from
 * blocks alone, as contracts/documents.md’s “Reading” describes.
 */
export async function rebuild(
  { head, blocks }: { head: CID, blocks: Pick<Blocks, 'get'> },
): Promise<Tree> {
  const cache = new Map<string, unknown>()
  const read = async <T>(cid: CID) => {
    const at = cid.toString()
    if(!cache.has(at)) cache.set(at, dagCBOR.decode(await blocks.get(cid)))
    return cache.get(at) as T
  }

  const chain = []
  for(let at: CID | undefined = head; at;) {
    const update = await validateUpdate(await read(at))
    chain.unshift({ cid: at, update })
    at = update.previous
  }
  const latest = { spots: new Map<string, CID>(), contents: new Map<string, CID>() }
  for(const { update } of chain) {
    for(const kind of ['spots', 'contents'] as const) {
      for(const [uuid, cid] of await list(update[kind], blocks)) {
        latest[kind].set(uuid, cid)
      }
    }
  }

  const [first] = chain
  const indexed = await list(first.update.spots, blocks)
  const unmarked = new Error(`No root in Update ${first.cid}.`)
  if(indexed.length !== 1) throw unmarked
  const [[rootUuid, rootVersion]] = indexed
  let oldest = await read<Version>(rootVersion)
  while(oldest.previous) oldest = await read<Version>(oldest.previous)
  if(oldest.root !== true) throw unmarked

  /** Each field’s entries by key, from the oldest version to `newest`. */
  const fold = async (newest: CID, fields: Array<string>) => {
    const versions: Array<Version> = []
    for(let at: CID | undefined = newest; at;) {
      const version: Version = await read<Version>(at)
      versions.unshift(version)
      at = version.previous
    }
    const state = new Map(fields.map((field) => [field, new Map<string, Entry>()]))
    for(const version of versions) {
      for(const field of fields) {
        for(const entry of (version[field] ?? []) as Array<Entry>) {
          const entries = state.get(field)!
          if('tombstone' in entry) {
            entries.delete(entry.tombstone as string)
          } else {
            entries.set((entry.uuid ?? entry.target) as string, entry)
          }
        }
      }
    }
    return (field: string) => [...state.get(field)!.values()]
  }

  const spotAt = async (uuid: string, target: CID): Promise<Tree> => {
    const entries = await fold(
      latest.spots.get(uuid) ?? target, ['contains', 'mounts', 'contents'],
    )
    const tree: Tree = { contents: [], mounts: [], linked: [], children: {} }
    for(const { uuid: content, type, after } of entries('contents')) {
      const newest = latest.contents.get(content as string)
      if(!newest) throw new Error(`No version of Content ${content}.`)
      const held = await fold(newest, ['blobs', 'mounts'])
      tree.contents.push({
        uuid: content as string,
        type: type as string,
        ...(after == null ? {} : { after: after as string }),
        blobs: (
          held('blobs')
          .map(({ uuid, cid, size, previous }) => ({
            uuid: uuid as string,
            cid: String(cid),
            size: size as number,
            ...(previous == null ? {} : { previous: previous as string }),
          }))
          .sort(byKey(({ uuid }) => uuid))
        ),
        mounts: (
          held('mounts')
          .map(({ target, creator }) => ({
            target: target as string,
            ...(creator == null ? {} : { creator: creator as string }),
          }))
          .sort(byKey(({ target }) => target))
        ),
      })
    }
    for(const { uuid, path, target: mounted, creator, order } of entries('mounts')) {
      const by = creator ? { creator: creator as string } : {}
      if(path == null) {
        tree.mounts.push({ target: mounted as string, ...by, order: order as number })
      } else {
        tree.linked.push({
          uuid: uuid as string, path: path as string, target: mounted as string, ...by,
        })
      }
    }
    for(const { path, target: child } of entries('contains')) {
      const { uuid: childUuid } = await read<Version>(child as CID)
      tree.children[path as string] = await spotAt(childUuid, child as CID)
    }
    tree.contents = rank(tree.contents)
    tree.mounts.sort(byKey(({ target }) => target))
    tree.linked.sort(byKey(({ uuid }) => uuid))
    return tree
  }

  return spotAt(rootUuid, rootVersion)
}
