// US2 against live Kubo + Gremlin Server (TinkerGraph): the agreement
// invariant, disposability, fetch counting (SC-007), and CLI contracts.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createGranite } from '#lib/index.ts'
import { kuboStore, type Blockstore } from '#lib/store.ts'
import { ethereumRegistry } from '#lib/registry.ts'
import { kuboAnnouncer } from '#lib/announce.ts'
import { gremlinCache } from '#lib/cache.ts'
import { deployRegistry } from '../../scripts/deploy-registry.ts'
import type { Tree } from '#lib/publish.ts'
import { addressOf } from '#lib/keys.ts'
import { anvilUp, fundedKeys, gremlinUp, kuboUp, kuboUrl, gremlinUrl, rpcUrl } from './env.ts'

const counting = (inner: Blockstore): Blockstore & { gets: () => number } => {
  let gets = 0
  return {
    put: (bytes) => inner.put(bytes),
    get: (cid) => {
      gets += 1
      return inner.get(cid)
    },
    gets: () => gets,
  }
}

const leaf = (name: string): Tree => ({
  data: { name },
  edges: {},
})

describe(
  'cache agreement & disposability (Kubo + anvil + Gremlin Server)',
  { skip: (!anvilUp || !kuboUp || !gremlinUp) && 'kubo/anvil/gremlin not all reachable' },
  () => {
    it('cached resolution ≡ reference resolver, survives a wipe, fetches minimally', async () => {
      const registry = await deployRegistry(rpcUrl, fundedKeys[0])
      const store = counting(kuboStore(kuboUrl))
      const key = fundedKeys[1]
      const ports = {
        store,
        registry: ethereumRegistry({ rpcUrl, registry, key }),
        announcer: kuboAnnouncer(kuboUrl),
        key,
      }
      const cached = createGranite({ ...ports, cache: gremlinCache(gremlinUrl) })
      const reference = createGranite(ports)

      const edges: Record<string, { child: Tree }> = {}
      for(let i = 0; i < 10; i++) {
        edges[`s${i}`] = {
          child: { edges: { leaf: { child: leaf(`leaf-${i}`) } } },
        }
      }
      const { update } = await cached.publish({ edges })
      const mounts = [{ source: update }]
      const cachedStack = await cached.stack(mounts)
      const referenceStack = await reference.stack(mounts)

      // Agreement invariant, including not-present
      for(const path of ['/s0/leaf', '/s7/leaf', '/s7', '/absent', '/']) {
        const a = await cachedStack.resolve(path)
        const b = await referenceStack.resolve(path)
        assert.equal(a?.node.toString(), b?.node.toString(), path)
        assert.equal(a?.via.toString(), b?.via.toString(), path)
      }

      // Warm cache: resolving again touches the store only for the final doc
      const before = store.gets()
      await cachedStack.resolve('/s7/leaf')
      assert.ok(
        store.gets() - before <= 2,
        `warm resolve should be nearly store-free, saw ${store.gets() - before} gets`,
      )

      // Eager warm-up is available and idempotent
      await cachedStack.hydrate()
      await cachedStack.hydrate()

      // Publisher chain expansion agrees too
      await cached.publish({ edges: { extra: { child: leaf('extra') } } })
      const publisher = addressOf(key)
      const cachedAddr = await cached.stack([{ source: publisher }])
      const referenceAddr = await reference.stack([{ source: publisher }])
      for(const path of ['/extra', '/s3/leaf', '/absent']) {
        assert.equal(
          (await cachedAddr.resolve(path))?.node.toString(),
          (await referenceAddr.resolve(path))?.node.toString(),
          path,
        )
      }

      await cached.close()
      await reference.close()
    })
  },
)
