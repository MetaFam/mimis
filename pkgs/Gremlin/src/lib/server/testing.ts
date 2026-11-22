import gremlin from 'gremlin'
import * as dagCBOR from '@ipld/dag-cbor'
import { v7 as uuidV7 } from 'uuid'
import type { CID } from 'multiformats/cid'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import settings from '#lib/settings.svelte.js'
import { splitName, typeForName } from '#lib/mimetypes.js'
import { rank } from '#lib/rank.js'
import { cidFor, MAX_BLOCK } from '#lib/updates.js'
import type { Blocks } from '#lib/server/blocks.js'
import { entriesOf, treeOf } from '#lib/server/changes.js'
import { hold } from '#lib/server/edits.js'
import { byKey, type Tree as Snapshot } from '#lib/server/rebuild.js'
import { edgeAt, edgeId, g, writeAll } from '#lib/server/janusgraph.js'

const { statics: __, merge: Merge, t: T } = gremlin.process
type GraphTraversalSource = (
  InstanceType<typeof gremlin.process.GraphTraversalSource>
)
export type Id = string | number
export interface Tree { [name: string]: Tree }
export interface FileTree { [name: string]: FileTree | { file: string } }

// The Gremlin server refuses a request over 64 KiB, & a row with two
// uuids is about 100 bytes.
const BATCH = 250

/**
 * A transaction to seed & search in, & a rollback to undo it all, or,
 * for the one test that has to, a commit.
 */
export function transaction() {
  const { hostname } = new URL(settings.janusGraphURL)
  if(!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error(
      `Refusing to run graph tests against ${settings.janusGraphURL}.`
    )
  }
  const tx = g().tx()
  return {
    source: tx.begin(),
    rollback: () => tx.rollback(),
    commit: () => tx.commit(),
  }
}

const idOf = async (traversal: { next: () => Promise<{ value: unknown }> }) => {
  const { value } = await traversal.next()
  if(typeof value !== 'number' && typeof value !== 'string') {
    throw new Error(`Expected a vertex id, got ${JSON.stringify(value)}.`)
  }
  return value
}

export const addSpot = (source: GraphTraversalSource) => (
  idOf(source.addV('Spot').property('uuid', uuidV7()).id())
)

const addedOne = async (
  traversal: { next: () => Promise<{ value: unknown }> },
) => {
  const { value } = await traversal.next()
  if(Number(value) !== 1) {
    throw new Error(`Expected to add one edge, added ${value}.`)
  }
}

export const link = (
  source: GraphTraversalSource,
  { from, to, name }: { from: Id, to: Id, name: string },
) => (
  addedOne(
    source.V(from).addE('CONTAINS').to(__.V(to))
    .property('path', name)
    .property('uuid', uuidV7())
    .count()
  )
)

export const mount = (
  source: GraphTraversalSource,
  { from, to, order = 0 }: { from: Id, to: Id, order?: number },
) => (
  addedOne(
    source.V(from).addE('MOUNT').to(__.V(to)).property('order', order)
    .count()
  )
)

/**
 * Gives `to` a `Content` of `type`, backed by a `Blob`, ranked last.
 * `mounts` makes it a proxy of that Content instead, with no Blob.
 */
export async function attach(
  source: GraphTraversalSource,
  { to, type, cid, size = 1, mounts }:
  { to: Id, type: string, cid?: string, size?: number, mounts?: Id },
) {
  const createdAt = new Date().toISOString()
  let added = (
    source.addV('Content')
    .property('type', type)
    .property('uuid', uuidV7())
    .property('createdAt', createdAt)
    .as('content')
  )
  if(mounts != null) {
    added = added.addE('MOUNT').to(__.V(mounts)).property('createdAt', createdAt)
  } else {
    if(cid == null) throw new Error('A Content that isn’t a proxy needs a cid.')
    added = (
      added
      .addV('Blob')
      .property('cid', cid)
      .property('size', size)
      .property('createdAt', createdAt)
      .addE('IS')
      .from_('content')
      .property('uuid', uuidV7())
      .property('createdAt', createdAt)
    )
  }
  const { value } = await (
    added
    .project('content', 'link')
    .by(__.select('content').id())
    .by(__.id())
    .next()
  )
  const ids = value as Map<string, unknown>
  const content = ids.get('content') as Id
  const holding = await hold({ source, spot: to, content, now: createdAt })
  return {
    content,
    holding,
    ...(mounts == null ? { is: edgeId(ids.get('link')) } : { mount: edgeId(ids.get('link')) }),
  } as { content: Id, holding: string, is: string, mount: string }
}

