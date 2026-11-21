import * as v from 'valibot'
import { command } from '$app/server'
import { getSessionAddress } from '#lib/server/auth.js'
import { rethrow } from '#lib/server/errors.js'
import { g } from '#lib/server/janusgraph.js'
import { stageSpots } from '#lib/server/staging.js'
import { pending } from './pending.remote'

const StageSchema = v.union([
  v.object({
    ids: v.pipe(v.array(v.union([v.number(), v.string()])), v.minLength(1)),
    staged: v.boolean(),
  }),
  v.object({ all: v.literal(true) }),
])

/** Stages or unstages Spots for publishing, or stages them all. */
export const stage = command(StageSchema, async (input) => {
  try {
    const address = (await getSessionAddress({ throw: true }))!
    const result = await stageSpots({ source: g(), address, ...input })
    void pending().refresh()
    return result
  } catch(err) {
    rethrow('Stage', err)
  }
})
