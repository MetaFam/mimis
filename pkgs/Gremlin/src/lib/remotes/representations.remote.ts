import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { error, isHttpError } from '@sveltejs/kit'
import {
  connect as connectJanusGraph, connectToG, mergePath, mergeSpotRoot,
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
    const connection = connectJanusGraph()

    try {
      path = path.filter(Boolean)

      let travers = connectToG(connection)
      travers = await mergeSpotRoot({ traversal: travers, create: false })
      travers = await mergePath({ traversal: travers, path, create: false })
      travers = travers.id() //outE('REPRESENTATION').inV()
      const map = await travers.next()

      const address = await getSessionAddress()

      console.debug({ map, address, path })

      let traversal = await mergeSpotRoot({ traversal: connectToG(connection), create: false })
      traversal = await mergePath({ traversal, path, create: false })

      const results = (
        await traversal
        .outE('REPRESENTATION')
        .inV()
        .project('type', 'cid')
        .by(__.values('type'))
        .by(__.values('cid'))
        .toList()
      ) as Array<Map<keyof Representation, string>>
      console.debug({ representations: results, path })
      return results.map(Object.fromEntries) as Array<Representation>
    } catch(err) {
      let msg = (err as Error).message
      if(error.name === 'TypeError') {
        msg = `Connection Error: Could not connect to JanusGraph @ ${settings.janusGraphURL}.`
      } else if(isHttpError(err)) {
        throw err
      }
      console.error({ representations: err, stack: (err as Error)?.stack })
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
