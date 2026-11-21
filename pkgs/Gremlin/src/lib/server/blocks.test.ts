import { afterAll, describe, expect, it } from 'vitest'
import * as dagCBOR from '@ipld/dag-cbor'
import type { CID } from 'multiformats/cid'
import settings from '#lib/settings.svelte.js'
import { cidFor } from '#lib/updates.js'
import { kuboBlocks, putAll } from '#lib/server/blocks.js'
import { getIPFS } from '#lib/server/ipfs.js'

const local = ['localhost', '127.0.0.1', '::1'].includes(
  new URL(settings.ipfsAPI).hostname,
)
const block = (value: Record<string, unknown>) => (
  dagCBOR.encode({ ...value, t: Date.now(), r: Math.random() })
)
const pinned = async (cid: CID) => {
  try {
    for await (const _ of getIPFS().pin.ls({ paths: [cid], type: 'recursive' })) {
      return true
    }
  } catch {
    return false
  }
  return false
}

describe.skipIf(!local)('kuboBlocks', () => {
  const touched = new Set<CID>()

  afterAll(async () => {
    for(const cid of touched) {
      if(await pinned(cid)) await getIPFS().pin.rm(cid)
    }
  })

  it('puts a block & gives the CID computed locally', async () => {
    const bytes = block({ a: 1 })
    const cid = await kuboBlocks().put(bytes)
    expect(cid.toString()).toBe((await cidFor(bytes)).toString())
    expect(await kuboBlocks().get(cid)).toEqual(bytes)
    expect(await pinned(cid)).toBe(false)
  })

  it('throws when Kubo’s CID differs from the local one', async () => {
    const bytes = block({ a: 2 })
    await expect(kuboBlocks({ format: 'raw' }).put(bytes))
    .rejects.toThrow(new RegExp(`^CID mismatch: expected ${await cidFor(bytes)}, got b\\w+\\.$`))
  })

  it('pins, pins the next from the previous, & unpins', async () => {
    const blocks = kuboBlocks()
    const a = await blocks.put(block({ a: 3 }))
    const b = await blocks.put(block({ previous: a }))
    touched.add(a).add(b)

    await blocks.pin(a)
    expect(await pinned(a)).toBe(true)

    await blocks.pin(b, a)
    expect(await pinned(b)).toBe(true)
    expect(await pinned(a)).toBe(true)

    await blocks.unpin(a)
    expect(await pinned(a)).toBe(false)
    expect(await blocks.get(a)).toBeInstanceOf(Uint8Array)

    await blocks.unpin(b)
    expect(await pinned(b)).toBe(false)
  })

  it('puts 40 blocks', async () => {
    const items = await Promise.all(Array.from({ length: 40 }, async (_, n) => {
      const bytes = block({ n })
      return { bytes, cid: await cidFor(bytes) }
    }))
    await putAll(kuboBlocks(), items)
    for(const { bytes, cid } of items) {
      expect(await kuboBlocks().get(cid)).toEqual(bytes)
    }
  })
})
