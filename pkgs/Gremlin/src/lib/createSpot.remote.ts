import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import settings from '$lib/settings.svelte.ts'
import {
  connect as connectJanusGraph, connectToG,
  mergeRoot,
} from '$lib/janusgraph.ts'

const { statics: __ } = gremlin.process

const NewSpotSchema = v.object({
  containerId: v.optional(v.nullable(v.number())),
  path: v.array(v.pipe(v.string(), v.nonEmpty())),
})

export const createSpot = command(
  NewSpotSchema,
  async ({ containerId, path }) => {
    const connection = connectJanusGraph()
    const now = new Date().toISOString()

    if(settings.debugging) console.debug({ Create: path })

    try {
      const g = connectToG(connection)

      if(containerId == null) {
        containerId = await mergeRoot(g)
      }

      let traversal = g.V(containerId)

      for(const elem of path) {
        traversal = (
          traversal
          .as('parent')
          .coalesce(
            (
              __.outE('CONTAINS')
              .has('path', elem)
              .inV()
            ),
            (
              __.addV('Spot')
              .property({ createdAt: now })
              .addE('CONTAINS')
              .from_('parent')
              .property({ path: elem, createdAt: now })
              .inV()
            ),
          )
        )
      }

      const result = await traversal.id().next()

      return result.value
    } catch(error) {
      console.error({ createSpot: error })
      return { error: (error as Error).message }
    } finally {
      try {
        await connection.close()
      } catch (error) {
        console.error({ 'createSpot Close Failed': error })
      }
    }
  }
)
