import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import * as dagCBOR from '@ipld/dag-cbor'
import { v7 as uuidV7 } from 'uuid'
import { CID } from 'multiformats/cid'
import { cidFor, MAX_BLOCK, validateUpdate } from '#lib/updates.js'
import { list as mstEntries } from '#lib/mst.js'
import { commit, prepare, type Prepared } from '#lib/server/publish.js'
import { entriesOf, pendingSpots } from '#lib/server/changes.js'
import { putRepresentation, retire } from '#lib/server/edits.js'
import { edgeId } from '#lib/server/janusgraph.js'
import { listingAt } from '#lib/server/listing.js'
import { relinkSpot } from '#lib/server/moves.js'
import { rebuild } from '#lib/server/rebuild.js'
import {
  followMount, keepMount, noticesFor, removeMount, renameSpot,
} from '#lib/server/renames.js'
import { stageSpots } from '#lib/server/staging.js'
import {
  attach, link, addSpot, markPublished, memoryBlocks, mount, seedTree,
  seedUser, seedWide, signUpdate, snapshot, testAccount, transaction, type Id,
} from '#lib/server/testing.js'

const { statics: __ } = gremlin.process
type Source = ReturnType<typeof transaction>['source']
type Blocks = ReturnType<typeof memoryBlocks>
type Version = Record<string, unknown> & { uuid: string }

let source: Source
let rollback: () => Promise<void>
let account: ReturnType<typeof testAccount>
let address: string
let root: Id
let device: Id
const now = '2026-11-21T00:00:00.000Z'

const file = async (n: number | string) => (
  (await cidFor(dagCBOR.encode({ file: n }))).toString()
)

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  account = testAccount()
  address = account.address.toLowerCase()
  ;({ root, device } = await seedUser(source, { address }))
})

afterEach(async () => {
  await rollback()
})

const stageAll = () => stageSpots({ source, address, all: true })
const stage = (...ids: Array<Id>) => stageSpots({ source, address, ids, staged: true })
const sign = (
  { typedData }: Extract<Prepared, { nothing: false }>,
  by = account,
) => (
  signUpdate(by, {
    ...typedData,
    message: { ...typedData.message, sequence: BigInt(typedData.message.sequence) },
  })
)
const prepared = async (blocks: Blocks, comment?: string) => {
  const result = await prepare({ source, blocks, address, comment, now })
  if(result.nothing) throw new Error('Nothing was prepared.')
  return result
}
const publish = async (
  { blocks = memoryBlocks(), comment }: { blocks?: Blocks, comment?: string } = {},
) => {
  const ready = await prepared(blocks, comment)
  const result = await commit({
    source, blocks, address, plan: ready.plan, signature: await sign(ready), now,
  })
  return { ...result, ready, update: await validateUpdate(dagCBOR.decode(await blocks.get(CID.parse(result.cid)))) }
}
const read = async (blocks: Blocks, cid: CID | string) => (
  dagCBOR.decode(await blocks.get(typeof cid === 'string' ? CID.parse(cid) : cid)) as Version
)
const cidOf = async (id: Id) => (await source.V(id).values('cid').toList())[0] as string | undefined
const uuidOf = async (id: Id) => (await source.V(id).values('uuid').next()).value as string
const linkTarget = (version: Version, path: string) => (
  (version.contains as Array<{ path: string, target: CID }>).find((entry) => entry.path === path)!.target
)

/** Every `cid`, `published`, & `staged` in the user’s tree. */
const marks = async () => (
  source.V(root)
  .emit().repeat(__.out('CONTAINS', 'AS').dedup())
  .dedup()
  .project('id', 'cid', 'staged', 'edges')
  .by(__.id())
  .by(__.values('cid').fold())
  .by(__.values('staged').fold())
  .by(__.outE().project('label', 'published').by(__.label()).by(__.values('published').fold()).fold())
  .toList()
)

