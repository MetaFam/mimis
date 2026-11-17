import gremlin from 'gremlin'
import * as v from 'valibot'
import { isHttpError, error } from '@sveltejs/kit'
import { command } from '$app/server'
import { spotId } from './spotId.remote'
import { mergePath, writeLayer } from '$lib/server/janusgraph'

const { statics: __ } = gremlin.process

const NewSpotSchema = v.object({
  containerId: v.optional(v.nullable(v.number())),
  subdirectory: v.array(v.string()),
})

export const upsertSpot = command(
  NewSpotSchema,
  async ({ containerId, subdirectory }) => {
    const now = new Date().toISOString()

    try {
      if(containerId == null) {
        containerId = (await (await writeLayer()).id().next()).value
      }

      const id = (await (
        (await mergePath({ containerId, path: subdirectory, now }))
        .id().next()
      )).value

      return id
    } catch(err) {
      console.error({ upsertSpot: err })
      if(isHttpError(err)) {
        throw err
      }
      throw error(500, `Spot Upsert: "${(err as Error)?.message ?? err}"`)
    }
  }
)
