import gremlin from 'gremlin'
import * as v from 'valibot'
import { isHttpError, error } from '@sveltejs/kit'
import { command } from '$app/server'
import {
  connect as connectJanusGraph, connectToG, mergeSpotRoot, mergePath,
} from '$lib/server/janusgraph'
import { searchFor } from './searchFor.remote'
import { spotId } from './spotId.remote'
import { getSessionAddress } from '$lib/server/auth'

const { statics: __ } = gremlin.process

const NewSpotSchema = v.object({
  container: v.optional(v.nullable(v.array(v.string()))),
  subdirectory: v.array(v.string()),
})

export const upsertSpot = command(
  NewSpotSchema,
  async ({ container, subdirectory }) => {
    const connection = connectJanusGraph()
    const now = new Date().toISOString()

    try {
      const containerId = await spotId({ path: container ?? [] })
      console.debug({ containerId, container, subdirectory })
      let traversal = await (
        mergeSpotRoot({ traversal: connectToG(connection), now, create: true })
      )

      if(containerId != null) {
        if(!await (
          (await mergeSpotRoot({ traversal: connectToG(connection), create: false }))
          .until(__.hasId(containerId))
          .repeat(__.out())
          .hasNext()
        )) {
          const address = await getSessionAddress()
          throw error(400, `Container, "${containerId}", does not belong to the user ${address}.`)
        }
        traversal = traversal.V(containerId)
      }

      const id = (await (
        (await mergePath({ traversal, path: subdirectory, now, create: true }))
        .id().next()
      )).value

      void searchFor({ path: subdirectory }).refresh()

      return id
    } catch(err) {
      console.error({ upsertSpot: err })
      if(isHttpError(err)) {
        throw err
      }
      throw error(500, `Spot Upsert: "${(err as Error)?.message ?? err}"`)
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({ 'createSpot Close Failed': error })
      }
    }
  }
)
