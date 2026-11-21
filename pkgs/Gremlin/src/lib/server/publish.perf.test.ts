import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as dagCBOR from '@ipld/dag-cbor'
import { CID } from 'multiformats/cid'
import settings from '#lib/settings.svelte.js'
import { kuboBlocks } from '#lib/server/blocks.js'
import { commit, prepare } from '#lib/server/publish.js'
import { stageSpots } from '#lib/server/staging.js'
import {
  attach, memoryBlocks, seedUser, seedWide, signUpdate, testAccount,
  transaction, type Id,
} from '#lib/server/testing.js'

type Source = ReturnType<typeof transaction>['source']

const kubo = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(settings.ipfsAPI).hostname)

let source: Source
let rollback: () => Promise<void>
const now = '2026-11-21T00:00:00.000Z'

beforeEach(() => {
  ;({ source, rollback } = transaction())
})

afterEach(async () => {
  await rollback()
})

describe('publishing 1,000 items (SC-002)', () => {
  it(`takes under 30 s, with ${kubo ? 'the local Kubo' : 'blocks in memory'}`, { timeout: 300_000 }, async () => {
    const account = testAccount()
    const address = account.address.toLowerCase()
    const { root } = await seedUser(source, { address })
    await seedWide(source, { under: root, names: Array.from({ length: 500 }, (_, i) => `spot ${i}`) })
    const children = await source.V(root).out('CONTAINS').id().toList() as Array<Id>
    const blocks = kubo ? kuboBlocks() : memoryBlocks()
    for(const [i, to] of children.entries()) {
      // The file data is in Kubo already, as after an upload, so the
      // Update’s recursive pin finds every block it links.
      const cid = await blocks.put(dagCBOR.encode({ i, at: Date.now() }))
      await attach(source, { to, type: 'text/plain', cid: cid.toString() })
    }
    await stageSpots({ source, address, all: true })

    const started = performance.now()
    const ready = await prepare({ source, blocks, address, now })
    const prepared = performance.now()
    if(ready.nothing) throw new Error('Nothing was prepared.')
    expect(ready.counts).toEqual({ spots: 501, contents: 500 })
    const signature = await signUpdate(account, {
      ...ready.typedData,
      message: { ...ready.typedData.message, sequence: BigInt(ready.typedData.message.sequence) },
    })
    const signed = performance.now()
    const { cid } = await commit({ source, blocks, address, plan: ready.plan, signature, now })
    const committed = performance.now()

    const seconds = ((prepared - started) + (committed - signed)) / 1000
    console.info({ 'SC-002': { prepare: (prepared - started) / 1000, commit: (committed - signed) / 1000, seconds } })
    expect(seconds).toBeLessThan(30)
    expect(await source.V(root).out('CONTAINS').has('cid').count().next()).toMatchObject({ value: 500 })
    if(kubo) await blocks.unpin(CID.parse(cid))
  })
})
