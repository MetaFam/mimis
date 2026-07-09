import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UnreachableNodeError } from '../../src/errors.ts'
import { writeTree, type Tree } from '../../src/publish.ts'
import { stackKey } from '../../src/mount.ts'
import { network } from './harness.ts'

const leaf = (name: string): Tree => ({
  data: { name },
  edges: {},
})

describe('union-mount resolution (US2)', () => {
  it('later mounts shadow, unshadowed paths fall through, absence is undefined', async () => {
    const net = network()
    const { granite } = net.publisher()
    const u1 = await granite.publish({
      edges: {
        a: { child: leaf('a-old') },
        b: { child: leaf('b-only-in-first') },
      },
    })
    const u2 = await granite.publish({
      edges: { a: { child: leaf('a-new') } },
    })
    const stack = await net.reader().stack([{ source: u1.update }, { source: u2.update }])
    const shadowed = await stack.resolve('/a')
    assert.equal(shadowed?.data?.name, 'a-new')
    assert.ok(shadowed?.via.equals(u2.update))
    const fellThrough = await stack.resolve('/b')
    assert.equal(fellThrough?.data?.name, 'b-only-in-first')
    assert.ok(fellThrough?.via.equals(u1.update))
    assert.equal(await stack.resolve('/nowhere'), undefined)
  })

  it('shadows whole edges — no merging across mounts (spec edge case)', async () => {
    const net = network()
    const { granite } = net.publisher()
    const u1 = await granite.publish({
      edges: {
        a: {
          child: {
            edges: { deep: { child: leaf('deep-under-old-a') } },
          },
        },
      },
    })
    const u2 = await granite.publish({
      edges: {
        a: {
          props: { winner: true },
          child: { edges: { x: { child: leaf('x') } } },
        },
      },
    })
    const stack = await net.reader().stack([{ source: u1.update }, { source: u2.update }])
    assert.equal((await stack.resolve('/a/x'))?.data?.name, 'x')
    // u2's `a` wins entirely: u1's subtree under `a` is not consulted.
    assert.equal(await stack.resolve('/a/deep'), undefined)
  })

  it('resolves the empty path to the highest layer root', async () => {
    const net = network()
    const { granite } = net.publisher()
    const u1 = await granite.publish({ data: { layer: 1 } })
    const u2 = await granite.publish({ data: { layer: 2 } })
    const stack = await net.reader().stack([{ source: u1.update }, { source: u2.update }])
    const root = await stack.resolve('/')
    assert.equal(root?.data?.layer, 2)
    assert.ok(root?.via.equals(u2.update))
  })

  it('is deterministic across repeated resolves (SC-004)', async () => {
    const net = network()
    const { granite } = net.publisher()
    const u1 = await granite.publish({ edges: { p: { child: leaf('one') } } })
    const u2 = await granite.publish({ edges: { p: { child: leaf('two') } } })
    const stack = await net.reader().stack([{ source: u1.update }, { source: u2.update }])
    const first = await stack.resolve('/p')
    for(let i = 0; i < 5; i++) {
      const again = await stack.resolve('/p')
      assert.deepEqual(again?.node.toString(), first?.node.toString())
      assert.deepEqual(again?.via.toString(), first?.via.toString())
    }
  })

  it('throws UnreachableNodeError naming the missing CID', async () => {
    const net = network()
    const { granite } = net.publisher()
    const child = leaf('vanishing')
    const u = await granite.publish({ edges: { c: { child } } })
    const stack = await net.reader().stack([{ source: u.update }])
    const resolved = await stack.resolve('/c')
    assert.ok(resolved)
    net.store.delete(resolved.node)
    await assert.rejects(
      stack.resolve('/c'),
      (error: UnreachableNodeError) => (
        error instanceof UnreachableNodeError && error.cid === resolved.node.toString()
      ),
    )
  })

  it('handles a 10-deep stack correctly (SC-004)', async () => {
    const net = network()
    const { granite } = net.publisher()
    const updates = []
    for(let i = 0; i < 10; i++) {
      updates.push(await granite.publish({
        edges: {
          [`k${i}`]: { child: leaf(`unique-${i}`) },
          shared: { child: leaf(`shared-${i}`) },
        },
      }))
    }
    const stack = await net.reader().stack(updates.map(({ update }) => ({ source: update })))
    assert.equal((await stack.resolve('/shared'))?.data?.name, 'shared-9')
    assert.equal((await stack.resolve('/k0'))?.data?.name, 'unique-0')
    assert.equal((await stack.resolve('/k7'))?.data?.name, 'unique-7')
  })
})

