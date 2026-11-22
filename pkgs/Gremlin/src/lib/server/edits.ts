import gremlin from 'gremlin'
import { v7 as uuidV7 } from 'uuid'
import { predecessors, rank } from '#lib/rank.js'
import { edgeAt, edgeId, layerOf, writeAll } from '#lib/server/janusgraph.js'

const { statics: __, order: Order } = gremlin.process
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

export interface Holding {
  /** The `AS` edge. */
  edge: string
  /** The Content. */
  id: Id
  uuid: string
  type: string
  after?: string
  /** For a proxy, the Content it mounts. */
  mounts?: Id
}

/** The Contents `spot` holds itself, in rank order. */
export async function holdingsOf(
  { source, spot }: { source: GraphTraversalSource, spot: Id },
) {
  const rows = await (
    source.V(spot)
    .outE('AS')
    .project('edge', 'id', 'uuid', 'type', 'after', 'mounts')
    .by(__.id())
    .by(__.inV().id())
    .by(__.inV().values('uuid'))
    .by(__.inV().values('type'))
    .by(__.values('after').fold())
    .by(__.inV().out('MOUNT').id().fold())
    .toList()
  ) as Array<Map<string, unknown>>
  return rank(rows.map((row): Holding => {
    const [after] = row.get('after') as Array<string>
    const [mounts] = row.get('mounts') as Array<Id>
    return {
      edge: edgeId(row.get('edge')),
      id: row.get('id') as Id,
      uuid: row.get('uuid') as string,
      type: row.get('type') as string,
      ...(after == null ? {} : { after }),
      ...(mounts == null ? {} : { mounts }),
    }
  }))
}

/** Adds `content` to the end of `spot`’s Contents. The `AS` edge. */
export async function hold(
  { source, spot, content, now }:
  { source: GraphTraversalSource, spot: Id, content: Id, now: string },
) {
  const last = (await holdingsOf({ source, spot })).at(-1)
  let added = (
    source.V(spot)
    .addE('AS')
    .to(__.V(content))
    .property('createdAt', now)
  )
  if(last) added = added.property('after', last.uuid)
  const { value } = await added.id().next()
  return edgeId(value)
}

/**
 * Takes the `AS` edge’s Content out of its Spot’s ranking, so what
 * followed it follows its predecessor, & retires the edge.
 */
export async function release(
  { source, edge, now }:
  { source: GraphTraversalSource, edge: string, now: string },
) {
  const { value } = await (
    source.E(edge)
    .hasLabel('AS')
    .project('spot', 'uuid', 'after')
    .by(__.outV().id())
    .by(__.inV().values('uuid'))
    .by(__.values('after').fold())
    .next()
  )
  if(!value) throw new Error(`There’s no AS ${edge}.`)
  const row = value as Map<string, unknown>
  const [after] = row.get('after') as Array<string>
  const followers = () => (
    source.V(row.get('spot') as Id)
    .outE('AS')
    .has('after', row.get('uuid') as string)
  )
  if(after == null) {
    await followers().properties('after').drop().toList()
  } else {
    await followers().property('after', after).toList()
  }
  await retire({ source, edge, now })
}

/**
 * Ranks `spot`’s Contents as `order`, a permutation of their uuids,
 * changing only the `AS` edges whose predecessor changes.
 */
export async function arrange(
  { source, spot, order }:
  { source: GraphTraversalSource, spot: Id, order: Array<string> },
) {
  const held = new Map(
    (await holdingsOf({ source, spot })).map((holding) => [holding.uuid, holding])
  )
  if(
    order.length !== held.size
    || new Set(order).size !== held.size
    || order.some((uuid) => !held.has(uuid))
  ) {
    throw new Error(`That order isn’t of Spot #${spot}’s Contents.`)
  }
  const writes = []
  for(const { item, after } of predecessors(order.map((uuid) => ({ uuid })))) {
    const { edge, after: was } = held.get(item.uuid)!
    if(was === after) continue
    writes.push(
      after == null ? edgeAt(edge).properties('after').drop()
      : edgeAt(edge).property('after', after)
    )
  }
  await writeAll(source, writes)
}

/**
 * A proxy of `target` in `spot`, ranked last: a Content of its type
 * that mounts it & holds no Blob. Its id & uuid.
 */
