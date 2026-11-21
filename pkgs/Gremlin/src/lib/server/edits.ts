import gremlin from 'gremlin'
import { v7 as uuidV7 } from 'uuid'
import { edgeId } from '#lib/server/janusgraph.js'

const { statics: __ } = gremlin.process
type GraphTraversalSource = (
  InstanceType<typeof gremlin.process.GraphTraversalSource>
)
type Id = string | number

export const ENTRIES = ['CONTAINS', 'MOUNT', 'AS', 'IS'] as const
export type Kind = typeof ENTRIES[number]

/** The key a tombstone names: the link’s own uuid, or its target’s. */
const ownKey = (kind: Kind) => kind === 'CONTAINS' || kind === 'IS'

/**
 * Removes an entry edge. A published one leaves a `REMOVED` marker
 * between the same vertices, so the removal can be published as a
 * tombstone. It’s a label rather than a flag on the old edge so that
 * no traversal of the entry labels ever sees what was removed.
 */
export async function retire(
  { source, edge, now }:
  { source: GraphTraversalSource, edge: string, now: string },
) {
  const { value } = await (
    source.E(edge)
    .project('kind', 'published', 'uuid', 'target')
    .by(__.label())
    .by(__.values('published').fold())
    .by(__.values('uuid').fold())
    .by(__.inV().values('uuid').fold())
    .next()
  )
  if(!value) throw new Error(`Edge ${edge} doesn’t exist.`)
  const row = value as Map<string, unknown>
  const kind = row.get('kind') as Kind
  if(!ENTRIES.includes(kind)) {
    throw new Error(`Edge ${edge} is a ${kind}, not an entry.`)
  }
  const [published] = row.get('published') as Array<string>
  if(published != null) {
    const [key] = row.get(ownKey(kind) ? 'uuid' : 'target') as Array<string>
    if(key == null) throw new Error(`${kind} ${edge} has no key.`)
    await (
      source.E(edge).as('old')
      .outV()
      .addE('REMOVED')
      .to(__.select('old').inV())
      .property('kind', kind)
      // JanusGraph reserves `key` as a property name.
      .property('entry', key)
      .property('published', published)
      .property('createdAt', now)
      .next()
    )
  }
  await source.E(edge).drop().toList()
}

/**
 * Takes `what`, listed as `name`, out of the Spot `from`. `what`
 * & everything under it stay, since other links & published versions
 * can still name them. `false` if `from` has no such link.
 */
export async function unlinkSpot(
  { source, from, what, name, now }:
  {
    source: GraphTraversalSource
    from: Id
    what: Id
    name: string
    now: string
  },
) {
  const edges = await (
    source.V(from)
    .hasLabel('Spot')
    .outE('CONTAINS')
    .has('path', name)
    .where(__.inV().hasId(what))
    .id()
    .toList()
  )
  for(const edge of edges) {
    await retire({ source, edge: edgeId(edge), now })
  }
  return edges.length > 0
}

/**
 * Makes `cid` the representation of `type` on `spot`, in the Spot’s
 * Content of that type, creating the Content if there’s none. The
 * Content’s id.
 */
export async function putRepresentation(
  { source, spot, type, cid, size, now }:
  {
    source: GraphTraversalSource
    spot: Id
    type: string
    cid: string
    size: number
    now: string
  },
) {
  const found = await (
    source.V(spot)
    .out('AS')
    .hasLabel('Content')
    .has('type', type)
    .project('id', 'blobs')
    .by(__.id())
    .by(
      __.outE('IS')
      .project('edge', 'cid')
      .by(__.id())
      .by(__.inV().values('cid'))
      .fold()
    )
    .toList()
  ) as Array<Map<string, unknown>>
  if(found.length > 1) {
    throw new Error(`Spot #${spot} holds two Contents of type “${type}”.`)
  }
  const blob = (from: string) => (
    __.addV('Blob')
    .property('cid', cid)
    .property('size', size)
    .property('createdAt', now)
    .addE('IS')
    .from_(from)
    .property('uuid', uuidV7())
    .property('createdAt', now)
  )

  if(found.length === 0) {
    const { value } = await (
      source.V(spot).as('spot')
      .addV('Content')
      .property('uuid', uuidV7())
      .property('type', type)
      .property('createdAt', now)
      .as('content')
      .addE('AS')
      .from_('spot')
      .to('content')
      .property('order', -1)
      .property('createdAt', now)
      .flatMap(blob('content'))
      .select('content')
      .id()
      .next()
    )
    return value as Id
  }

  const [content] = found
  const id = content.get('id') as Id
  const blobs = content.get('blobs') as Array<Map<string, unknown>>
  if(blobs.some((held) => held.get('cid') === cid)) return id
  for(const held of blobs) {
    await retire({ source, edge: edgeId(held.get('edge')), now })
  }
  await source.V(id).as('content').flatMap(blob('content')).next()
  return id
}
