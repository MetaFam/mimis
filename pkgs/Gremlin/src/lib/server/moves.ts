import gremlin from 'gremlin'

const { statics: __ } = gremlin.process
type GraphTraversalSource = (
  InstanceType<typeof gremlin.process.GraphTraversalSource>
)
type Id = string | number

interface Move {
  source: GraphTraversalSource
  what: Id
  from: Id
  to: Id
  now: string
}

/**
 * Re-points the `AS` edge from `from` to `to`, keeping its `order`.
 * The new edge’s id, or nothing if `from` doesn’t hold `what`.
 */
export const moveContentTraversal = (
  { source, what, from, to, now }: Move
) => (
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
    __.select('old').coalesce(__.values('order'), __.constant('-1')),
  )
  .sideEffect(__.select('old').drop())
  .id()
)

/**
 * Re-points the `CONTAINS` edge from `from` to `to`, keeping its
 * `path` & `uuid`. The new edge’s id, or nothing if `from` doesn’t
 * contain `what`.
 */
export const moveSpotTraversal = (
  { source, what, from, to, now, uuid }: Move & { uuid: string }
) => (
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
  .sideEffect(__.select('old').drop())
  .id()
)

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
