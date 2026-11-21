import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as dagCBOR from '@ipld/dag-cbor'
import { v7 as uuidV7 } from 'uuid'
import { CID } from 'multiformats/cid'
import { MemoryBlockstore, MST } from '@atproto/repo'
import { build, get, layerOf, list } from '#lib/mst.js'
import { cidFor } from '#lib/updates.js'
import { memoryBlocks } from '#lib/server/testing.js'

// From https://github.com/bluesky-social/atproto-interop-tests/tree/main/mst
const fixture = (name: string) => (
  readFileSync(new URL(`./fixtures/mst/${name}`, import.meta.url), 'utf8')
)
const heights = (
  JSON.parse(fixture('key_heights.json')) as Array<{ key: string, height: number }>
)
const exampleKeys = fixture('example_keys.txt').split('\n').filter(Boolean)

const valuesFor = (keys: Array<string>) => (
  Promise.all(keys.map(async (key, n): Promise<[string, CID]> => (
    [key, await cidFor(dagCBOR.encode({ n }))]
  )))
)

const atprotoRoot = async (entries: Array<[string, CID]>) => {
  let mst = await MST.create(new MemoryBlockstore())
  for(const [key, cid] of entries) {
    mst = await mst.add(key, cid as unknown as Parameters<MST['add']>[1])
  }
  return (await mst.getPointer()).toString()
}

describe('layerOf', () => {
  it.each(heights)('puts “$key” at layer $height', async ({ key, height }) => {
    expect(await layerOf(key)).toBe(height)
  })
})

describe('build', () => {
  const keySets = {
    'every example key': exampleKeys,
    'the first example key': exampleKeys.slice(0, 1),
    'the first two example keys': exampleKeys.slice(0, 2),
    'the first ten example keys': exampleKeys.slice(0, 10),
    '1,000 Spot uuids': Array.from({ length: 1_000 }, () => `spot/${uuidV7()}`),
  }

  it.each(Object.entries(keySets))(
    'gives the root @atproto/repo does for %s',
    async (_, keys) => {
      const entries = await valuesFor(keys)
      const root = await build(entries, memoryBlocks())
      expect(root.toString()).toBe(await atprotoRoot(entries))
    },
  )

  it('gives the same root whatever order the entries come in', async () => {
    const entries = await valuesFor(exampleKeys)
    const blocks = memoryBlocks()
    expect((await build([...entries].reverse(), blocks)).toString())
    .toBe((await build(entries, blocks)).toString())
  })

  it('builds an empty tree as a node with no entries', async () => {
    const blocks = memoryBlocks()
    const root = await build([], blocks)
    expect(root.toString())
    .toBe((await cidFor(dagCBOR.encode({ l: null, e: [] }))).toString())
    expect(dagCBOR.decode(await blocks.get(root))).toEqual({ l: null, e: [] })
  })

  it('throws on a duplicate key', async () => {
    const [entry] = await valuesFor(['spot/a'])
    await expect(build([entry, entry], memoryBlocks()))
    .rejects.toThrow('Duplicate MST key “spot/a”.')
  })
})

describe('get', () => {
  const uuids = Array.from({ length: 200 }, () => uuidV7()).sort()

  it('finds every key', async () => {
    const blocks = memoryBlocks()
    const entries = await valuesFor(exampleKeys)
    const root = await build(entries, blocks)
    for(const [key, cid] of entries) {
      expect((await get(root, key, blocks))?.toString()).toBe(cid.toString())
    }
  })

  it('finds bare uuid keys', async () => {
    const blocks = memoryBlocks()
    const entries = await valuesFor(uuids)
    const root = await build(entries, blocks)
    for(const [key, cid] of entries) {
      expect((await get(root, key, blocks))?.toString()).toBe(cid.toString())
    }
  })

  it('misses keys before the first, between two, & after the last', async () => {
    const blocks = memoryBlocks()
    const keys = uuids.filter((_, i) => i % 2 === 0)
    const root = await build(await valuesFor(keys), blocks)
    expect(await get(root, '0', blocks)).toBeNull()
    for(const absent of uuids.filter((_, i) => i % 2 === 1)) {
      expect(await get(root, absent, blocks)).toBeNull()
    }
    expect(await get(root, 'g', blocks)).toBeNull()
  })

  it('misses everything in an empty tree', async () => {
    const blocks = memoryBlocks()
    expect(await get(await build([], blocks), uuids[0], blocks)).toBeNull()
  })

  it('throws on a missing block', async () => {
    const root = await build(await valuesFor(uuids), memoryBlocks())
    await expect(get(root, uuids[0], memoryBlocks()))
    .rejects.toThrow(`Block ${root} not found.`)
  })
})

describe('list', () => {
  it('gives every entry, in key order', async () => {
    const blocks = memoryBlocks()
    const entries = await valuesFor(exampleKeys)
    const listed = await list(await build([...entries].reverse(), blocks), blocks)
    expect(listed.map(([key, cid]) => [key, cid.toString()]))
    .toEqual(entries.map(([key, cid]) => [key, cid.toString()]).sort(([a], [b]) => (a < b ? -1 : 1)))
  })

  it('gives nothing for an empty tree', async () => {
    const blocks = memoryBlocks()
    expect(await list(await build([], blocks), blocks)).toEqual([])
  })
})
