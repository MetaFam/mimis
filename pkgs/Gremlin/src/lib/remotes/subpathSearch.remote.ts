import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { error, isHttpError } from '@sveltejs/kit'
import {
  connect as connectJanusGraph, connectToG, mergeSpotRoot,
} from '$lib/server/janusgraph.ts'
import settings from '$lib/settings.svelte.ts'
import { getSessionAddress } from '$lib/server/auth.ts'

const { statics: __, TextP } = gremlin.process

export interface Spot {
  name: string
  type: string
}
export interface Entry extends Spot {
  cid: string | null
}

const SearchSchema = v.object({
  terms: v.array(v.string()),
  containerId: v.optional(v.nullable(v.number())),
})

export const subpathSearch = query(
  SearchSchema,
  async ({
    terms = [],
    containerId = null,
  }) => {
    const connection = await connectJanusGraph()

    try {
      if(terms.length === 0) return null

      const g = connectToG(connection)
      let traversal = null

      if(containerId != null) {
        traversal = g.V(containerId)
      } else {
        const address = await getSessionAddress()
        if(!address) return null
        traversal = await mergeSpotRoot({
          traversal: g, address, create: false
        })
      }

      for(const term of terms) {
        traversal = (
          traversal
          .repeat(__.out('CONTAINS'))
          .until(__.has('path', TextP.containing(term)))
        )
      }

      const paths = (
        await traversal
        .path().by('path')
        .toList()
      ) as Array<Array<string>>
      console.debug({ paths })
      return paths
    } catch (err) {
      if(isHttpError(err)) {
        throw err
      }
      let { message: msg } = (err as Error)
      if(error.name === 'TypeError') {
        msg = (
          'Connection Error: Could not connect to JanusGraph'
          + ` @ ${settings.janusGraphURL}.`
        )
      }
      console.error({ searchFor: error })
      throw error(500, `Spot Search: "${msg}"`)
    } finally {
      try {
        if(connection) {
          await connection.close()
        }
      } catch (error) {
        console.error({ 'searchFor Close Failed': error })
      }
    }
  }
)
