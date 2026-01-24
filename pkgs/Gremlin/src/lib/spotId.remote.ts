import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { connect as connectJanusGraph } from '$lib/janusgraph.ts'

const { statics: __, t: T } = gremlin.process

const SearchSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false),
  })),
})

export const spotId = query(
  SearchSchema,
  async ({
    path = [],
    options = {
      maxMountDepth: 10,
      allowCycles: false,
    },
  }): Promise<number | { error: string }> => {
    const { maxMountDepth: maxDepth, allowCycles } = options
    const { generateG: genG, connection } = connectJanusGraph()
    try {
      path = path.filter(Boolean)

      const g = genG()
      let traversal = g.V().has(T.label, 'Root')

      for (const element of path) {
        if (!allowCycles) {
          traversal = traversal.simplePath()
        }

        traversal = (
          traversal
          .until(
            __.not(__.outE('MOUNT'))
            .or().loops().is(maxDepth)
          )
          .repeat(
            __.outE('MOUNT')
            .order()
            .by('order')
            .inV()
          )
          .outE('CONTAINS')
          .has('path', element)
          .inV()
        )
      }

      traversal = traversal.id().limit(1)
      const result = await traversal.next()
      return result.value
    } catch(error) {
      console.error({ 'In spotId': (error as Error).message })
      return { error: (error as Error).message }
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({
          'spotId Close Failed': (error as Error).message,
        })
      }
    }
  }
)