describe('a first publish (US1-1)', () => {
  let ids: Map<string, Id>
  beforeEach(async () => {
    ids = await seedTree(source, { root, tree: { icon: { hat: { 'top.svg': { file: await file('top') } } } } })
    await stageAll()
  })

  it('publishes the whole tree as sequence 1, indexed by its root', async () => {
    const blocks = memoryBlocks()
    const { cid, sequence, update } = await publish({ blocks })
    expect(sequence).toBe(1)
    expect(update).toMatchObject({ sequence: 1 })
    expect(update.previous).toBeUndefined()

    const spots = await mstEntries(update.spots, blocks)
    expect(spots.map(([key]) => key)).toEqual([await uuidOf(root)])
    const rootVersion = await read(blocks, spots[0][1])
    expect(rootVersion).toMatchObject({ uuid: await uuidOf(root), root: true })

    const contents = await mstEntries(update.contents, blocks)
    const content = ids.get('icon/hat/top.svg')!
    expect(contents.map(([key]) => key)).toEqual([await uuidOf(content)])

    const icon = linkTarget(rootVersion, 'icon')
    const hat = linkTarget(await read(blocks, icon), 'hat')
    const top = linkTarget(await read(blocks, hat), 'top')
    expect(await read(blocks, top)).toEqual({
      uuid: await uuidOf(ids.get('icon/hat/top')!),
      contents: [{ uuid: await uuidOf(content), type: 'image/svg+xml' }],
    })
    const contentVersion = await read(blocks, contents[0][1])
    expect(contentVersion).toEqual({
      uuid: await uuidOf(content),
      blobs: [{
        uuid: expect.any(String), cid: CID.parse(await file('top')), size: 1, type: 'image/svg+xml',
      }],
    })

    expect(await cidOf(root)).toBe(spots[0][1].toString())
    expect(await cidOf(ids.get('icon')!)).toBe(icon.toString())
    expect(await cidOf(ids.get('icon/hat')!)).toBe(hat.toString())
    expect(await cidOf(ids.get('icon/hat/top')!)).toBe(top.toString())
    expect(await cidOf(content)).toBe(contents[0][1].toString())
    expect(await pendingSpots({ source, address })).toEqual([])

    expect(blocks.pins.has(cid)).toBe(true)
    const deviceRow = (await source.V(device).valueMap('sequence', 'head').next()).value as Map<string, Array<unknown>>
    expect(Object.fromEntries([...deviceRow].map(([key, [value]]) => [key, value])))
    .toEqual({ sequence: 1, head: cid })
    expect(await (
      source.V(device).out('COMMITS').out('SPANS').hasLabel('Update')
      .project('cid', 'sequence', 'digest').by('cid').by('sequence').by('digest')
      .toList()
    )).toEqual([new Map<string, unknown>([['cid', cid], ['sequence', 1], ['digest', expect.stringMatching(/^0x[0-9a-f]{64}$/)]])])
  })

  it('carries the comment, unsigned (US1-3)', async () => {
    const { update, ready } = await publish({ comment: 'hats' })
    expect(update.comment).toBe('hats')
    expect(JSON.stringify(ready.typedData)).not.toContain('hats')
  })

  it('stores every listed version', async () => {
    const blocks = memoryBlocks()
    const { update } = await publish({ blocks })
    for(const tree of [update.spots, update.contents]) {
      for(const [, version] of await mstEntries(tree, blocks)) {
        expect(blocks.store.has(version.toString())).toBe(true)
      }
    }
  })

  it('leaves every listing as it was (US1-6, SC-003)', async () => {
    const listings = async () => Promise.all(
      [[], ['icon'], ['icon', 'hat'], ['icon', 'hat', 'top']].map(async (path) => (
        await listingAt({ source, from: source.V(root), path })
      ))
    )
    const before = await listings()
    await publish()
    expect(await listings()).toEqual(before)
  })

  it('publishes again from the last Update (US1-2)', async () => {
    const blocks = memoryBlocks()
    const first = await publish({ blocks })
    const hatV1 = await cidOf(ids.get('icon/hat')!)
    const [rootV1, iconV1] = [await cidOf(root), await cidOf(ids.get('icon')!)]

    const added = await seedTree(source, { root: ids.get('icon/hat')!, tree: { 'fedora.svg': { file: await file('fedora') } } })
    await stage(ids.get('icon/hat')!)
    const second = await publish({ blocks })
    expect(second.sequence).toBe(2)
    expect(second.update.previous?.toString()).toBe(first.cid)

    const spots = await mstEntries(second.update.spots, blocks)
    expect(spots.map(([key]) => key)).toEqual([await uuidOf(ids.get('icon/hat')!)])
    const hatV2 = await read(blocks, spots[0][1])
    expect((hatV2.previous as CID).toString()).toBe(hatV1)
    expect((hatV2.contains as Array<{ path: string }>).map(({ path }) => path)).toEqual(['fedora'])
    expect(await read(blocks, linkTarget(hatV2, 'fedora'))).toMatchObject({ uuid: await uuidOf(added.get('fedora')!) })
    expect(await cidOf(root)).toBe(rootV1)
    expect(await cidOf(ids.get('icon')!)).toBe(iconV1)
  })
})

describe('cancelling & failing (US1-4, FR-014)', () => {
  beforeEach(async () => {
    await seedTree(source, { root, tree: { a: { s: {} }, b: {} } })
    await stageAll()
  })

  it('changes nothing on prepare alone', async () => {
    const before = await marks()
    await prepared(memoryBlocks())
    expect(await marks()).toEqual(before)
  })

  it('changes nothing when storing the Update fails, with a 502', async () => {
    const before = await marks()
    const blocks = memoryBlocks({ failPin: true })
    const ready = await prepared(blocks)
    await expect(commit({ source, blocks, address, plan: ready.plan, signature: await sign(ready), now }))
    .rejects.toMatchObject({ status: 502, body: { message: expect.stringMatching(/^Storing the Update failed: Pinning \w+ failed\.$/) } })
    expect(await marks()).toEqual(before)
  })
})

