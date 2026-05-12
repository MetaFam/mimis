import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { error } from '@sveltejs/kit'
import {
  connect as connectJanusGraph, connectToG,
} from '$lib/server/janusgraph.ts'
import settings from '$lib/settings.svelte.ts'
import { getSessionAddress } from '$lib/server/auth.ts'

const { statics: __, t: T } = gremlin.process

export interface Representation {
  type: string
  cid: string
}

const SearchSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false),
  })),
})

export const representations = query(
  SearchSchema,
  async ({
    path = [],
    options = {
      maxMountDepth: 10,
      allowCycles: false,
    },
  }) => {
    const { maxMountDepth: maxDepth, allowCycles } = options
    const connection = await connectJanusGraph()

    try {
      path = path.filter(Boolean)

      const address = await getSessionAddress()
      const g = connectToG(connection)
      let traversal = (
        g.V()
        .has(T.label, 'SpotRoot')
        .has('address', address)
      )

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
      let msg = (err as Error).message
      if(error.name === 'TypeError') {
        msg = `Connection Error: Could not connect to JanusGraph @ ${settings.janusGraphURL}.`
      }
      console.error({ representations: err })
      throw error(500, `Fetching Representations: "${msg}"`)
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