/**
 * Grows `tree` under `root`. A `{ file: cid }` leaf, such as
 * `top.svg`, gives the Spot named by its title, `top`, a `Content`
 * of its type, as `addFiles` would. Ids by slash-joined path, with
 * the root at `''` & each Content at its file’s path.
 */
export async function seedTree(
  source: GraphTraversalSource,
  { root, tree }: { root: Id, tree: FileTree },
) {
  const ids = new Map<string, Id>([['', root]])
  const spotAt = async (parent: string, name: string) => {
    const at = parent ? `${parent}/${name}` : name
    if(!ids.has(at)) {
      const id = await addSpot(source)
      await link(source, { from: ids.get(parent)!, to: id, name })
      ids.set(at, id)
    }
    return at
  }
  const grow = async (branch: FileTree, parent: string) => {
    for(const [name, sub] of Object.entries(branch)) {
      const { file } = sub as { file?: unknown }
      if(typeof file === 'string') {
        const { title, ext } = splitName(name)
        const at = title === ext ? parent : await spotAt(parent, title)
        const { content } = await attach(source, {
          to: ids.get(at)!, type: typeForName(name), cid: file,
        })
        ids.set(parent ? `${parent}/${name}` : name, content)
      } else {
        await grow(sub as FileTree, await spotAt(parent, name))
      }
    }
  }
  await grow(tree, '')
  return ids
}

/**
 * Builds `tree` under a new root Spot. Its ids by slash-joined path,
 * with the root at `''`.
 */
export async function seed(source: GraphTraversalSource, tree: Tree) {
  return seedTree(source, { root: await addSpot(source), tree })
}

/** Adds a child Spot under `under` for each of `names`, in batches. */
export async function seedWide(
  source: GraphTraversalSource,
  { under, names }: { under: Id, names: Array<string> },
) {
  for(let start = 0; start < names.length; start += BATCH) {
    const batch = names.slice(start, start + BATCH).map((name) => (
      new Map([['name', name], ['spot', uuidV7()], ['link', uuidV7()]])
    ))
    const { value: added } = await (
      source.inject(batch)
      .unfold()
      .as('row')
      .addV('Spot')
      .property('uuid', __.select('row').select('spot'))
      .as('spot')
      .addE('CONTAINS')
      .from_(__.V(under))
      .to('spot')
      .property('path', __.select('row').select('name'))
      .property('uuid', __.select('row').select('link'))
      .count()
      .next()
    )
    if(Number(added) !== batch.length) {
      throw new Error(`Seeded ${added} of ${batch.length} Spots.`)
    }
  }
}

/**
 * `Users` → `User` → `Device` → `Updates`, & the `User`’s root, as
 * `base()` makes them, reusing `Users` if there is one.
 */
export async function seedUser(
  source: GraphTraversalSource, { address }: { address: string },
) {
  const createdAt = new Date().toISOString()
  const { value } = await (
    source
    .mergeV(new Map([[T.label, 'Users']]))
    .option(Merge.onCreate, { createdAt })
    .as('users')
    .addV('User')
    .property('address', address)
    .property('createdAt', createdAt)
    .as('user')
    .addE('INCLUDES')
    .from_('users')
    .property('author', address)
    .property('createdAt', createdAt)
    .addV('Device')
    .property('uuid', uuidV7())
    .property('createdAt', createdAt)
    .as('device')
    .addE('USES')
    .from_('user')
    .property('createdAt', createdAt)
    .addV('Updates')
    .property('createdAt', createdAt)
    .addE('COMMITS')
    .from_('device')
    .property('createdAt', createdAt)
    .addV('Spot')
    .property('uuid', uuidV7())
    .property('createdAt', createdAt)
    .as('root')
    .addE('WRITES')
    .from_('user')
    .project('user', 'device', 'root')
    .by(__.select('user').id())
    .by(__.select('device').id())
    .by(__.select('root').id())
    .next()
  )
  const ids = value as Map<'user' | 'device' | 'root', Id>
  return {
    user: ids.get('user')!, device: ids.get('device')!, root: ids.get('root')!,
  }
}