describe('nothing to publish (US1-5, FR-019)', () => {
  it('stores nothing when only unstaged changes are pending', async () => {
    await seedTree(source, { root, tree: { a: {} } })
    const blocks = memoryBlocks()
    expect(await prepare({ source, blocks, address, now })).toEqual({ nothing: true, clean: [] })
    expect(blocks.store.size).toBe(0)
  })

  it('stores nothing for a staged Spot whose changes cancelled out, & cleans it', async () => {
    const ids = await seedTree(source, { root, tree: { a: { s: {} } } })
    await markPublished(source, { ids: [root, ids.get('a')!, ids.get('a/s')!], address })
    const edge = edgeId((await source.V(ids.get('a')!).outE('CONTAINS').id().next()).value)
    const other = await addSpot(source)
    await link(source, { from: root, to: other, name: 'other' })
    await relinkSpot({ source, what: ids.get('a/s')!, from: ids.get('a')!, to: other, now, uuid: uuidV7() })
    await stage(ids.get('a')!)
    await relinkSpot({ source, what: ids.get('a/s')!, from: other, to: ids.get('a')!, now, uuid: uuidV7() })
    expect(await source.E(edge).hasNext()).toBe(false)
    await source.V(root).outE('CONTAINS').where(__.inV().hasId(other)).drop().toList()

    const blocks = memoryBlocks()
    expect(await prepare({ source, blocks, address, now })).toEqual({ nothing: true, clean: [ids.get('a')] })
    expect(blocks.store.size).toBe(0)
  })
})

describe('changes made during a publish (FR-015)', () => {
  it('stay pending afterwards', async () => {
    const ids = await seedTree(source, { root, tree: { a: { s: {} }, b: {} } })
    await stageAll()
    const blocks = memoryBlocks()
    const ready = await prepared(blocks)
    const sLink = await uuidOf(ids.get('a/s')!)

    await attach(source, { to: ids.get('b')!, type: 'text/plain', cid: await file('late') })
    await source.V(root).outE('CONTAINS').has('path', 'a').property('path', 'renamed').toList()
    const moved = (await source.V(ids.get('a')!).outE('CONTAINS').values('uuid').next()).value as string
    await relinkSpot({ source, what: ids.get('a/s')!, from: ids.get('a')!, to: ids.get('b')!, now, uuid: uuidV7() })

    await commit({ source, blocks, address, plan: ready.plan, signature: await sign(ready), now })
    const pending = (await pendingSpots({ source, address })).map(({ id }) => id).sort()
    expect(pending).toEqual([root, ids.get('a')!, ids.get('b')!].sort())
    expect(await (
      source.V(ids.get('a')!).outE('REMOVED')
      .project('kind', 'entry', 'published').by('kind').by('entry').by('published')
      .toList()
    )).toEqual([new Map([['kind', 'CONTAINS'], ['entry', moved], ['published', JSON.stringify(['s', sLink])]])])
  })
})

describe('one file in a big tree (SC-004)', () => {
  it('publishes one Content version & no Spot version', { timeout: 300_000 }, async () => {
    const ids = await seedTree(source, { root, tree: { big: {}, icon: { 'top.svg': { file: await file('v1') } } } })
    await seedWide(source, { under: ids.get('big')!, names: Array.from({ length: 10_000 }, (_, i) => `n${i}`) })
    const all = await source.V(root).emit().repeat(__.out('CONTAINS')).id().toList() as Array<Id>
    expect(all).toHaveLength(10_004)
    await markPublished(source, { ids: all, address })
    const cids = async () => source.V(...all.slice(0, 500)).values('cid').toList()
    const before = await cids()

    await putRepresentation({ source, spot: ids.get('icon/top')!, type: 'image/svg+xml', cid: await file('v2'), size: 2, now })
    await stage(ids.get('icon/top')!)
    const blocks = memoryBlocks()
    const { update } = await publish({ blocks })
    expect(await mstEntries(update.spots, blocks)).toEqual([])
    const contents = await mstEntries(update.contents, blocks)
    expect(contents.map(([key]) => key)).toEqual([await uuidOf(ids.get('icon/top.svg')!)])
    const version = await read(blocks, contents[0][1])
    const v1 = await file('v1')
    const [{ key: replaced }] = (await entriesOf({ source, ids: [ids.get('icon/top')!], address }))
    .contents.get(ids.get('icon/top.svg')!)!.entries.filter(({ fields }) => (
      fields.kind === 'IS' && fields.cid === v1
    ))
    expect(version.blobs).toEqual([
      expect.objectContaining({ cid: CID.parse(await file('v2')), previous: replaced }),
    ])
    expect(await cids()).toEqual(before)
  })
})

