import * as v from 'valibot'
import { command } from '$app/server'
import { getSessionAddress } from '#lib/server/auth.js'
import { kuboBlocks } from '#lib/server/blocks.js'
import { rethrow } from '#lib/server/errors.js'
import { g } from '#lib/server/janusgraph.js'
import { commitInTransaction } from '#lib/server/publish.js'
import { pending } from './pending.remote'

const CommitSchema = v.object({
  plan: v.string(),
  signature: v.pipe(v.string(), v.regex(/^0x[0-9a-f]{130}$/i)),
})

/** Stores & pins the signed Update, & marks what it published. */
export const commitPublish = command(CommitSchema, async ({ plan, signature }) => {
  try {
    const address = (await getSessionAddress({ throw: true }))!
    const result = await commitInTransaction({
      tx: g().tx(),
      blocks: kuboBlocks(),
      address,
      plan,
      signature,
      now: new Date().toISOString(),
    })
    void pending().refresh()
    return result
  } catch(err) {
    rethrow('Commit Publish', err)
  }
})
