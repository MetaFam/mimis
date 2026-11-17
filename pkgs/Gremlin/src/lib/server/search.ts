import gremlin from 'gremlin'
import { error, isHttpError } from '@sveltejs/kit'
import settings from '#lib/settings.svelte.js'
import { PAGE_SIZE } from '#lib/search.js'
import {
  compareKeys, contentsOf, precedence, resolvePath, type Key,
} from '#lib/server/listing.js'
import type { GraphTraversal } from '#lib/server/janusgraph.js'

const { statics: __, TextP, scope: Scope } = gremlin.process
type GraphTraversalSource = (
  InstanceType<typeof gremlin.process.GraphTraversalSource>
)
type Id = string | number

/** Content that can be shown inline: an image or a video. */
export interface Thumb {
  type: string
  cid: string
}

export interface Result {
  id: Id
  names: Array<string>
  thumb: Thumb | null
  /** The types of its current `Content`s, in listing order. */
  types: Array<string>
}

type Row = Map<'id' | 'names' | 'contents', unknown>

const displayable = (type: string) => (
  type.startsWith('image/') || type.startsWith('video/')
)

/** The first displayable of a Spot’s contents, in listing order. */
const thumbOf = (contents: Array<Map<string, unknown>>): Thumb | null => {
  const shown = contents.find((content) => (
    displayable(String(content.get('type')))
  ))
  return shown ? {
    type: String(shown.get('type')),
    cid: String(shown.get('cid')),
  } : null
}

/** Java’s `Pattern.quote`: `text` as a regex matching only itself. */
export const quote = (text: string) => (
  `\\Q${text.replaceAll('\\E', '\\E\\\\E\\Q')}\\E`
)

// `@types/gremlin` predates TinkerPop 3.7’s string steps.
const lowercased = (traversal: GraphTraversal) => (
  (traversal as GraphTraversal & { toLower: () => GraphTraversal })
  .toLower()
)

const named = (part: string) => (
  __.has('path', TextP.regex(`(?iu)${quote(part)}`))
)

/**
 * The Spots below `start` matching `parts`, a page at a time, plus
 * one more to tell whether another page follows.
 */
export function searchTraversal(
  { source, start, parts, offset = 0 }:
  {
    source: GraphTraversalSource
    start: Id
    parts: Array<string>
    offset?: number
  }
) {
  const descend = () => __.inV().outE('CONTAINS').simplePath()
  let traversal = source.V(start)
  // The first match on a branch suffices: any later one lies further
  // along the same path, so stopping there loses no result.
  for(const part of parts.slice(0, -1)) {
    traversal = (
      traversal
      .outE('CONTAINS')
      .until(named(part))
      .repeat(descend())
      .inV()
    )
  }
  return (
    traversal
    .outE('CONTAINS')
    .emit(named(parts.at(-1)!))
    .repeat(descend())
    .inV()
    .project('spot', 'id', 'names')
    .by(__.identity())
    .by(__.id())
    .by(__.path().unfold().hasLabel('CONTAINS').values('path').fold())
    .order()
    .by(__.select('names').count(Scope.local))
    .by(lowercased(__.select('names').unfold()).fold())
    .by(__.select('id'))
    // Without the barrier, the server dedups before ordering, keeping
    // an arbitrary path rather than the shallowest.
    .barrier()
    .dedup()
    .by(__.select('id'))
    .range(offset, offset + PAGE_SIZE + 1)
    .project('id', 'names', 'contents')
    .by(__.select('id'))
    .by(__.select('names'))
    .by(__.select('spot').map(contentsOf()))
  )
}

/** The highest-precedence Spot `path` resolves to, if any. */
async function startOf(
  { from, path, maxDepth }:
  { from: GraphTraversal, path: Array<string>, maxDepth: number }
) {
  const candidates = await (
    resolvePath({ from, path, maxDepth })
    .project('id', 'key')
    .by(__.id())
    .by(precedence())
    .toList()
  ) as Array<Map<'id' | 'key', unknown>>
  const [best] = (
    candidates
    .map((row) => ({ id: row.get('id') as Id, key: row.get('key') as Key }))
    .sort((a, b) => compareKeys(a.key, b.key))
  )
  return best?.id ?? null
}

/** A page of the Spots below `path` whose names match `parts`. */
export async function searchSpots(
  { source, from, path, parts, offset = 0, maxDepth = 10 }:
  {
    source: GraphTraversalSource
    from: GraphTraversal
    path: Array<string>
    parts: Array<string>
    offset?: number
    maxDepth?: number
  }
) {
  try {
    const start = await startOf({ from, path, maxDepth })
    if(start == null) {
      error(404, `No Spot at /${path.map((elem) => `${elem}/`).join('')}.`)
    }
    const rows = await (
      searchTraversal({ source, start, parts, offset }).toList()
    ) as Array<Row>
    const results = rows.map((row): Result => {
      const contents = row.get('contents') as Array<Map<string, unknown>>
      return {
        id: row.get('id') as Id,
        names: row.get('names') as Array<string>,
        thumb: thumbOf(contents),
        types: contents.map((content) => String(content.get('type'))),
      }
    })
    return {
      results: results.slice(0, PAGE_SIZE),
      more: results.length > PAGE_SIZE,
    }
  } catch(err) {
    if(isHttpError(err)) {
      throw err
    }
    let { message: msg } = err as Error
    if((err as Error).name === 'TypeError') {
      msg = (
        'Connection Error: Could not connect to JanusGraph'
        + ` @ ${settings.janusGraphURL}.`
      )
    }
    console.error({ searchSpots: err })
    error(500, `Search: "${msg}"`)
  }
}
