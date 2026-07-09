// US4 end-to-end (Kubo + anvil + Gremlin Server): two-key directories,
// chain expansion, live staleness, cache/reference agreement re-check.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { connect } from '../../src/index.ts'
import { addressOf, generateKey } from '../../src/keys.ts'
import { deployRegistry } from '../../scripts/deploy-registry.ts'
import type { Tree } from '../../src/publish.ts'
import { anvilUp, fundedKeys, gremlinUp, kuboUp, kuboUrl, gremlinUrl, rpcUrl } from './env.ts'

const leaf = (name: string): Tree => ({
  data: { name },
  edges: {},
})

describe(
  'directories (Kubo + anvil + Gremlin Server)',
  { skip: (!anvilUp || !kuboUp || !gremlinUp) && 'kubo/anvil/gremlin not all reachable' },
  () => {
    it('unions two publishers, expands chains, and rehydrates on announcements', async () => {
      const registry = await deployRegistry(rpcUrl, fundedKeys[0])
      const chain = { rpcUrl, registry }
      const a = await connect({ kubo: kuboUrl, chain, key: fundedKeys[0] })
      const b = await connect({ kubo: kuboUrl, chain, key: fundedKeys[1] })
      const reader = await connect({ kubo: kuboUrl, chain, gremlin: gremlinUrl })
      const addressA = addressOf(fundedKeys[0])
      const addressB = addressOf(fundedKeys[1])

      await a.publish({
        edges: {
          alpha: { child: leaf('a1') },
          contested: { child: leaf('from-a') },
        },
      })
      await a.publish({ edges: { beta: { child: leaf('a2') } } })
      await b.publish({
        edges: {
          bravo: { child: leaf('b1') },
          contested: { child: leaf('from-b') },
        },
      })

      const reference = await connect({ kubo: kuboUrl, chain })
      const mounts = [{ source: addressA }, { source: addressB }]
      const stack = await reader.stack(mounts, 'demo')
      const referenceStack = await reference.stack(mounts)

      assert.equal((await stack.resolve('/alpha'))?.data?.name, 'a1')
      assert.equal((await stack.resolve('/beta'))?.data?.name, 'a2')
      assert.equal((await stack.resolve('/bravo'))?.data?.name, 'b1')
      assert.equal((await stack.resolve('/contested'))?.data?.name, 'from-b')

      for(const path of ['/alpha', '/contested', '/absent']) {
        assert.equal(
          (await stack.resolve(path))?.node.toString(),
          (await referenceStack.resolve(path))?.node.toString(),
          path,
        )
      }

      // A fresh layer appears after a live announcement (convergence)
      const unsubscribe = reader.follow(() => {})
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await a.publish({ edges: { gamma: { child: leaf('a3') } } })
      await new Promise((resolve) => setTimeout(resolve, 2000))
      assert.equal((await stack.resolve('/gamma'))?.data?.name, 'a3')
      assert.equal((await stack.resolve('/alpha'))?.data?.name, 'a1')
      unsubscribe()

      await a.close()
      await b.close()
      await reader.close()
      await reference.close()
    })
  },
)
