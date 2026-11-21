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

/**
 * Gives every `IS` a uuid, moves each Content’s `order` onto its `AS`
 * edge as a number, & copies each `User`’s address onto its `INCLUDES`
 * as `author`. How many of each it changed.
 */
export async function backfillRepresentations(
  { source }: { source: GraphTraversalSource },
) {
  const unnamed = await source.E().hasLabel('IS').hasNot('uuid').id().toList()
  for(const id of unnamed) {
    await source.E(relationId(id)).property('uuid', uuidV7()).next()
  }

  const holdings = await (
    source.E().hasLabel('AS')
    .project('edge', 'order', 'held')
    .by(__.id())
    .by(__.values('order').fold())
    .by(__.inV().values('order').fold())
    .toList()
  ) as Array<Map<string, unknown>>
  let orders = 0
  for(const row of holdings) {
    const edge = relationId(row.get('edge'))
    const [order] = row.get('order') as Array<unknown>
    const [held] = row.get('held') as Array<unknown>
    const wanted = (
      typeof held === 'number' ? held
      : Number.isFinite(Number(order)) ? Number(order)
      : -1
    )
    if(order === wanted && held === undefined) continue
    if(order !== wanted) {
      await source.E(edge).property('order', wanted).next()
    }
    if(held !== undefined) {
      await source.E(edge).inV().properties('order').drop().toList()
    }
    orders++
  }

  const anonymous = () => source.E().hasLabel('INCLUDES').hasNot('author')
  const { value: authors } = await anonymous().count().next()
  await anonymous().property('author', __.inV().values('address')).toList()

  return { representations: unnamed.length, orders, authors: Number(authors) }
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
