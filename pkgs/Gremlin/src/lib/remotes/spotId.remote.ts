import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { error } from '@sveltejs/kit'
import {
  connect as connectJanusGraph, connectToG,
  mergeSpotRoot,
} from '$lib/server/janusgraph.ts'
import { getSessionAddress } from '$lib/server/auth.ts'

const { statics: __ } = gremlin.process

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
  }) => {
    const { maxMountDepth: maxDepth, allowCycles } = options
    const connection = connectJanusGraph()
    try {
      path = path.filter(Boolean)

      const address = await getSessionAddress()
      const g = connectToG(connection)
      let traversal = mergeSpotRoot({ traversal: g, address })

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

      const result = await traversal.id().next()
      return result.value
    } catch(err) {
      console.error({ spotId: err })
      throw error(500, `Spot ID: "${(err as Error).message}"`)
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({ 'spotId Close Failed': error })
      }
    }
  }
)
