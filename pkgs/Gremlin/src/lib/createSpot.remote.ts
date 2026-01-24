import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import { connect as connectJanusGraph } from './janusgraph.ts'
import settings from '$lib/settings.svelte.ts'

const { t: T, merge: Merge, statics: __ } = gremlin.process

const NewSpotSchema = v.object({
  containerId: v.optional(v.number()),
  path: v.array(v.pipe(v.string(), v.nonEmpty())),
})

export const createSpot = command(
  NewSpotSchema,
  async ({ containerId, path }) => {
    const { generateG: genG, connection } = connectJanusGraph()
    const now = new Date().toISOString()

    if(settings.debugging) console.debug({ Create: path })

    try {
      const g = genG()

      let traversal = (
        g.mergeV(new Map([[T.id, containerId]]))
        .option(Merge.onCreate, { createdAt: now })
      )

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

      await traversal.iterate()

      return { success: true }
    } catch(error) {
      console.error({ error })
      return { error: (error as Error).message }
    } finally {
      try {
        await connection.close()
      } catch (error) {
        console.error({
          'createSpot Close Failed': (error as Error).message,
        })
      }
    }
  }
)
