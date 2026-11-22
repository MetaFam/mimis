import gremlin from 'gremlin'
import { hold, release, retire } from '#lib/server/edits.js'
import {
  edgeId, type GraphTraversal, type GraphTraversalSource, type Id,
} from '#lib/server/janusgraph.js'

const { statics: __ } = gremlin.process

interface Move {
  source: GraphTraversalSource
  what: Id
  from: Id
  to: Id
  now: string
}

/**
 * Moves `what` from `from`’s Contents to the end of `to`’s, relinking
 * what followed it in `from`. The new `AS` edge’s id, or `null` if
 * `from` doesn’t hold `what`.
 */
export async function relinkContent({ source, what, from, to, now }: Move) {
  const { value } = await (
    source.V(from)
    .hasLabel('Spot')
    .outE('AS')
    .where(__.inV().hasId(what).hasLabel('Content'))
    .id()
    .next()
  )
  if(value == null) return null
  const added = await hold({ source, spot: to, content: what, now })
  await release({ source, edge: edgeId(value), now })
  return added
}

/**
 * Re-points the `CONTAINS` edge from `from` to `to`, keeping its
 * `path` & `uuid`. The new edge’s id, or `null` if `from` doesn’t
 * contain `what`.
 */
export const relinkSpot = (
  { source, what, from, to, now, uuid }: Move & { uuid: string }
) => (
  relink({
    source,
    now,
    added: (
      source.V(from)
      .hasLabel('Spot')
      .outE('CONTAINS')
      .where(__.inV().hasId(what))
      .as('old')
      .inV()
      .addE('CONTAINS')
      .from_(__.V(to))
      .property('path', __.select('old').values('path'))
      .property(
        'uuid',
        __.select('old').coalesce(__.values('uuid'), __.constant(uuid)),
      )
      .property('createdAt', now)
    ),
  })
)

/** Adds the new edge, then retires the old one it was copied from. */
async function relink(
  { source, now, added }:
  { source: GraphTraversalSource, now: string, added: GraphTraversal },
) {
  const { value } = await (
    added
    .project('new', 'old')
    .by(__.id())
    .by(__.select('old').id())
    .next()
  )
  if(!value) return null
  const ids = value as Map<'new' | 'old', unknown>
  await retire({ source, edge: edgeId(ids.get('old')), now })
  return edgeId(ids.get('new'))
}

/** The `path` of `what`’s `CONTAINS` edge if `to` already has it. */
export const nameClash = (
  { source, what, from, to }: Omit<Move, 'now'>
) => (
  source.V(from)
  .outE('CONTAINS')
  .where(__.inV().hasId(what))
  .values('path')
  .as('name')
  .V(to)
  .outE('CONTAINS')
  .where(gremlin.process.P.eq('name')).by('path').by()
  .select('name')
  .limit(1)
)

/** Whether `to` is `what` or inside it, so the move would loop. */
export const wouldCycle = (
  { source, what, to }: Omit<Move, 'from' | 'now'>
) => (
  source.V(to)
  .emit()
  .repeat(__.in_('CONTAINS').simplePath())
  .hasId(what)
  .limit(1)
)
