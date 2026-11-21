import * as v from 'valibot'
import { command } from '$app/server'
import { getSessionAddress } from '#lib/server/auth.js'
import { kuboBlocks } from '#lib/server/blocks.js'
import { rethrow } from '#lib/server/errors.js'
import { g } from '#lib/server/janusgraph.js'
import { prepare } from '#lib/server/publish.js'
import { cleanStaged } from '#lib/server/staging.js'

const PrepareSchema = v.object({
  comment: v.optional(v.pipe(v.string(), v.maxLength(2_000))),
})

/**
 * Stores the staged Spots’ new versions, unpinned, & gives the typed
 * data for the wallet to sign with the plan to commit it by.
 */
export const preparePublish = command(PrepareSchema, async ({ comment }) => {
  try {
    const address = (await getSessionAddress({ throw: true }))!
    const source = g()
    const prepared = await prepare({
      source,
      blocks: kuboBlocks(),
      address,
      comment,
      now: new Date().toISOString(),
    })
    if(prepared.nothing) {
      await cleanStaged({ source, address })
      return { nothing: true as const }
    }
    return prepared
  } catch(err) {
    rethrow('Prepare Publish', err)
  }
})
