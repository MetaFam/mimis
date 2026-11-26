import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import * as dagCBOR from '@ipld/dag-cbor'
import { v7 as uuidV7 } from 'uuid'
import { hexToBytes } from 'viem'
import { CID } from 'multiformats/cid'
import { build, list } from '#lib/mst.js'
import {
  cidFor, encodeSpot, encodeUpdate, typedDataFor, type Signed,
} from '#lib/updates.js'
import { arrange, putRepresentation, retire } from '#lib/server/edits.js'
import { edgeId } from '#lib/server/janusgraph.js'
import { relinkSpot } from '#lib/server/moves.js'
import { commit, prepare } from '#lib/server/publish.js'
import { rebuild } from '#lib/server/rebuild.js'
import { renameSpot } from '#lib/server/renames.js'
import { stageSpots } from '#lib/server/staging.js'
import {
  attach, memoryBlocks, mount, seedTree, seedUser, seedWide, signUpdate, snapshot,
  testAccount, transaction, type Id,
} from '#lib/server/testing.js'

const { statics: __ } = gremlin.process
type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
let account: ReturnType<typeof testAccount>
let address: string
let root: Id
const now = '2026-11-21T00:00:00.000Z'

const file = async (n: string) => (
  (await cidFor(dagCBOR.encode({ file: n }))).toString()
)

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  account = testAccount()
  address = account.address.toLowerCase()
  ;({ root } = await seedUser(source, { address }))
})

afterEach(async () => {
  await rollback()
})

describe('rebuild (SC-007)', () => {
  it('rebuilds the published tree from IPFS alone, after every Update', { timeout: 600_000 }, async () => {
    const blocks = memoryBlocks()
    let head: CID
    const publish = async (...staged: Array<Id>) => {
      if(staged.length === 0) await stageSpots({ source, address, all: true })
      else await stageSpots({ source, address, ids: staged, staged: true })
      const ready = await prepare({ source, blocks, address, now })
      if(ready.nothing) throw new Error('Nothing was prepared.')
      const signature = await signUpdate(account, {
        ...ready.typedData,
        message: { ...ready.typedData.message, sequence: BigInt(ready.typedData.message.sequence) },
      })
      head = CID.parse((await commit({ source, blocks, address, plan: ready.plan, signature, now })).cid)
    }
    const rebuilt = () => rebuild({ head, blocks })
    const linkOf = async (from: Id, to: Id) => (
      edgeId((await source.V(from).outE('CONTAINS').where(__.inV().hasId(to)).id().next()).value)
    )

    const ids = await seedTree(source, {
      root,
      tree: {
        icon: { hat: { 'top.svg': { file: await file('top') } } },
        a: { s: {} },
        b: {},
        wide: {},
      },
    })
    const names = Array.from({ length: 10_000 }, (_, i) => `child-${String(i).padStart(5, '0')}`)
    await seedWide(source, { under: ids.get('wide')!, names })
    await publish()
    expect(Object.keys((await rebuilt()).children.wide.children)).toHaveLength(10_000)
    expect(await rebuilt()).toEqual(await snapshot({ source, root }))

    await seedTree(source, { root: ids.get('icon/hat')!, tree: { 'fedora.svg': { file: await file('fedora') } } })
    await publish(ids.get('icon/hat')!)
    expect(await rebuilt()).toEqual(await snapshot({ source, root }))

    await relinkSpot({ source, what: ids.get('a/s')!, from: ids.get('a')!, to: ids.get('b')!, now, uuid: uuidV7() })
    await publish()
    expect(await rebuilt()).toEqual(await snapshot({ source, root }))

    await retire({ source, edge: await linkOf(ids.get('b')!, ids.get('a/s')!), now })
    await source.E(await linkOf(root, ids.get('a')!)).property('path', 'α').toList()
    await putRepresentation({
      source, spot: ids.get('icon/hat/top')!, type: 'image/svg+xml', cid: await file('top v2'), size: 7, now,
    })
    await mount(source, { from: ids.get('a')!, to: ids.get('b')!, order: 1 })
    await publish()
    const fourth = await rebuilt()
    expect(fourth).toEqual(await snapshot({ source, root }))
    expect(fourth.children.α.mounts).toHaveLength(1)
    expect(fourth.children.b.children).toEqual({})

    const x = await seedTree(source, { root: ids.get('a')!, tree: { x: {} } })
    const staged = await snapshot({ source, root })
    await seedTree(source, { root: ids.get('b')!, tree: { y: {} } })
    await publish(x.get('x')!)
    expect(await rebuilt()).toEqual(staged)

    await publish()
    expect(await rebuilt()).toEqual(await snapshot({ source, root }))
  })

  it('rebuilds alternatives, their ranks, versions, & proxies (FR-024)', { timeout: 120_000 }, async () => {
    const blocks = memoryBlocks()
    let head: CID
    const publish = async () => {
      await stageSpots({ source, address, all: true })
      const ready = await prepare({ source, blocks, address, now })
      if(ready.nothing) throw new Error('Nothing was prepared.')
      const signature = await signUpdate(account, {
        ...ready.typedData,
        message: { ...ready.typedData.message, sequence: BigInt(ready.typedData.message.sequence) },
      })
      head = CID.parse((await commit({ source, blocks, address, plan: ready.plan, signature, now })).cid)
    }
    const rebuilt = () => rebuild({ head, blocks })
    const ids = await seedTree(source, { root, tree: { hat: {} } })
    const hat = ids.get('hat')!
    const hatUuid = (await source.V(hat).values('uuid').next()).value as string
    const put = (cid: string, alternative = true) => putRepresentation({
      source, spot: hat, type: 'image/svg+xml', cid, size: cid.length, now, alternative,
    })
    const alternatives = []
    for(const name of ['a', 'b', 'c', 'd']) alternatives.push(await put(await file(name)))
    const uuids = await Promise.all(alternatives.map(async (id) => (
      (await source.V(id).values('uuid').next()).value as string
    )))
    const order = async () => (await rebuilt()).children.hat.contents.map(({ uuid }) => uuid)

    await publish()
    expect(await rebuilt()).toEqual(await snapshot({ source, root }))
    expect(await order()).toEqual(uuids)

    await put(await file('a v2'), false)
    await publish()
    const versioned = await rebuilt()
    expect(versioned).toEqual(await snapshot({ source, root }))
    const [best] = versioned.children.hat.contents
    expect(best.blobs).toHaveLength(2)
    const older = best.blobs.find(({ previous }) => previous == null)!
    expect(best.blobs.find(({ previous }) => previous != null)).toEqual(expect.objectContaining({ cid: await file('a v2'), previous: older.uuid }))

    await arrange({ source, spot: hat, order: [uuids[3], uuids[0], uuids[1], uuids[2]] })
    await publish()
    expect(await rebuilt()).toEqual(await snapshot({ source, root }))
    expect(await order()).toEqual([uuids[3], uuids[0], uuids[1], uuids[2]])
    const update = dagCBOR.decode(await blocks.get(head!)) as { spots: CID }
    const [[, hatVersion]] = (await list(update.spots, blocks)).filter(([uuid]) => (
      uuid === hatUuid
    ))
    const { contents } = dagCBOR.decode(await blocks.get(hatVersion)) as { contents: Array<{ uuid: string }> }
    expect(contents.map(({ uuid }) => uuid).sort()).toEqual([uuids[0], uuids[3]].sort())

    const other = testAccount().address.toLowerCase()
    const { root: theirs } = await seedUser(source, { address: other })
    const { content: target } = await attach(source, { to: theirs, type: 'image/svg+xml', cid: await file('theirs') })
    await attach(source, { to: hat, type: 'image/svg+xml', mounts: target })
    await publish()
    const proxied = await rebuilt()
    expect(proxied).toEqual(await snapshot({ source, root }))
    expect(proxied.children.hat.contents.at(-1)).toEqual(expect.objectContaining({
      blobs: [],
      mounts: [{ target: (await source.V(target).values('uuid').next()).value, creator: other }],
    }))
  })

  it('throws on a missing block', async () => {
    const head = await cidFor(dagCBOR.encode({ missing: true }))
    await expect(rebuild({ head, blocks: memoryBlocks() }))
    .rejects.toThrow(`Block ${head} not found.`)
  })

  it('throws on a first Update whose root isn’t marked', async () => {
    const blocks = memoryBlocks()
    const uuid = uuidV7()
    const [version] = await encodeSpot({ uuid })
    await blocks.put(version.bytes)
    const signed: Signed = {
      device: uuidV7(),
      sequence: 1,
      spots: await build([[uuid, version.cid]], blocks),
      contents: await build([], blocks),
    }
    const { bytes } = await encodeUpdate({
      ...signed,
      signature: hexToBytes(await account.signTypedData(typedDataFor(signed))),
      createdAt: now,
    })
    const head = await blocks.put(bytes)
    await expect(rebuild({ head, blocks })).rejects.toThrow(`No root in Update ${head}.`)
  })
})

