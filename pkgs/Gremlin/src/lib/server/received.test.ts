import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as dagCBOR from '@ipld/dag-cbor'
import { v7 as uuidV7 } from 'uuid'
import { hexToBytes } from 'viem'
import { build } from '#lib/mst.js'
import {
  cidFor, digestOf, encodeUpdate, typedDataFor, type Signed, type Update,
} from '#lib/updates.js'
import { recordUpdate } from '#lib/server/received.js'
import {
  memoryBlocks, seedTree, seedUser, snapshot, testAccount, transaction,
  type Id,
} from '#lib/server/testing.js'

type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
let blocks: ReturnType<typeof memoryBlocks>
let root: Id
let remote: ReturnType<typeof testAccount>
let device: string
const now = '2026-11-21T00:00:00.000Z'

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  blocks = memoryBlocks()
  remote = testAccount()
  device = uuidV7()
  ;({ root } = await seedUser(source, { address: testAccount().address.toLowerCase() }))
  await seedTree(source, { root, tree: { a: { 'x.txt': { file: (await cidFor(dagCBOR.encode({ x: 1 }))).toString() } } } })
})

afterEach(async () => {
  await rollback()
})

const author = () => remote.address.toLowerCase()

const signed = async (
  { sequence = 1, spots = [] }: { sequence?: number, spots?: Array<[string, Awaited<ReturnType<typeof cidFor>>]> } = {},
): Promise<Signed> => ({
  device,
  sequence,
  spots: await build(spots, blocks),
  contents: await build([], blocks),
  ...(sequence > 1 ? { previous: await cidFor(dagCBOR.encode({ prior: sequence - 1 })) } : {}),
})

const store = async (update: Update) => (
  (await blocks.put((await encodeUpdate(update)).bytes)).toString()
)

const updateOf = async (
  fields: Signed, { comment, signature }: { comment?: string, signature?: Uint8Array } = {},
): Promise<Update> => ({
  ...fields,
  signature: signature ?? hexToBytes(await remote.signTypedData(typedDataFor(fields))),
  createdAt: '2026-11-20T00:00:00.000Z',
  ...(comment ? { comment } : {}),
})

const recorded = async () => (
  (await (
    source.V().has('User', 'address', author())
    .out('USES').has('Device', 'uuid', device)
    .out('COMMITS').hasLabel('Updates')
    .out('SPANS').hasLabel('Update')
    .valueMap()
    .toList()
  )).map((row) => Object.fromEntries(
    [...(row as Map<string, Array<unknown>>)].map(([key, [value]]) => [key, value])
  ))
)

describe('recordUpdate', () => {
  it('records a received Update under its author & device (US5-1)', async () => {
    const fields = await signed()
    const cid = await store(await updateOf(fields))
    const before = await snapshot({ source, root })

    expect(await recordUpdate({ source, blocks, cid, now }))
    .toEqual({ recorded: true, author: author(), device, sequence: 1 })
    expect(await recorded()).toEqual([
      { cid, sequence: 1, digest: digestOf(fields), createdAt: now },
    ])
    expect(await snapshot({ source, root })).toEqual(before)
  })

  it('records the same Update once (US5-2)', async () => {
    const cid = await store(await updateOf(await signed()))
    await recordUpdate({ source, blocks, cid, now })
    expect(await recordUpdate({ source, blocks, cid, now }))
    .toMatchObject({ recorded: false })
    expect(await recorded()).toHaveLength(1)
  })

  it('treats a copy differing only in unsigned fields as the same (FR-026)', async () => {
    const fields = await signed()
    const first = await store(await updateOf(fields, { comment: 'one' }))
    const second = await store(await updateOf(fields, { comment: 'two' }))
    expect(second).not.toBe(first)
    await recordUpdate({ source, blocks, cid: first, now })
    expect(await recordUpdate({ source, blocks, cid: second, now }))
    .toMatchObject({ recorded: false })
    expect(await recorded()).toEqual([expect.objectContaining({ cid: first })])
  })

  it('records Updates out of order (US5-3)', async () => {
    for(const sequence of [4, 3]) {
      const cid = await store(await updateOf(await signed({ sequence })))
      expect(await recordUpdate({ source, blocks, cid, now }))
      .toMatchObject({ recorded: true, sequence })
    }
    expect((await recorded()).map(({ sequence }) => sequence).sort()).toEqual([3, 4])
  })

  it('records both of two Updates with one sequence & different contents', async () => {
    const spot = await cidFor(dagCBOR.encode({ spot: 1 }))
    const sets: Array<Array<[string, typeof spot]>> = [[], [[uuidV7(), spot]]]
    for(const spots of sets) {
      const cid = await store(await updateOf(await signed({ spots })))
      expect(await recordUpdate({ source, blocks, cid, now }))
      .toMatchObject({ recorded: true })
    }
    expect(await recorded()).toHaveLength(2)
  })

  describe('errors', () => {
    it('refuses a malformed signature with a 400, recording nothing (US5-4)', async () => {
      const cid = await store(await updateOf(await signed(), { signature: new Uint8Array(64) }))
      await expect(recordUpdate({ source, blocks, cid, now })).rejects.toMatchObject({
        status: 400,
        body: { message: 'That Update is malformed: signature isn’t 65 bytes.' },
      })
      expect(await source.V().has('User', 'address', author()).hasNext()).toBe(false)
    })

    it('refuses a block that isn’t DAG-CBOR with a 400', async () => {
      const cid = (await blocks.put(new Uint8Array([0xff, 0xff]))).toString()
      await expect(recordUpdate({ source, blocks, cid, now })).rejects.toMatchObject({
        status: 400,
        body: { message: 'That Update is malformed: it isn’t DAG-CBOR.' },
      })
    })

    it('refuses something that isn’t a CID with a 400', async () => {
      await expect(recordUpdate({ source, blocks, cid: 'not-a-cid', now })).rejects.toMatchObject({
        status: 400,
        body: { message: '“not-a-cid” isn’t a CID.' },
      })
    })

    it('gives a 504 for a block it can’t fetch', async () => {
      const cid = (await cidFor(dagCBOR.encode({ missing: true }))).toString()
      await expect(recordUpdate({ source, blocks, cid, now })).rejects.toMatchObject({
        status: 504,
        body: { message: `Fetching Update ${cid} failed: Block ${cid} not found.` },
      })
    })
  })
})