describe('a wide new directory (FR-032)', () => {
  it('publishes a chain of two blocks', { timeout: 300_000 }, async () => {
    const ids = await seedTree(source, { root, tree: { wide: {} } })
    const names = Array.from({ length: 10_000 }, (_, i) => `child-${String(i).padStart(5, '0')}`)
    await seedWide(source, { under: ids.get('wide')!, names })
    await stageAll()
    const blocks = memoryBlocks()
    const { update } = await publish({ blocks })

    const rootVersion = await read(blocks, (await mstEntries(update.spots, blocks))[0][1])
    const last = linkTarget(rootVersion, 'wide')
    const second = blocks.store.get(last.toString())!
    const secondVersion = dagCBOR.decode(second) as Version
    const first = secondVersion.previous as CID
    const firstVersion = await read(blocks, first)
    expect(firstVersion.previous).toBeUndefined()
    expect(blocks.store.get(first.toString())!.length).toBeLessThanOrEqual(MAX_BLOCK)
    expect(second.length).toBeLessThanOrEqual(MAX_BLOCK)
    expect(await cidOf(ids.get('wide')!)).toBe(last.toString())

    const children = [firstVersion, secondVersion].flatMap(({ contains }) => (
      (contains as Array<{ path: string }>).map(({ path }) => path)
    ))
    expect(children.sort()).toEqual(names)
  })
})

describe('an empty Spot', () => {
  it('publishes as its uuid alone', async () => {
    const ids = await seedTree(source, { root, tree: { empty: {} } })
    await stageAll()
    const blocks = memoryBlocks()
    const { update } = await publish({ blocks })
    const rootVersion = await read(blocks, (await mstEntries(update.spots, blocks))[0][1])
    expect(await read(blocks, linkTarget(rootVersion, 'empty')))
    .toEqual({ uuid: await uuidOf(ids.get('empty')!) })
  })
})