describe('rebuilding renames (FR-021)', () => {
  it('rebuilds own renames & mounted links as the graph holds them', { timeout: 120_000 }, async () => {
    const blocks = memoryBlocks()
    let head: CID
    const publish = async () => {
      await stageSpots({ source, address, all: true })
      const ready = await prepare({ source, blocks, address, now })
      if(ready.nothing) throw new Error('Nothing was prepared.')
      const signature = await signUpdate(account, {
        ...ready.typedData,
        message: { ...ready.typedData.message, sequence: BigInt(ready.typedData.message.sequence) },
      })
      head = CID.parse((await commit({ source, blocks, address, plan: ready.plan, signature, now })).cid)
    }
    const rename = (from: string, to: string) => (
      renameSpot({ source, address, path: ['image'], from, to, now })
    )
    const S = '0x5555555555555555555555555555555555555555'
    await seedTree(source, { root, tree: { image: { hat: {} } } })
    const { root: sRoot } = await seedUser(source, { address: S })
    const theirs = await seedTree(source, { root: sRoot, tree: { image: { hatz: {} } } })
    await mount(source, { from: root, to: sRoot })
    await publish()

    await rename('hat', 'cap')
    await rename('hatz', 'hats')
    await publish()
    const rebuilt = await rebuild({ head: head!, blocks })
    expect(rebuilt).toEqual(await snapshot({ source, root }))
    expect(rebuilt.children.image.linked).toEqual([{
      uuid: (await source.V(theirs.get('image')!).outE('CONTAINS').values('uuid').next()).value,
      path: 'hats',
      target: (await source.V(theirs.get('image/hatz')!).values('uuid').next()).value,
      creator: S,
    }])

    await rename('hats', 'caps')
    await publish()
    expect(await rebuild({ head: head!, blocks })).toEqual(await snapshot({ source, root }))
    expect((await rebuild({ head: head!, blocks })).children.image.linked.map(({ path }) => path))
    .toEqual(['caps'])
  })
})
