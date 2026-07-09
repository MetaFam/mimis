import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createGranite, MissingKeyError, type Announcement } from '../../src/index.ts'
import { writeTree } from '../../src/publish.ts'
import { decodeAndVerify } from '../../src/announce.ts'
import { memoryStore } from '../fakes.ts'
import { network, tick } from './harness.ts'

describe('publishing (US1)', () => {
  it('publishes a first update with no prev, then chains', async () => {
    const net = network()
    const { granite } = net.publisher()
    const first = await granite.publish({ edges: {} })
    assert.equal(first.prev, undefined)
    const second = await granite.publish({ data: { v: 2 }, edges: {} })
    assert.ok(second.prev?.equals(first.update))
    assert.ok(!second.update.equals(first.update))
  })

  it('leaves earlier updates bit-for-bit unchanged (FR-004)', async () => {
    const net = network()
    const { granite } = net.publisher()
    const first = await granite.publish({ data: { v: 1 } })
    const bytes = [...net.store.blocks.get(first.update.toString())!]
    await granite.publish({ data: { v: 2 } })
    assert.deepEqual([...net.store.blocks.get(first.update.toString())!], bytes)
  })

  it('deduplicates identical subtrees by content (Principle II)', async () => {
    const store = memoryStore()
    const shared = { data: { name: 'shared' }, edges: {} }
    const a = await writeTree(store, { edges: { left: { child: shared } } })
    const b = await writeTree(store, { edges: { right: { child: shared } } })
    assert.ok(!a.equals(b))
    // Two trees, three unique nodes: the shared child was stored once.
    assert.equal(store.blocks.size, 3)
  })

  it('throws MissingKeyError without a key', async () => {
    const net = network()
    const readOnly = net.reader()
    await assert.rejects(readOnly.publish({ edges: {} }), MissingKeyError)
  })

  it('announces with a signature that verifies (round trip)', async () => {
    const net = network()
    const heard: Announcement[] = []
    const reader = net.reader()
    reader.follow((announcement) => {
      heard.push(announcement)
    })
    await tick()
    const { granite, address } = net.publisher()
    const published = await granite.publish({ data: { hello: 'world' } })
    await tick()
    assert.equal(heard.length, 1)
    assert.equal(heard[0].publisher, address)
    assert.ok(heard[0].root.equals(published.update))
    assert.equal(heard[0].prev, undefined)
  })

  it('registers the update as latest', async () => {
    const net = network()
    const { granite, address } = net.publisher()
    const { update } = await granite.publish({ edges: {} })
    assert.ok((await net.reader().latest(address))?.equals(update))
  })
})

describe('announcement payloads', () => {
  it('round-trips through decodeAndVerify', async () => {
    const net = network()
    let bytes: Uint8Array | undefined
    const bus = net.announcer.for()
    await bus.subscribe((message) => {
      bytes = message
    })
    const { granite, address } = net.publisher()
    const { update } = await granite.publish({ edges: {} })
    await tick()
    assert.ok(bytes, 'no announcement seen on the bus')
    const verified = await decodeAndVerify(bytes!)
    assert.ok(verified.ok)
    assert.equal(verified.announcement.publisher, address)
    assert.ok(verified.announcement.root.equals(update))
  })
})