/** Drops `user` & everything it reaches by its own out-edges. */
export const dropUser = (
  source: GraphTraversalSource, { user }: { user: Id },
) => (
  source.V(user)
  .emit()
  .repeat(
    __.out('USES', 'COMMITS', 'SPANS', 'WRITES', 'CONTAINS', 'AS', 'IS')
    .dedup()
  )
  .dedup()
  .drop()
  .toList()
)

/**
 * Marks the Spots & the Contents they hold as published as they are
 * now, with a stand-in `cid` for each, so nothing in them is pending.
 */
export async function markPublished(
  source: GraphTraversalSource,
  { ids, address }: { ids: Array<Id>, address: string },
) {
  const { spots, contents } = await entriesOf({ source, ids, address })
  const writes = []
  for(const holder of [...spots.values(), ...contents.values()]) {
    const cid = await cidFor(dagCBOR.encode({ uuid: holder.uuid }))
    writes.push(__.V(holder.id).property('cid', cid.toString()))
    for(const { edge, fingerprint } of holder.entries) {
      writes.push(edgeAt(edge).property('published', fingerprint))
    }
    for(const { id } of holder.markers) writes.push(edgeAt(id).drop())
  }
  await writeAll(source, writes)
}

/** `Blocks` in memory, with the encodings Kubo would use. */
export function memoryBlocks({ failPin = false } = {}) {
  const store = new Map<string, Uint8Array>()
  const pins = new Set<string>()
  return {
    store,
    pins,
    async put(bytes: Uint8Array) {
      if(bytes.length > MAX_BLOCK) throw new Error('Block over 1 MiB.')
      const cid = await cidFor(bytes)
      store.set(cid.toString(), bytes)
      return cid
    },
    async get(cid: CID) {
      const bytes = store.get(cid.toString())
      if(!bytes) throw new Error(`Block ${cid} not found.`)
      return bytes
    },
    async pin(cid: CID) {
      if(failPin) throw new Error(`Pinning ${cid} failed.`)
      pins.add(cid.toString())
    },
    async unpin(cid: CID) {
      pins.delete(cid.toString())
    },
  } satisfies Blocks & Record<string, unknown>
}

export const testAccount = () => privateKeyToAccount(generatePrivateKey())

export const signUpdate = (
  account: ReturnType<typeof testAccount>,
  typedData: Parameters<ReturnType<typeof testAccount>['signTypedData']>[0],
) => (
  account.signTypedData(typedData)
)

/**
 * The tree under `root` as the graph holds it, by `CONTAINS` alone,
 * in the shape `rebuild()` gives, to compare the two.
 */
export async function snapshot(
  { source, root }: { source: GraphTraversalSource, root: Id },
) {
  const { value } = await (
    source.V(root).in_('WRITES').inE('INCLUDES').values('author').next()
  )
  const { spots, contents } = await treeOf({ source, address: value as string })
  const grow = (id: Id): Snapshot => {
    const tree: Snapshot = { contents: [], mounts: [], children: {} }
    for(const { fields, to } of spots.get(id)!.entries) {
      if(fields.kind === 'CONTAINS') {
        tree.children[fields.path] = grow(to)
      } else if(fields.kind === 'MOUNT') {
        const { target, creator, order } = fields
        tree.mounts.push({ target, ...(creator ? { creator } : {}), order: order! })
      } else if(fields.kind === 'AS') {
        const content = contents.get(to)!
        const held = content.entries.map(({ fields }) => fields)
        tree.contents.push({
          uuid: fields.content,
          type: fields.type,
          ...(fields.after == null ? {} : { after: fields.after }),
          blobs: held.flatMap((blob) => (
            blob.kind === 'IS' ? [{
              uuid: blob.uuid,
              cid: blob.cid,
              size: blob.size,
              ...(blob.previous == null ? {} : { previous: blob.previous }),
            }] : []
          )).sort(byKey(({ uuid }) => uuid)),
          mounts: held.flatMap((proxied) => (
            proxied.kind === 'MOUNT' ? [{
              target: proxied.target,
              ...(proxied.creator == null ? {} : { creator: proxied.creator }),
            }] : []
          )).sort(byKey(({ target }) => target)),
        })
      }
    }
    tree.contents = rank(tree.contents)
    tree.mounts.sort(byKey(({ target }) => target))
    return tree
  }
  return grow(root)
}
