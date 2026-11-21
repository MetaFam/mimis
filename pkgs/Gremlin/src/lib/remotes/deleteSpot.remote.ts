import * as v from 'valibot'
import { error } from '@sveltejs/kit'
import { command } from '$app/server'
import { unlinkSpot } from '#lib/server/edits.js'
import { rethrow } from '#lib/server/errors.js'
import { assertOwned, inTransaction } from '#lib/server/janusgraph.js'

const DeleteSpotSchema = v.object({
  what: v.number(),
  from: v.number(),
  name: v.string(),
})

/** Takes the Spot `what`, listed as `name`, out of the Spot `from`. */
export const deleteSpot = command(
  DeleteSpotSchema,
  async ({ what, from, name }) => {
    const now = new Date().toISOString()
    try {
      await assertOwned({ ids: { container: from } })
      return await inTransaction(async (source) => {
        if(!(await unlinkSpot({ source, from, what, name, now }))) {
          throw error(
            404, `Spot #${from} doesn’t hold Spot #${what} as “${name}”.`,
          )
        }
        return true
      })
    } catch(err) {
      rethrow('Delete', err)
    }
  }
)
