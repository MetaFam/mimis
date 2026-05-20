import gremlin from 'gremlin'
import * as v from 'valibot'
import { error } from '@sveltejs/kit'
import { command } from '$app/server'
import {
  connect as connectJanusGraph, connectToG, mergeSpotRoot, mergePath,
} from '$lib/server/janusgraph.ts'
import { getSessionAddress } from '$lib/server/auth.ts'
import { isHttpError } from "@sveltejs/kit";

const { statics: __ } = gremlin.process

const NewSpotSchema = v.object({
  containerId: v.optional(v.nullable(v.number())),
  path: v.array(v.pipe(v.string(), v.nonEmpty())),
})

export const upsertSpot = command(
  NewSpotSchema,
  async ({ containerId, path }) => {
    const connection = connectJanusGraph()
    const now = new Date().toISOString()

    try {
      const address = await getSessionAddress()
      if(!address) {
        throw error(401, 'Unauthorized: No valid session cookie found.')
      }
      let traversal = (
        mergeSpotRoot({ traversal: connectToG(connection), address, now })
      )

      if(containerId != null) {
        if(await (
          mergeSpotRoot({ traversal: connectToG(connection), address, now })
          .repeat(__.out())
          .until(
            __.hasId(containerId)
            .or()
            .count().is(0)
          )
          .hasId(containerId)
          .hasNext()
        )) {
          throw error(400, `Continer id, "${containerId}", does not belong to the user.`)
        }
        traversal = traversal.V(containerId)
      }

      return (
        (await (
          (await mergePath({ traversal, path, now }))
          .id().next()
        )).value
      )
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
