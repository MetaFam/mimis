import gremlin from 'gremlin'
import { retire } from '#lib/server/edits.js'
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
 * Re-points the `AS` edge from `from` to `to`, keeping its `order`.
 * The new edge’s id, or `null` if `from` doesn’t hold `what`.
 */
export const relinkContent = ({ source, what, from, to, now }: Move) => (
  relink({
    source,
    now,
    added: (
      source.V(from)
      .hasLabel('Spot')
      .outE('AS')
      .where(__.inV().hasId(what).hasLabel('Content'))
      .as('old')
      .inV()
      .addE('AS')
      .from_(__.V(to))
      .property('createdAt', now)
      .property(
        'order',
        __.select('old').coalesce(__.values('order'), __.constant(-1)),
      )
    ),
  })
)

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

/** The `type` of `what` if `to` already holds a current one. */
export const typeClash = (
  { source, what, to }: Omit<Move, 'from' | 'now'>
) => (
  source.V(what)
  .values('type')
  .as('type')
  .V(to)
  .outE('AS')
  .inV()
  .hasLabel('Content')
  .not(__.hasId(what))
  .not(__.inE('PREVIOUS'))
  .where(gremlin.process.P.eq('type')).by('type').by()
  .select('type')
  .limit(1)
)

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
