import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import {
  connect as connectJanusGraph, connectToG,
} from '$lib/janusgraph.ts'

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
    const connection = connectJanusGraph()
    try {
      path = path.filter(Boolean)

      const g = connectToG(connection)
      let traversal = g.V().has(T.label, 'Root')

      for (const element of path) {
        console.debug({ Checking: element })
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

      const result = await traversal.id().next()
      return result.value
    } catch(error) {
      console.error({ spotId: error })
      return { error: (error as Error).message }
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({ 'spotId Close Failed': error })
      }
    }
  }
)