describe('node mounts (FR-014)', () => {
  it('own edges shadow mounted content; mounts shadow by order', async () => {
    const net = network()
    const { granite } = net.publisher()
    const mounted0 = await writeTree(net.store, {
      edges: {
        p: { child: leaf('from-mount-0') },
        own: { child: leaf('mount-tries-to-shadow') },
      },
    })
    const mounted1 = await writeTree(net.store, {
      edges: { p: { child: leaf('from-mount-1') } },
    })
    const u = await granite.publish({
      edges: { own: { child: leaf('own-wins') } },
      mounts: [
        { source: mounted0, order: 0 },
        { source: mounted1, order: 1 },
      ],
    })
    const stack = await net.reader().stack([{ source: u.update }])
    assert.equal((await stack.resolve('/own'))?.data?.name, 'own-wins')
    assert.equal((await stack.resolve('/p'))?.data?.name, 'from-mount-1')
  })

  it('terminates mount cycles at maxMountDepth, deterministically', async () => {
    const net = network()
    const a = net.publisher()
    const b = net.publisher()
    await a.granite.publish({
      edges: { ownA: { child: leaf('a') } },
      mounts: [{ source: b.address, order: 0 }],
    })
    await b.granite.publish({
      edges: { ownB: { child: leaf('b') } },
      mounts: [{ source: a.address, order: 0 }],
    })
    const stack = await net.reader().stack([{ source: a.address }])
    assert.equal((await stack.resolve('/ownA'))?.data?.name, 'a')
    assert.equal((await stack.resolve('/ownB'))?.data?.name, 'b')
    assert.equal(await stack.resolve('/neither'), undefined)
    assert.equal(await stack.resolve('/neither'), undefined)
  })
})

describe('incremental retrieval (FR-015 / SC-007)', () => {
  it('fetches only path-relevant documents, never the whole graph', async () => {
    const net = network()
    const { granite } = net.publisher()
    const edges: Record<string, { child: Tree }> = {}
    for(let i = 0; i < 20; i++) {
      const children: Record<string, { child: Tree }> = {}
      for(let j = 0; j < 5; j++) {
        children[`c${j}`] = { child: leaf(`leaf-${i}-${j}`) }
      }
      edges[`s${i}`] = { child: { edges: children } }
    }
    const u = await granite.publish({ edges })
    const stack = await net.reader().stack([{ source: u.update }])
    net.store.gets = 0
    const resolved = await stack.resolve('/s3/c2')
    assert.equal(resolved?.data?.name, 'leaf-3-2')
    // update + root + s3 + final leaf fetch: far below the 121 stored docs
    assert.ok(
      net.store.gets <= 5,
      `expected ≤ 5 fetches for one path, saw ${net.store.gets}`,
    )
  })
})

describe('stack keys', () => {
  it('derives identical keys for identical ordered mounts', async () => {
    const net = network()
    const { granite, address } = net.publisher()
    const u = await granite.publish({ edges: {} })
    const a = stackKey([{ source: u.update }, { source: address }])
    const b = stackKey([{ source: u.update }, { source: address }])
    const c = stackKey([{ source: address }, { source: u.update }])
    assert.equal(a, b)
    assert.notEqual(a, c)
  })
})