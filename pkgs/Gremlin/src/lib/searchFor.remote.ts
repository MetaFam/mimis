import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import {
  connect as connectJanusGraph, connectToG,
} from '$lib/janusgraph.ts'
import settings from "$lib/settings.svelte.ts";
import { ConnectionError } from '$lib'

const { statics: __, t: T } = gremlin.process

export interface Spot {
  name: string
  type: string
}
export interface Entry extends Spot {
  cid: string | null
}

const SearchSchema = v.object({
  path: v.array(v.string()),
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
    __.has('type', 'image/avif'),
    __.has('type', 'video/mp4'),
  )
)

export const searchFor = query(
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

      const g = connectToG(connection)
      let traversal = g.V().has(T.label, 'Root')

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
          (
            __.out('CONTAINS')
            .outE('REPRESENTATION')
            .filter(isImageType())
            .inV()
            .map(
              __.project('type', 'cid')
              .by(__.constant('spot'))
              .by(__.values('cid'))
            )
          ),
          (
            __.outE('REPRESENTATION')
            .filter(isImageType())
            .inV()
            .map(
              __.project('type', 'cid')
              .by(__.constant('image'))
              .by(__.values('cid'))
            )
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
      return results.map(Object.fromEntries)
    } catch (err) {
      let error = (err as Error)
      if(error.name === 'TypeError') {
        error = new ConnectionError(
          `Connection Error: Could not connect to JanusGraph @ ${settings.janusGraphURL}.`
        )
      }
      console.error({ searchFor: error })
      return { error: error.message }
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
