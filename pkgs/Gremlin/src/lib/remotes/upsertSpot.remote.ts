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

      return (
        (await (
          (await mergePath({ traversal, path, now, create: true }))
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
