import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { connect as connectJanusGraph } from '$lib/janusgraph.ts'

const { statics: __, t: T } = gremlin.process

export interface Entry {
  name: string
  type: string
  cid: string | null
}

const SearchSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false),
  })),
})

export const searchFor = query(
  SearchSchema,
  async ({
    path = [],
    options = {
      maxMountDepth: 10,
      allowCycles: false,
    },
  }): Promise<Array<Entry> | { error: string }> => {
    const { maxMountDepth: maxDepth, allowCycles } = options
    const { generateG: genG, connection } = connectJanusGraph()

    try {
      path = path.filter(Boolean)

      const g = genG()
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
            __.outE('REPRESENTATION')
            .has('type', 'image/svg+xml')
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

      return results.map((entry) => ({
        name: (
          entry.get('name')?.toString()
          ?? (() => { throw new Error('Name is missing.') })()
        ),
        type: (
          entry.get('type')?.toString()
          ?? (() => { throw new Error('Type is missing.') })()
        ),
        cid: entry.get('cid')?.toString() ?? null,
      }))
    } catch(error) {
      console.error({ addFile: error })
      return { error: (error as Error).message }
    } finally {
      try {
        await connection.close()
      } catch (error) {
        console.error({ 'addFile Close Failed': (error as Error).message })
      }
    }
  }
)
