import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UnreachableNodeError } from '../../src/errors.ts'
import { stackKey } from '../../src/mount.ts'
import type { Tree } from '../../src/publish.ts'
import { memoryCache, network, tick } from './harness.ts'

const leaf = (name: string): Tree => ({
  data: { name },
  edges: {},
})

describe('directories (US4, FR-013)', () => {
  it('unions publishers by address with chain expansion and shadow order', async () => {
    const net = network()
    const a = net.publisher()
    const b = net.publisher()
    await a.granite.publish({
      edges: {
        alpha: { child: leaf('from-a-layer-1') },
        contested: { child: leaf('a-contested') },
      },
    })
    // Partial snapshot: only beta — alpha keeps serving from the older layer.
    await a.granite.publish({
      edges: { beta: { child: leaf('from-a-layer-2') } },
    })
    await b.granite.publish({
      edges: {
        bravo: { child: leaf('from-b') },
        contested: { child: leaf('b-contested') },
      },
    })
    const stack = await net.reader().stack([{ source: a.address }, { source: b.address }])
    assert.equal((await stack.resolve('/alpha'))?.data?.name, 'from-a-layer-1')
    assert.equal((await stack.resolve('/beta'))?.data?.name, 'from-a-layer-2')
    assert.equal((await stack.resolve('/bravo'))?.data?.name, 'from-b')
    assert.equal((await stack.resolve('/contested'))?.data?.name, 'b-contested')
  })

  it('unions a node-level publisher mount beneath the mounting node', async () => {
    const net = network()
    const c = net.publisher()
    const d = net.publisher()
    await c.granite.publish({
      edges: { stuff: { child: leaf('c-stuff') } },
    })
    await d.granite.publish({
      edges: {
        own: { child: leaf('d-own') },
        lib: {
          child: {
            edges: {},
            mounts: [{ source: c.address, order: 0 }],
          },
        },
      },
    })
    const stack = await net.reader().stack([{ source: d.address }])
    assert.equal((await stack.resolve('/own'))?.data?.name, 'd-own')
    assert.equal((await stack.resolve('/lib/stuff'))?.data?.name, 'c-stuff')
  })

  it('fails loudly falling through past a broken chain link', async () => {
    const net = network()
    const a = net.publisher()
    const first = await a.granite.publish({
      edges: { alpha: { child: leaf('layer-1') } },
    })
    await a.granite.publish({
      edges: { beta: { child: leaf('layer-2') } },
    })
    net.store.delete(first.update)
    const stack = await net.reader().stack([{ source: a.address }])
    // Satisfied by the reachable newest layer: fine.
    assert.equal((await stack.resolve('/beta'))?.data?.name, 'layer-2')
    // Needs to fall through past the break: absence cannot be asserted.
    await assert.rejects(
      stack.resolve('/alpha'),
      (error: UnreachableNodeError) => (
        error instanceof UnreachableNodeError && error.cid === first.update.toString()
      ),
    )
  })

  it('marks dependent stacks stale on announcements (cache lifecycle)', async () => {
    const net = network()
    const a = net.publisher()
    await a.granite.publish({ edges: {} })
    const cache = memoryCache()
    const reader = net.reader({ cache })
    const stack = await reader.stack([{ source: a.address }], 'demo')
    const key = stackKey([{ source: a.address }])
    assert.equal(stack.key, key)
    assert.equal(cache.stacks.get(key)?.stale, false)
    assert.equal(cache.stacks.get(key)?.alias, 'demo')
    reader.follow(() => {})
    await tick()
    await a.granite.publish({ data: { fresh: true } })
    await tick()
    assert.equal(cache.stacks.get(key)?.stale, true)
    assert.equal(cache.latests.get(a.address), (await net.reader().latest(a.address))?.toString())
  })

  it('Stack.invalidate marks the stack stale explicitly', async () => {
    const net = network()
    const a = net.publisher()
    const u = await a.granite.publish({ edges: {} })
    const cache = memoryCache()
    const reader = net.reader({ cache })
    const stack = await reader.stack([{ source: u.update }])
    assert.equal(cache.stacks.get(stack.key)?.stale, false)
    await stack.invalidate()
    assert.equal(cache.stacks.get(stack.key)?.stale, true)
  })

  it('serves resolution from cached structure and rebuilds after a wipe', async () => {
    const net = network()
    const a = net.publisher()
    const u = await a.granite.publish({
      edges: { deep: { child: { edges: { leaf: { child: leaf('found') } } } } },
    })
    const cache = memoryCache()
    const reader = net.reader({ cache })
    const stack = await reader.stack([{ source: u.update }])
    assert.equal((await stack.resolve('/deep/leaf'))?.data?.name, 'found')
    const warmNodes = cache.nodes.size
    assert.ok(warmNodes > 0, 'resolution should hydrate lazily')
    // Wipe the cache: lazy resolution rebuilds exactly what it touches.
    cache.clear()
    assert.equal((await stack.resolve('/deep/leaf'))?.data?.name, 'found')
    assert.equal(cache.nodes.size, warmNodes)
  })
})
