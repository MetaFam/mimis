import gremlin from 'gremlin'
import { v7 as uuidV7 } from 'uuid'

const { statics: __ } = gremlin.process
type GraphTraversalSource = (
  InstanceType<typeof gremlin.process.GraphTraversalSource>
)

const LOCAL = ['localhost', '127.0.0.1', '[::1]']
const relationId = (id: unknown) => (id as { relationId: string }).relationId

export function assertLocalGraph(
  url: string, { remote }: { remote: boolean },
) {
  if(!remote && !LOCAL.includes(new URL(url).hostname)) {
    throw new Error(`Refusing to migrate ${url}; pass --remote to allow it.`)
  }
}

const numeric = (value: unknown) => (
  typeof value === 'number' ? value
  : Number.isFinite(Number(value)) && value != null ? Number(value)
  : -1
)

/**
 * Gives every `IS` a uuid, turns each Spot’s numeric Content `order`s
 * into a ranking by `after`, in the order they listed in, & copies each
 * `User`’s address onto its `INCLUDES` as `author`. How many of each it
 * changed.
 */
export async function backfillRepresentations(
  { source }: { source: GraphTraversalSource },
) {
  const unnamed = await source.E().hasLabel('IS').hasNot('uuid').id().toList()
  for(const id of unnamed) {
    await source.E(relationId(id)).property('uuid', uuidV7()).next()
  }

  const numbered = await (
    source.V().hasLabel('Spot')
    .where(__.outE('AS').or(__.has('order'), __.inV().has('order')))
    .id()
    .toList()
  )
  let ranks = 0
  for(const spot of numbered) {
    const holdings = (await (
      source.V(spot).outE('AS')
      .project('edge', 'order', 'held', 'createdAt', 'uuid')
      .by(__.id())
      .by(__.values('order').fold())
      .by(__.inV().values('order').fold())
      .by(__.inV().coalesce(__.values('createdAt'), __.constant('')))
      .by(__.inV().values('uuid'))
      .toList()
    ) as Array<Map<string, unknown>>).map((row) => {
      const [held] = row.get('held') as Array<unknown>
      const [order] = row.get('order') as Array<unknown>
      return {
        edge: relationId(row.get('edge')),
        order: numeric(held ?? order),
        createdAt: row.get('createdAt') as string,
        uuid: row.get('uuid') as string,
      }
    })
    // As listings ordered them: by `order`, then newest first.
    holdings.sort((a, b) => (
      a.order - b.order
      || (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)
      || (a.uuid < b.uuid ? -1 : 1)
    ))
    for(const [idx, { edge }] of holdings.entries()) {
      const holding = () => source.E(edge)
      if(idx === 0) {
        await holding().properties('after').drop().toList()
      } else {
        await holding().property('after', holdings[idx - 1].uuid).next()
      }
      await holding().properties('order').drop().toList()
      await holding().inV().properties('order').drop().toList()
      ranks++
    }
  }

  const anonymous = () => source.E().hasLabel('INCLUDES').hasNot('author')
  const { value: authors } = await anonymous().count().next()
  await anonymous().property('author', __.inV().values('address')).toList()

  return { representations: unnamed.length, ranks, authors: Number(authors) }
}

// With the database cache on, a read can be stale & takes no lock, so
// without LOCK two publishes could both see a Device at the same
// sequence & both commit. (A Groovy `key` would clash with `T.key`.)
const LOCK_SEQUENCES = `
  mgmt = graph.openManagement()
  sequence = mgmt.getPropertyKey('sequence') ?: (
    mgmt.makePropertyKey('sequence').dataType(Integer.class)
    .cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
  )
  mgmt.setConsistency(sequence, org.janusgraph.core.schema.ConsistencyModifier.LOCK)
  mgmt.commit()
  check = graph.openManagement()
  consistency = check.getConsistency(check.getPropertyKey('sequence')).toString()
  check.rollback()
  consistency
`

/** Makes `sequence` a locked key, so a Device’s can’t advance twice. */
export async function lockSequences(
  client: { submit(script: string): Promise<{ toArray(): Array<unknown> }> },
) {
  const [consistency] = (await client.submit(LOCK_SEQUENCES)).toArray()
  if(consistency !== 'LOCK') {
    throw new Error(`\`sequence\` is ${consistency}, not LOCK.`)
  }
  return consistency
}
