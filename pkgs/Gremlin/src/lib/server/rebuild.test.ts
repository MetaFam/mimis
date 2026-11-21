import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import * as dagCBOR from '@ipld/dag-cbor'
import { v7 as uuidV7 } from 'uuid'
import { hexToBytes } from 'viem'
import { CID } from 'multiformats/cid'
import { build } from '#lib/mst.js'
import {
  cidFor, encodeSpot, encodeUpdate, typedDataFor, type Signed,
} from '#lib/updates.js'
import { putRepresentation, retire } from '#lib/server/edits.js'
import { edgeId } from '#lib/server/janusgraph.js'
import { relinkSpot } from '#lib/server/moves.js'
import { commit, prepare } from '#lib/server/publish.js'
import { rebuild } from '#lib/server/rebuild.js'
import { stageSpots } from '#lib/server/staging.js'
import {
  memoryBlocks, mount, seedTree, seedUser, seedWide, signUpdate, snapshot,
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
