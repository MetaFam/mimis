import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import {
  connect as connectJanusGraph, connectToG,
  findSpotRoot,
} from '$lib/janusgraph.ts'
import settings from '$lib/settings.svelte.ts'
import { ConnectionError } from '$lib'

const { statics: __, t: T } = gremlin.process

export interface Representation {
  type: string
  cid: string
}

const SearchSchema = v.object({
  path: v.array(v.string()),
  address: v.optional(v.nullable(v.string())),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false),
  })),
})

export const representations = query(
  SearchSchema,
  async ({
    path = [],
    address,
    options = {
      maxMountDepth: 10,
      allowCycles: false,
    },
  }) => {
    const { maxMountDepth: maxDepth, allowCycles } = options
    const connection = await connectJanusGraph()

    try {
      path = path.filter(Boolean)

      const g = connectToG(connection)

      let startId: number | null = null
      if(address) {
        startId = await findSpotRoot(g, address)
      }

      let traversal = startId != null
        ? g.V(startId)
        : g.V().has(T.label, 'Root')

      for(const element of path) {
        if(!allowCycles) {
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

      const results = (
        await traversal
        .outE('REPRESENTATION').as('rep')
        .inV()
        .project('type', 'cid')
        .by(__.select('rep').values('type'))
        .by(__.values('cid'))
        .toList()
      ) as Array<Map<keyof Representation, string>>
      return results.map(Object.fromEntries) as Array<Representation>
    } catch(err) {
      let error = err as Error
      if(error.name === 'TypeError') {
        error = new ConnectionError(
          `Connection Error: Could not connect to JanusGraph @ ${settings.janusGraphURL}.`
        )
      }
      console.error({ representations: error })
      return { error: error.message }
    } finally {
      try {
        if(connection) {
          await connection.close()
        }
      } catch(error) {
        console.error({ 'representations Close Failed': error })
      }
    }
  }
)
