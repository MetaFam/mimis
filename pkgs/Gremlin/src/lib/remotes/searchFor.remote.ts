import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { error, isHttpError } from '@sveltejs/kit'
import {
  connect as connectJanusGraph, connectToG, mergeSpotRoot,
} from '$lib/server/janusgraph.ts'
import settings from '$lib/settings.svelte.ts'
import { getSessionAddress } from '$lib/server/auth.ts'

const { statics: __, scope: Scope } = gremlin.process
type GraphTraversal = InstanceType<typeof gremlin.process.GraphTraversal>

export interface Spot {
  name: string
  type: string
}
export interface Entry extends Spot {
  cid: string | null
}

const SearchSchema = v.object({
  path: v.array(v.string()),
  address: v.optional(v.nullable(v.string())),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false),
  })),
})

const isImageType = () => (
  __.or(
    __.has('type', 'image/svg+xml'),
    __.has('type', 'image/png'),
    __.has('type', 'image/jpeg'),
    __.has('type', 'image/webm'),
    __.has('type', 'image/webp'),
    __.has('type', 'image/avif'),
    __.has('type', 'video/mp4'),
  )
)

const singleDisplayable = (typeLabel: string, cids: GraphTraversal) => (
  cids
  .fold()
  .filter(__.unfold())
  .project('type', 'cid')
  .by(__.constant(typeLabel))
  .by(
    __.coalesce(
      __.filter(__.count(Scope.local).is(1)).unfold(),
      __.constant(null),
    )
  )
)

export const searchFor = query(
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

      address ??= await getSessionAddress()
      if(!address) return null

      const g = connectToG(connection)
      let traversal = await mergeSpotRoot({ traversal: g, address, create: false })

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
        .outE('CONTAINS')
        .as('contains')
        .values('path').as('name')
        .select('contains')
        .inV()
        .coalesce(
          singleDisplayable(
            'spot',
            (
              __.out('CONTAINS').outE('REPRESENTATION').inV()
              .filter(isImageType())
              .not(__.inE('PREVIOUS'))
              .values('cid')
            ),
          ),
          singleDisplayable(
            'image',
            (
              __.outE('REPRESENTATION').inV()
              .filter(isImageType())
              .not(__.inE('PREVIOUS'))
              .values('cid')
            ),
          ),
          (
            __.project('type', 'cid')
            .by(__.constant('spot'))
            .by(__.constant(null))
          ),
        )
        .as('result')
        .project('name', 'type', 'cid')
        .by(__.select('name'))
        .by(__.select('result').select('type'))
        .by(__.select('result').select('cid'))
        .dedup()
        .toList()
      ) as Array<Map<keyof Entry, string | null>>
      const spots = results.map(Object.fromEntries)
      console.debug({ spots })
      return spots
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