describe('prepare errors', () => {
  it('refuses a CONTAINS cycle with a 400', async () => {
    const ids = await seedTree(source, { root, tree: { a: { b: {} } } })
    await link(source, { from: ids.get('a/b')!, to: ids.get('a')!, name: 'loop' })
    await stageAll()
    await expect(prepare({ source, blocks: memoryBlocks(), address, now })).rejects.toMatchObject({
      status: 400, body: { message: expect.stringMatching(/^CONTAINS cycle at Spot #\d+\.$/) },
    })
  })
})

describe('commit errors', () => {
  let blocks: Blocks
  let ready: Extract<Prepared, { nothing: false }>
  beforeEach(async () => {
    await seedTree(source, { root, tree: { a: {} } })
    await stageAll()
    blocks = memoryBlocks()
    ready = await prepared(blocks)
  })

  it('refuses a tampered plan with a 400', async () => {
    const plan = ready.plan.replace(/"sequence":1/, '"sequence":2')
    await expect(commit({ source, blocks, address, plan, signature: await sign(ready), now }))
    .rejects.toMatchObject({ status: 400, body: { message: 'That publish plan isn’t valid.' } })
  })

  it('refuses another address’s plan with a 400', async () => {
    const other = testAccount()
    await expect(commit({
      source, blocks, address: other.address.toLowerCase(), plan: ready.plan, signature: await sign(ready, other), now,
    }))
    .rejects.toMatchObject({ status: 400, body: { message: 'That publish plan isn’t valid.' } })
  })

  it('refuses an expired plan with a 410', async () => {
    const later = new Date(Date.parse(now) + 10 * 60_000 + 1).toISOString()
    await expect(commit({ source, blocks, address, plan: ready.plan, signature: await sign(ready), now: later }))
    .rejects.toMatchObject({ status: 410, body: { message: 'That publish expired; publish again.' } })
  })

  it('refuses another account’s signature with a 403, pinning nothing', async () => {
    const other = testAccount()
    await expect(commit({ source, blocks, address, plan: ready.plan, signature: await sign(ready, other), now }))
    .rejects.toMatchObject({
      status: 403,
      body: { message: `The signature is from ${other.address.toLowerCase()}, not ${address}.` },
    })
    expect(blocks.pins.size).toBe(0)
  })

  it('refuses an unrecoverable signature with a 400', async () => {
    await expect(commit({ source, blocks, address, plan: ready.plan, signature: `0x${'00'.repeat(64)}1b`, now }))
    .rejects.toMatchObject({ status: 400, body: { message: 'That signature can’t be recovered.' } })
  })

  it('refuses a stale sequence with a 409, unpinning the Update', async () => {
    await source.V(device).property('sequence', 1).toList()
    await expect(commit({ source, blocks, address, plan: ready.plan, signature: await sign(ready), now }))
    .rejects.toMatchObject({ status: 409, body: { message: 'Another publish finished first; publish again.' } })
    expect(blocks.pins.size).toBe(0)
    expect(await source.V(device).out('COMMITS').out('SPANS').hasNext()).toBe(false)
  })
})


describe('partial', () => {
  let ids: Map<string, Id>
  beforeEach(async () => {
    ids = await seedTree(source, { root, tree: { a: {}, b: {} } })
    await stageAll()
    await publish()
    ids = new Map([...ids, ...await seedTree(source, { root: ids.get('a')!, tree: { one: {}, other: {} } })])
    ids = new Map([...ids, ...await seedTree(source, { root: ids.get('b')!, tree: { two: {} } })])
  })

  it('publishes a staged Spot & its parent’s entry for it, alone (US2-1)', async () => {
    const before = await cidOf(ids.get('a')!)
    await stage(ids.get('one')!)
    const blocks = memoryBlocks()
    const { update, ready } = await publish({ blocks })
    expect(await cidOf(ids.get('a')!)).not.toBe(before)
    const [[key, version]] = await mstEntries(update.spots, blocks)
    expect(key).toBe(await uuidOf(ids.get('a')!))
    expect(((await read(blocks, version)).contains as Array<{ path: string }>).map(({ path }) => path))
    .toEqual(['one'])
    expect(ready.included).toEqual([{ path: ['a'], reason: 'connect' }])
    const pending = await pendingSpots({ source, address })
    // A new folder’s link is the folder’s change, not its parent’s.
    expect(pending.map(({ id }) => id).sort()).toEqual([ids.get('two')!, ids.get('other')!].sort())
    expect(pending.every(({ staged }) => !staged)).toBe(true)
  })

  it('publishes only what is still staged (US2-4)', async () => {
    await stage(ids.get('one')!, ids.get('two')!)
    await stageSpots({ source, address, ids: [ids.get('one')!], staged: false })
    const blocks = memoryBlocks()
    const { update } = await publish({ blocks })
    expect((await mstEntries(update.spots, blocks)).map(([key]) => key))
    .toEqual([await uuidOf(ids.get('b')!)])
    expect(await cidOf(ids.get('one')!)).toBeUndefined()
    expect(await cidOf(ids.get('two')!)).toEqual(expect.any(String))
  })

  it('splits pending Spots into staged & not (US2-5)', async () => {
    await stage(ids.get('one')!)
    const pending = await pendingSpots({ source, address })
    expect(pending.filter(({ staged }) => staged).map(({ id }) => id)).toEqual([ids.get('one')])
    expect(pending.filter(({ staged }) => !staged).map(({ id }) => id).sort())
    .toEqual([ids.get('other')!, ids.get('two')!].sort())
  })

  it('publishes a staged folder’s new files, & leaves its new folders for later (FR-030)', async () => {
    ids = new Map([...ids, ...await seedTree(source, {
      root: ids.get('a')!, tree: { 'note.txt': { file: await file('note') } },
    })])
    await stage(ids.get('a')!)
    const blocks = memoryBlocks()
    const contained = async () => (
      ((await read(blocks, (await cidOf(ids.get('a')!))!)).contains as Array<{ path: string }>)
      .map(({ path }) => path)
    )
    const { ready } = await publish({ blocks })
    expect(await contained()).toEqual(['note'])
    expect(ready.included).toEqual([{ path: ['a', 'note'], reason: 'new' }])
    expect((await pendingSpots({ source, address })).map(({ path }) => path.join('/')))
    .toEqual(['a/one', 'a/other', 'b/two'])

    await stage(ids.get('one')!)
    await publish({ blocks })
    expect(await contained()).toEqual(['one'])
  })
})

describe('removals', () => {
  let ids: Map<string, Id>
  let blocks: Blocks
  const versionOf = async (id: Id) => read(blocks, (await cidOf(id))!)
  const linkOf = async (from: Id, to: Id) => (
    edgeId((await source.V(from).outE('CONTAINS').where(__.inV().hasId(to)).id().next()).value)
  )
  const linkUuid = async (edge: string) => (await source.E(edge).values('uuid').next()).value as string

  beforeEach(async () => {
    ids = await seedTree(source, {
      root,
      tree: {
        a: { s: {} },
        b: {},
        pic: { 'pic.svg': { file: await file('svg') }, 'pic.png': { file: await file('png') } },
      },
    })
    await stageAll()
    blocks = memoryBlocks()
    await publish({ blocks })
  })

  it('publishes a move as a tombstone & an entry, & no version of what moved (US3-1)', async () => {
    const edge = await linkOf(ids.get('a')!, ids.get('a/s')!)
    const uuid = await linkUuid(edge)
    const s = await cidOf(ids.get('a/s')!)
    await relinkSpot({ source, what: ids.get('a/s')!, from: ids.get('a')!, to: ids.get('b')!, now, uuid: uuidV7() })
    await stage(ids.get('a')!)
    const { update } = await publish({ blocks })
    expect((await versionOf(ids.get('a')!)).contains).toEqual([{ tombstone: uuid }])
    expect((await versionOf(ids.get('b')!)).contains).toEqual([{ uuid, path: 's', target: CID.parse(s!) }])
    expect(await cidOf(ids.get('a/s')!)).toBe(s)
    expect((await mstEntries(update.spots, blocks)).map(([key]) => key).sort())
    .toEqual([await uuidOf(ids.get('a')!), await uuidOf(ids.get('b')!)].sort())
  })

  it('publishes a removed Content as a tombstone, & no Content version (US3-2)', async () => {
    const png = ids.get('pic/pic.png')!
    const edge = edgeId((await source.V(ids.get('pic/pic')!).outE('AS').where(__.inV().hasId(png)).id().next()).value)
    await retire({ source, edge, now })
    await stage(ids.get('pic/pic')!)
    const { update } = await publish({ blocks })
    expect((await versionOf(ids.get('pic/pic')!)).contents).toEqual([{ tombstone: await uuidOf(png) }])
    expect(await mstEntries(update.contents, blocks)).toEqual([])
  })

  it('publishes a removed mount as a tombstone keyed by its target (US3-3)', async () => {
    await mount(source, { from: ids.get('a')!, to: ids.get('b')!, order: 1 })
    await stage(ids.get('a')!)
    await publish({ blocks })
    expect((await versionOf(ids.get('a')!)).mounts).toEqual([{ target: await uuidOf(ids.get('b')!), order: 1 }])
    await retire({ source, edge: edgeId((await source.V(ids.get('a')!).outE('MOUNT').id().next()).value), now })
    await stage(ids.get('a')!)
    await publish({ blocks })
    expect((await versionOf(ids.get('a')!)).mounts).toEqual([{ tombstone: await uuidOf(ids.get('b')!) }])
  })

  it('publishes nothing of an entry added & removed in between (US3-4)', async () => {
    const brief = await addSpot(source)
    await link(source, { from: ids.get('b')!, to: brief, name: 'brief' })
    await retire({ source, edge: await linkOf(ids.get('b')!, brief), now })
    await link(source, { from: ids.get('a')!, to: await addSpot(source), name: 'kept' })
    await stageAll()
    await publish({ blocks })
    expect((await versionOf(ids.get('a')!)).contains).toEqual([
      expect.objectContaining({ path: 'kept' }),
    ])
    expect(await cidOf(brief)).toBeUndefined()
  })

  it('publishes a renamed link under its own key, with no tombstone (FR-008)', async () => {
    const edge = await linkOf(ids.get('a')!, ids.get('a/s')!)
    await source.E(edge).property('path', 'σοφία').toList()
    await stage(ids.get('a')!)
    await publish({ blocks })
    expect((await versionOf(ids.get('a')!)).contains).toEqual([
      { uuid: await linkUuid(edge), path: 'σοφία', target: CID.parse((await cidOf(ids.get('a/s')!))!) },
    ])
  })

  it('tombstones only the link removed of two to one Spot', async () => {
    await link(source, { from: ids.get('b')!, to: ids.get('a/s')!, name: 'cap' })
    await stage(ids.get('b')!)
    await publish({ blocks })
    const cap = await linkOf(ids.get('b')!, ids.get('a/s')!)
    const uuid = await linkUuid(cap)
    await retire({ source, edge: cap, now })
    await stage(ids.get('b')!)
    await publish({ blocks })
    expect((await versionOf(ids.get('b')!)).contains).toEqual([{ tombstone: uuid }])
    expect(await source.V(ids.get('a')!).outE('CONTAINS').count().next()).toMatchObject({ value: 1 })
  })

  it('publishes nothing for a Spot moved away & back, & cleans it', async () => {
    const before = await cidOf(ids.get('a')!)
    await relinkSpot({ source, what: ids.get('a/s')!, from: ids.get('a')!, to: ids.get('b')!, now, uuid: uuidV7() })
    await stage(ids.get('a')!)
    await relinkSpot({ source, what: ids.get('a/s')!, from: ids.get('b')!, to: ids.get('a')!, now, uuid: uuidV7() })
    const other = await addSpot(source)
    await link(source, { from: ids.get('b')!, to: other, name: 'other' })
    await stage(other)
    await publish({ blocks })
    expect(await cidOf(ids.get('a')!)).toBe(before)
    expect(await source.V(ids.get('a')!).values('staged').toList()).toEqual([])
  })

  describe('mounts', () => {
    it('refuses two mounts of one target with a 400, staging or preparing', async () => {
      await mount(source, { from: ids.get('a')!, to: ids.get('b')!, order: 0 })
      await mount(source, { from: ids.get('a')!, to: ids.get('b')!, order: 1 })
      const twice = {
        status: 400,
        body: { message: `Spot #${ids.get('a')} mounts Spot #${ids.get('b')} twice.` },
      }
      await expect(stage(ids.get('a')!)).rejects.toMatchObject(twice)
      await source.V(ids.get('a')!).property('staged', true).toList()
      await expect(prepare({ source, blocks, address, now })).rejects.toMatchObject(twice)
    })

    it('publishes a mount into the user’s own tree with no creator', async () => {
      await mount(source, { from: ids.get('a')!, to: ids.get('b')!, order: 2 })
      await stage(ids.get('a')!)
      await publish({ blocks })
      expect((await versionOf(ids.get('a')!)).mounts).toEqual([{ target: await uuidOf(ids.get('b')!), order: 2 }])
    })

    it('publishes a mount into another user’s tree with their address (R14)', async () => {
      const other = testAccount().address.toLowerCase()
      const { root: theirs } = await seedUser(source, { address: other })
      await mount(source, { from: ids.get('a')!, to: theirs, order: 3 })
      await stage(ids.get('a')!)
      await publish({ blocks })
      expect((await versionOf(ids.get('a')!)).mounts).toEqual([{ target: await uuidOf(theirs), creator: other, order: 3 }])
    })

    it('refuses a mount of a Spot no user reaches with a 500', async () => {
      const orphan = await addSpot(source)
      await mount(source, { from: ids.get('a')!, to: orphan, order: 0 })
      await expect(stage(ids.get('a')!)).rejects.toMatchObject({
        status: 500,
        body: { message: `Can’t tell who owns mount target Spot #${orphan}.` },
      })
    })
  })
})

describe('renames (US5)', () => {
  const S = '0x5555555555555555555555555555555555555555'
  let ids: Map<string, Id>
  let theirs: Map<string, Id>
  let blocks: Blocks
  let hatzLink: string
  const versionOf = async (id: Id) => read(blocks, (await cidOf(id))!)
  const rename = (from: string, to: string) => (
    renameSpot({ source, address, path: ['image'], from, to, now })
  )
  const mountOf = async (path: string) => ({
    uuid: hatzLink, path, target: await uuidOf(theirs.get('image/hatz')!), creator: S,
  })

  beforeEach(async () => {
    ids = await seedTree(source, { root, tree: { image: { hat: {} } } })
    const { root: sRoot } = await seedUser(source, { address: S })
    theirs = await seedTree(source, { root: sRoot, tree: { image: { hatz: {} } } })
    await mount(source, { from: root, to: sRoot })
    hatzLink = (await source.V(theirs.get('image')!).outE('CONTAINS').values('uuid').next()).value as string
    await stageAll()
    blocks = memoryBlocks()
    await publish({ blocks })
  })

  it('publishes an own rename as one entry under its uuid (US5-1)', async () => {
    const uuid = (await source.V(ids.get('image')!).outE('CONTAINS').values('uuid').next()).value
    await rename('hat', 'cap')
    await stageAll()
    await publish({ blocks })
    expect((await versionOf(ids.get('image')!)).contains).toEqual([
      { uuid, path: 'cap', target: CID.parse((await cidOf(ids.get('image/hat')!))!) },
    ])
  })

  it('publishes a mount of their link as it was, then as renamed (US5-2, FR-020)', async () => {
    const before = await cidOf(ids.get('image')!)
    await rename('hatz', 'hats')
    await stageAll()
    const { update } = await publish({ blocks })
    const version = await versionOf(ids.get('image')!)
    expect(version.mounts).toEqual([await mountOf('hats')])
    const prelude = await read(blocks, version.previous as CID)
    expect(prelude).toEqual({
      uuid: await uuidOf(ids.get('image')!),
      previous: CID.parse(before!),
      mounts: [await mountOf('hatz')],
    })
    const indexed = new Map(await mstEntries(update.spots, blocks))
    expect(indexed.get(await uuidOf(ids.get('image')!))!.toString()).toBe(await cidOf(ids.get('image')!))
  })

  it('preludes a new Spot’s first version, which its parent links to', async () => {
    await source.V(root).outE('CONTAINS').drop().toList()
    await rename('hatz', 'hats')
    const image = (await source.V(root).out('CONTAINS').id().next()).value as Id
    await stageAll()
    await publish({ blocks })
    const version = await versionOf(image)
    const prelude = await read(blocks, version.previous as CID)
    expect(prelude).toEqual({ uuid: await uuidOf(image), mounts: [await mountOf('hatz')] })
    expect(linkTarget(await versionOf(root), 'image').toString()).toBe(await cidOf(image))
  })

  it('publishes a later rename of the mount as one edit (US5-3)', async () => {
    await rename('hatz', 'hats')
    await stageAll()
    await publish({ blocks })
    const was = await cidOf(ids.get('image')!)
    await rename('hats', 'caps')
    await stageAll()
    await publish({ blocks })
    const version = await versionOf(ids.get('image')!)
    expect(version.mounts).toEqual([await mountOf('caps')])
    expect(version.previous!.toString()).toBe(was)
  })

  it('publishes nothing for a rename undone (US5-5)', async () => {
    await rename('hat', 'cap')
    await rename('cap', 'hat')
    await stageAll()
    expect(await prepare({ source, blocks, address, now })).toMatchObject({ nothing: true })
  })

  it('publishes no prelude for a mount named as its link is', async () => {
    const before = await cidOf(ids.get('image')!)
    await rename('hatz', 'hats')
    await rename('hats', 'hatz')
    await stageAll()
    await publish({ blocks })
    const version = await versionOf(ids.get('image')!)
    expect(version.mounts).toEqual([await mountOf('hatz')])
    expect(version.previous!.toString()).toBe(before)
  })
})

describe('resolving a moved mount (FR-024)', () => {
  const S = '0x5555555555555555555555555555555555555555'
  let theirs: Map<string, Id>
  let blocks: Blocks
  let hatzLink: string
  let head: string
  const spotAt = async (name: string) => (
    (await source.V(root).outE('CONTAINS').has('path', name).inV().id().next()).value as Id
  )
  const versionOf = async (id: Id) => read(blocks, (await cidOf(id))!)
  const publishAll = async () => {
    await stageAll()
    ;({ cid: head } = await publish({ blocks }))
  }
  const resolve = async (how: typeof removeMount) => {
    const [notice] = await noticesFor({ source, address })
    return how({ source, address, mount: notice.mount, now })
  }
  const linkOf = async (path: string) => ({
    uuid: hatzLink, path, target: await uuidOf(theirs.get('image/hatz')!), creator: S,
  })
  const rebuilds = async () => {
    expect(await rebuild({ head: CID.parse(head), blocks })).toEqual(await snapshot({ source, root }))
  }

  beforeEach(async () => {
    const { root: sRoot } = await seedUser(source, { address: S })
    theirs = await seedTree(source, { root: sRoot, tree: { image: { hatz: {} }, old: {} } })
    await mount(source, { from: root, to: sRoot })
    hatzLink = (await source.V(theirs.get('image')!).outE('CONTAINS').values('uuid').next()).value as string
    blocks = memoryBlocks()
    await renameSpot({ source, address, path: ['image'], from: 'hatz', to: 'hats', now })
  })

  const moveTheirs = () => relinkSpot({
    source, what: theirs.get('image/hatz')!, from: theirs.get('image')!, to: theirs.get('old')!,
    now, uuid: uuidV7(),
  })

  describe('once published', () => {
    beforeEach(async () => {
      await publishAll()
      await moveTheirs()
    })

    it('publishes Remove as a tombstone under the uuid', async () => {
      await resolve(removeMount)
      await publishAll()
      expect((await versionOf(await spotAt('image'))).mounts).toEqual([{ tombstone: hatzLink }])
      await rebuilds()
    })

    it('publishes Follow as the uuid leaving one version & joining the next, with no prelude', async () => {
      await resolve(followMount)
      await stage(await spotAt('old'))
      ;({ cid: head } = await publish({ blocks }))
      expect((await versionOf(await spotAt('image'))).mounts).toEqual([{ tombstone: hatzLink }])
      const old = await versionOf(await spotAt('old'))
      expect(old.mounts).toEqual([await linkOf('hats')])
      expect(old.previous).toBeUndefined()
      await rebuilds()
    })

    it('publishes Keep as a tombstone, a new link, & its Spot’s layer mount', async () => {
      await resolve(keepMount)
      await publishAll()
      const image = await versionOf(await spotAt('image'))
      expect(image.mounts).toEqual([{ tombstone: hatzLink }])
      expect(image.contains).toEqual([expect.objectContaining({ path: 'hats' })])
      const kept = (await source.V(await spotAt('image')).out('CONTAINS').id().next()).value as Id
      expect((await versionOf(kept)).mounts).toEqual([
        { target: await uuidOf(theirs.get('image/hatz')!), creator: S, order: 0 },
      ])
      await rebuilds()
    })
  })

  it('publishes a Follow of an unpublished mount from its new place alone, after a prelude', async () => {
    await moveTheirs()
    await resolve(followMount)
    await publishAll()
    expect((await versionOf(await spotAt('image'))).mounts ?? []).toEqual([])
    const old = await versionOf(await spotAt('old'))
    expect(old.mounts).toEqual([await linkOf('hats')])
    expect(await read(blocks, old.previous as CID)).toEqual({
      uuid: await uuidOf(await spotAt('old')), mounts: [await linkOf('hatz')],
    })
    await rebuilds()
  })
})
