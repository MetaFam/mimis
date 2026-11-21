import * as v from 'valibot'
import { command } from '$app/server'
import { getSessionAddress } from '#lib/server/auth.js'
import { kuboBlocks } from '#lib/server/blocks.js'
import { rethrow } from '#lib/server/errors.js'
import { inTransaction } from '#lib/server/janusgraph.js'
import { recordUpdate } from '#lib/server/received.js'

/** Verifies & records an Update someone published, by its address. */
export const receiveUpdate = command(
  v.object({ cid: v.string() }),
  async ({ cid }) => {
    try {
      await getSessionAddress({ throw: true })
      return await inTransaction((source) => recordUpdate({
        source, blocks: kuboBlocks(), cid, now: new Date().toISOString(),
      }))
    } catch(err) {
      rethrow('Receive Update', err)
    }
  },
)
