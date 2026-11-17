import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { error, isHttpError } from '@sveltejs/kit'
import settings from '$lib/settings.svelte'
import { spotId } from './spotId.remote'
import { g } from '$lib/server/janusgraph'

const { statics: __ } = gremlin.process

export interface Representation {
  type: string
  cid: string
  id: number
}

const SearchSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
  })),
})

export const representations = query(
  SearchSchema,
  async ({ path = [] }) => {
    try {
      path = path.filter(Boolean)

      const search = (await
        g().V(await spotId({ path }))
        .hasLabel('Spot')
        .outE('AS')
        .inV().hasLabel('Content')
        .has('type')
        .order()
        .by(__.coalesce(__.values('order'), __.constant(0)))
        .by('createdAt')
        .dedup()
        .as('image')
        .outE('IS').inV().hasLabel('Blob').as('file')
        .project('id', 'type', 'cid', 'size')
        .by(__.id())
        .by(__.select('file').values('type'))
        .by('cid')
        .by('size')
        .toList()
      ) as Array<Map<keyof Representation, string | number>>
      const results = search.map(Object.fromEntries) as Array<Representation>

      console.debug({ representations: results, path })

      return results
    } catch(err) {
      let msg = (err as Error).message
      if(error.name === 'TypeError') {
        msg = (
          'Connection Error: Could not connect to JanusGraph'
          + ` @ ${settings.janusGraphURL}.`
        )
      } else if(isHttpError(err)) {
        throw err
      }
      console.error({ representations: err, stack: (err as Error)?.stack })
      throw error(500, `Fetching Representations: "${msg}"`)
    }
  }
)