export async function proxy(
  { source, spot, target, now }:
  { source: GraphTraversalSource, spot: Id, target: Id, now: string },
) {
  const uuid = uuidV7()
  const { value } = await (
    source.V(target)
    .hasLabel('Content')
    .as('target')
    .addV('Content')
    .property('uuid', uuid)
    .property('type', __.select('target').values('type'))
    .property('createdAt', now)
    .as('proxy')
    .addE('MOUNT')
    .to('target')
    .property('createdAt', now)
    .select('proxy')
    .id()
    .next()
  )
  if(value == null) throw new Error(`There’s no Content #${target} to mount.`)
  await hold({ source, spot, content: value as Id, now })
  return { id: value as Id, uuid }
}

/**
 * The Spot at `path` in `address`’s own tree, by `CONTAINS` alone,
 * made, with its parents, if there’s none.
 */
export async function spotAt(
  { source, address, path, now }:
  { source: GraphTraversalSource, address: string, path: Array<string>, now: string },
) {
  let traversal = layerOf(address, source)
  for(const name of path) {
    traversal = (
      traversal
      .as('parent')
      .coalesce(
        __.outE('CONTAINS').has('path', name).inV().limit(1),
        (
          __.addV('Spot')
          .property('uuid', uuidV7())
          .property('createdAt', now)
          .addE('CONTAINS')
          .from_('parent')
          .property('path', name)
          .property('uuid', uuidV7())
          .property('createdAt', now)
          .inV()
        ),
      )
    )
  }
  const { value } = await traversal.id().next()
  if(value == null) throw new Error(`No root Spot for ${address}.`)
  return value as Id
}

/**
 * The Content’s current Blob: of those no other Blob names as
 * `previous`, the one held by the greatest `IS` uuid, the newest.
 */
async function currentBlob(
  { source, content }: { source: GraphTraversalSource, content: Id },
) {
  const { value } = await (
    source.V(content)
    .outE('IS')
    .where(__.inV().hasLabel('Blob').not(__.inE('PREVIOUS')))
    .order().by('uuid', Order.desc)
    .limit(1)
    .project('blob', 'cid', 'published')
    .by(__.inV().id())
    .by(__.inV().values('cid'))
    .by(__.values('published').fold())
    .next()
  )
  if(!value) return null
  const row = value as Map<string, unknown>
  return {
    blob: row.get('blob') as Id,
    cid: row.get('cid') as string,
    published: (row.get('published') as Array<string>).length > 0,
  }
}

/**
 * Writes `cid` to `spot`’s best Content of `type`, or, given
 * `alternative` or when there’s none, to a new Content ranked last.
 * Data over a published Blob is a new version naming it `previous`;
 * over an unpublished one, it replaces that Blob’s. The Content’s id.
 */
export async function putRepresentation(
  { source, spot, type, cid, size, now, alternative = false }:
  {
    source: GraphTraversalSource
    spot: Id
    type: string
    cid: string
    size: number
    now: string
    alternative?: boolean
  },
) {
  const blob = (from: string) => (
    __.addV('Blob')
    .property('cid', cid)
    .property('size', size)
    .property('createdAt', now)
    .as('blob')
    .addE('IS')
    .from_(from)
    .property('uuid', uuidV7())
    .property('createdAt', now)
    .select('blob')
  )

  const best = alternative ? undefined : (
    (await holdingsOf({ source, spot }))
    .find((held) => held.type === type && held.mounts == null)
  )
  if(!best) {
    const { value } = await (
      source.addV('Content')
      .property('uuid', uuidV7())
      .property('type', type)
      .property('createdAt', now)
      .as('content')
      .flatMap(blob('content'))
      .select('content')
      .id()
      .next()
    )
    await hold({ source, spot, content: value as Id, now })
    return value as Id
  }

  const current = await currentBlob({ source, content: best.id })
  if(current?.cid === cid) return best.id
  if(current && !current.published) {
    await (
      source.V(current.blob)
      .property('cid', cid)
      .property('size', size)
      .property('createdAt', now)
      .next()
    )
    return best.id
  }
  let added = source.V(best.id).as('content').flatMap(blob('content'))
  if(current) added = added.addE('PREVIOUS').to(__.V(current.blob))
  await added.next()
  return best.id
}
