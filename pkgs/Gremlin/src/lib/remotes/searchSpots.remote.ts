import * as v from 'valibot'
import { query } from '$app/server'
import { g, writeLayer } from '#lib/server/janusgraph.js'
import { searchSpots as search } from '#lib/server/search.js'

export type { Result } from '#lib/server/search.js'

const SearchSchema = v.object({
  path: v.array(v.string()),
  parts: v.pipe(
    v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
    v.minLength(1),
    v.maxLength(20),
  ),
  offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
  })),
})

/** A page of the Spots below `path` whose names match `parts`. */
export const searchSpots = query(
  SearchSchema,
  async ({ path, parts, offset, options: { maxMountDepth = 10 } = {} }) => (
    search({
      source: g(),
      from: await writeLayer(),
      path: path.filter(Boolean),
      parts,
      offset,
      maxDepth: maxMountDepth,
    })
  ),
)
