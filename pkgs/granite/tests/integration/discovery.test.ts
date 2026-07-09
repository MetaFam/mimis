// US3 end-to-end (Kubo + anvil): announcement latency (SC-003), registry
// agreement (SC-001), full-history enumeration (SC-006), CLI contracts.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { connect, type Announcement } from '#lib/index.ts'
import { deployRegistry } from '../../scripts/deploy-registry.ts'
import { anvilUp, fundedKeys, kuboUp, kuboUrl, rpcUrl } from './env.ts'

describe(
  'discovery (Kubo + anvil)',
  { skip: (!anvilUp || !kuboUp) && 'kubo/anvil not reachable' },
  () => {
    it('follow hears a verified announcement < 60 s; latest and history agree', async () => {
      const registry = await deployRegistry(rpcUrl, fundedKeys[0])
      const chain = { rpcUrl, registry }
      const publisher = await connect({ kubo: kuboUrl, chain, key: fundedKeys[1] })
      const reader = await connect({ kubo: kuboUrl, chain })

      const heard = new Promise<Announcement>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('no announcement within 60 s (SC-003)')),
          60_000,
        )
        reader.follow((announcement) => {
          clearTimeout(timeout)
          resolve(announcement)
        })
      })
      // Kubo pubsub subscriptions need a moment to register
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const first = await publisher.publish({ data: { n: 1 } })
      const announcement = await heard
      assert.ok(announcement.root.equals(first.update))

      const second = await publisher.publish({ data: { n: 2 } })
      const address = announcement.publisher
      assert.ok((await reader.latest(address))?.equals(second.update))

      const updates: string[] = []
      for await(const entry of reader.history(address)) {
        updates.push(entry.update.toString())
      }
      assert.deepEqual(updates, [second.update.toString(), first.update.toString()])

      await publisher.close()
      await reader.close()
    })
  },
)
