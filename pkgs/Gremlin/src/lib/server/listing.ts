import gremlin from 'gremlin'
import { rank } from '#lib/rank.js'
import { edgeId } from '#lib/server/janusgraph.js'

const { statics: __, order: Order, P } = gremlin.process
type GraphTraversal = InstanceType<typeof gremlin.process.GraphTraversal>
type GraphTraversalSource = (
  InstanceType<typeof gremlin.process.GraphTraversalSource>
)
type Id = string | number

export interface Content {
  id: Id
  uuid: string
  type: string
  /** Its current Blob’s, or its target’s, if it’s a proxy. */
  cid: string
  size: number
  /** The Spot, the cursor or one of its mounted layers, holding it. */
  spot: Id
  /** The Content it’s ranked after in `spot`. */
  after?: string
  /** For a proxy, the Content it mounts. */
  mounts?: Id
}

export interface Child {
  /** The `path` of the links, `CONTAINS` or `MOUNT`, leading to it. */
  name: string
  /** Every Spot with this name, highest precedence first. */
  ids: Array<Id>
  /** The layer whose `CONTAINS` edge leads to each of `ids`. */
  parents: Array<Id>
  /** Its own `Content`s, merged across same-named Spots, best first. */
  contents: Array<Content>
  /** Has `CONTAINS` or `MOUNT` edges, so it can be browsed into. */
  container: boolean
  /**
   * The user’s own link `MOUNT` behind this name, by edge id, when the
   * link it mounts has since moved (R7).
   */
  moved?: string
}

export interface Listing {
  /** The Spots the path resolves to with their mounted layers. */
  layers: Array<Id>
  /** `Content` of the cursor & its mounted layers, merged, best first. */
  contents: Array<Content>
  /** Spots reached by `CONTAINS` from the cursor or its layers. */
  children: Array<Child>
}

/**
 * A traversal’s precedence: the `order` of each layer `MOUNT` taken,
 * with a boundary between path segments at each link, a `CONTAINS`
 * or a `MOUNT` with a `path`, since a mounted link is an entry, not a
 * layer. Sorting these
 * lexicographically is a depth-first walk by `order`, which
 * `repeat()` doesn’t give, since it runs breadth-first.
 */
const SEGMENT = '/'
export type Key = Array<number | typeof SEGMENT>

export const precedence = () => (
  __.path()
  .unfold()
  .hasLabel('MOUNT', 'CONTAINS')
  .choose(
    __.hasLabel('MOUNT').hasNot('path'),
    __.coalesce(__.values('order'), __.constant(0)),
    __.constant(SEGMENT),
  )
  .fold()
)

export const compareKeys = (a: Key, b: Key) => {
  const rank = (elem?: number | typeof SEGMENT) => (
    elem === SEGMENT ? -Infinity : Number(elem ?? -Infinity)
  )
  for(let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = rank(a[i]) - rank(b[i])
    if(diff !== 0) return diff
  }
  return 0
}

/** A Spot & everything it mounts, transitively, without cycles. */
export const withMounts = (
  { traversal, label, maxDepth }:
  { traversal: GraphTraversal, label: string, maxDepth: number }
) => (
  traversal
  .as(label)
  .emit()
  .repeat(
    __.outE('MOUNT')
    .hasNot('path')
    .inV()
    .simplePath()
    .from_(label)
  )
  .times(maxDepth)
)

const MAX_PROXIES = 10

/**
 * A Content’s current Blob, or, for a proxy, its target’s: of the Blobs
 * no other names as `previous`, the one with the greatest `IS` uuid.
 */
export const currentBlob = () => (
  __.emit()
  .repeat(__.out('MOUNT').hasLabel('Content').simplePath())
  .times(MAX_PROXIES)
  .outE('IS')
  .where(__.inV().hasLabel('Blob').not(__.inE('PREVIOUS')))
  .order().by('uuid', Order.desc)
  .limit(1)
  .inV()
)

/** The incoming Spot’s `Content`s, unranked, each with its current Blob. */
export const contentsOf = () => (
  __.outE('AS')
  .as('holding')
  .inV()
  .hasLabel('Content')
  .has('type')
  .project('id', 'uuid', 'type', 'after', 'mounts', 'blob')
  .by(__.id())
  .by('uuid')
  .by('type')
  .by(__.select('holding').values('after').fold())
  .by(__.out('MOUNT').id().fold())
  .by(
    currentBlob()
    .project('cid', 'size')
    .by('cid')
    .by(__.coalesce(__.values('size'), __.constant(0)))
    .fold()
  )
  .fold()
)

/**
 * `contentsOf()`’s rows for `spot` in rank order, leaving out those
 * with no Blob only once they’re ranked, so what follows them keeps
 * its place.
 */
export function rankedContents(rows: Array<Map<string, unknown>>, spot: Id) {
  return rank(rows.map((row) => {
    const [after] = row.get('after') as Array<string>
    const [mounts] = row.get('mounts') as Array<Id>
    const [blob] = row.get('blob') as Array<Map<string, unknown>>
    return {
      id: row.get('id') as Id,
      uuid: row.get('uuid') as string,
      type: row.get('type') as string,
      ...(after == null ? {} : { after }),
      ...(mounts == null ? {} : { mounts }),
      spot,
      blob,
    }
  }))
  .flatMap(({ blob, ...content }): Array<Content> => (
    blob ? [{
      ...content, cid: blob.get('cid') as string, size: Number(blob.get('size')),
    }] : []
  ))
}

/**
 * One layer’s ranked Contents placed over the merged list of those
 * below it. Its proxies take the places of what they mount, in its
 * order, each bringing along its own Contents ranked just before it;
 * those after its last proxy follow that one. With no proxy there, it
 * goes first.
 */
export function overlay(own: Array<Content>, below: Array<Content>) {
  const placed = new Set(below.map(({ id }) => id))
  const fresh = own.filter(({ id }) => !placed.has(id))
  const claimed = new Set<Id>()
  const proxies = new Set(fresh.filter(({ mounts }) => {
    if(mounts == null || !placed.has(mounts) || claimed.has(mounts)) return false
    claimed.add(mounts)
    return true
  }))
  if(proxies.size === 0) return [...fresh, ...below]

  const groups: Array<Array<Content>> = [[]]
  for(const content of fresh) {
    groups.at(-1)!.push(content)
    if(proxies.has(content)) groups.push([])
  }
  const trailing = groups.pop()!
  groups.at(-1)!.push(...trailing)
  let next = 0
  return below.flatMap((content) => (
    claimed.has(content.id) ? groups[next++] : [content]
  ))
}

/** Layers’ ranked Contents, highest precedence first, merged. */
export const stack = (lists: Array<Array<Content>>) => (
  lists.reduceRight<Array<Content>>((below, own) => overlay(own, below), [])
)

/**
 * For a link `MOUNT`, whether the link it mounts is now held by a Spot
 * other than its `parent`, the one it was mounted under (R7).
 */
const movedLink = () => (
  __.as('mount')
  .hasLabel('MOUNT')
  .inV()
  .inE('CONTAINS')
  .where(P.eq('mount')).by('uuid')
  .outV()
  .values('uuid')
  .where(P.neq('mount')).by().by('parent')
  .limit(1)
  .count()
)

const childrenOf = () => (
  __.outE('CONTAINS', 'MOUNT')
  .has('path')
  .project('edge', 'uuid', 'order', 'name', 'id', 'moved', 'container', 'contents')
  .by(__.id())
  .by(__.values('uuid').fold())
  .by(__.values('order').fold())
  .by('path')
  .by(__.inV().id())
  .by(movedLink())
  .by(__.inV().outE('CONTAINS', 'MOUNT').limit(1).count())
  .by(__.inV().flatMap(contentsOf()))
  .fold()
)

/** A Spot a path resolves to. */
export interface Located {
  id: Id
  key: Key
  /** Reached from the user’s root by `CONTAINS` alone, so it’s theirs. */
  own: boolean
}

type Map_ = Map<string, unknown>

/** The holders of the edges sharing the incoming link’s uuid. */
const holdersOfLink = () => (
  __.as('link')
  .inV()
  .inE('CONTAINS', 'MOUNT')
  .where(P.eq('link')).by('uuid')
  .outV()
  .id()
  .fold()
)

const best = (spots: Iterable<Located>) => {
  const kept = new Map<Id, Located>()
  for(const spot of spots) {
    const known = kept.get(spot.id)
    if(!known || compareKeys(spot.key, known.key) < 0) kept.set(spot.id, spot)
  }
  return [...kept.values()].sort((a, b) => compareKeys(a.key, b.key))
}

/**
 * Every Spot `path` resolves to from `from`, the user’s root, best
 * first, following mounts along the way but not those of the Spots it
 * ends at. A link isn’t followed where a higher layer holds an edge of
 * the same uuid, under any name (FR-013). That compares precedence
 * keys, which Gremlin can’t do mid-traversal, so each segment is its
 * own traversal.
 */
export async function resolveSpots(
  { source, from, path, maxDepth = 10 }:
  {
    source: GraphTraversalSource
    from: GraphTraversal
    path: Array<string>
    maxDepth?: number
  },
): Promise<Array<Located>> {
  if(path.length === 0) {
    const ids = await from.id().toList() as Array<Id>
    return best(ids.map((id) => ({ id, key: [], own: true })))
  }
  let starts = new Map<Id, Located>()
  let traversal = from
  for(const segment of path) {
    const rows = await (
      withMounts({ traversal: traversal.as('start'), label: 'layer', maxDepth })
      .project('start', 'id', 'key', 'links')
      .by(__.select('start').id())
      .by(__.id())
      .by(precedence())
      .by(
        __.outE('CONTAINS', 'MOUNT').has('path', segment)
        .project('label', 'target', 'holders')
        .by(__.label())
        .by(__.inV().id())
        .by(holdersOfLink())
        .fold()
      )
      .toList()
    ) as Array<Map_>
    const layers = rows.map((row) => {
      const start = starts.get(row.get('start') as Id) ?? { key: [], own: true }
      const relative = row.get('key') as Key
      return {
        id: row.get('id') as Id,
        key: [...start.key, ...relative],
        own: start.own && relative.length === 0,
        links: row.get('links') as Array<Map_>,
      }
    })
    const ranks = new Map(best(layers).map(({ id, key }) => [id, key]))
    const outranks = (holder: Id, key: Key) => {
      const rank = ranks.get(holder)
      return rank != null && compareKeys(rank, key) < 0
    }
    const next: Array<Located> = []
    for(const layer of layers) {
      for(const link of layer.links) {
        const holders = link.get('holders') as Array<Id>
        if(holders.some((holder) => holder !== layer.id && outranks(holder, layer.key))) {
          continue
        }
        next.push({
          id: link.get('target') as Id,
          key: [...layer.key, SEGMENT],
          own: layer.own && link.get('label') === 'CONTAINS',
        })
      }
    }
    starts = new Map(best(next).map((spot) => [spot.id, spot]))
    if(starts.size === 0) return []
    traversal = source.V(...starts.keys())
  }
  return [...starts.values()]
}

/**
 * Each of `starts` & the layers it mounts, with its own `Content`s &
 * children, keyed after its start.
 */
export async function layerRows(
  { source, starts, maxDepth = 10 }:
  { source: GraphTraversalSource, starts: Array<Located>, maxDepth?: number },
): Promise<Rows> {
  if(starts.length === 0) return []
  const known = new Map(starts.map((start) => [start.id, start]))
  const rows = await (
    withMounts({
      traversal: source.V(...known.keys()).as('start'),
      label: 'cursor',
      maxDepth,
    })
    .project('start', 'id', 'key', 'contents', 'children')
    .by(__.select('start').id())
    .by(__.id())
    .by(precedence())
    .by(contentsOf())
    .by(childrenOf())
    .toList()
  ) as Array<Map_>
  for(const row of rows) {
    const start = known.get(row.get('start') as Id)!
    const relative = row.get('key') as Key
    row.set('key', [...start.key, ...relative])
    row.set('own', start.own && relative.length === 0)
    row.delete('start')
  }
  return rows as Rows
}

/**
 * Everything shown at `path`: the Spots it resolves to & their mounted
 * layers, merged by precedence.
 */
export async function listingAt(
  { source, from, path, maxDepth = 10 }:
  {
    source: GraphTraversalSource
    from: GraphTraversal
    path: Array<string>
    maxDepth?: number
  },
) {
  const starts = await resolveSpots({ source, from, path, maxDepth })
  return assembleListing(await layerRows({ source, starts, maxDepth }))
}

type Row<T> = Map<keyof T, unknown>
interface Layer {
  id: Id
  key: Key
  own: boolean
  contents: Array<Map<string, unknown>>
  children: Array<Row<{
    edge: unknown
    uuid: Array<string>
    order: Array<number>
    name: string
    id: Id
    moved: number
    container: number
    contents: Array<Map<string, unknown>>
  }>>
}

const fromRow = <T>(row: Row<T>) => (
  Object.fromEntries(row) as unknown as T
)

export type Rows = Array<Row<Layer>>

/** `layerRows()`’s rows, once each, highest precedence first. */
const layersOf = (rows: Rows) => {
  const seen = new Set<Id>()
  return (
    rows
    .map((row) => fromRow<Layer>(row))
    .sort((a, b) => compareKeys(a.key, b.key))
    .filter(({ id }) => {
      if(seen.has(id)) return false
      seen.add(id)
      return true
    })
  )
}

/** Each layer’s own ranked Contents, highest precedence first. */
export const layerContents = (rows: Rows) => (
  layersOf(rows).map(({ id, contents }) => ({ id, contents: rankedContents(contents, id) }))
)

/** A link a listing shows: the highest layer’s of its uuid (FR-013). */
export interface VisibleLink {
  edge: string
  uuid?: string
  name: string
  /** Its target. */
  id: Id
  /** The Spot holding it. */
  layer: Id
  /** Whether `layer` is in the user’s own tree, by `CONTAINS` alone. */
  own: boolean
  moved: boolean
  container: boolean
  contents: Array<Content>
}

/** The links of `rows`’ layers a listing shows, highest layer first. */
export function visibleLinks(rows: Rows) {
  const listed = new Set<string>()
  const links: Array<VisibleLink> = []
  for(const layer of layersOf(rows)) {
    const held = new Set<string>()
    for(const row of layer.children) {
      const {
        edge, uuid: [uuid], order, name, id, moved, container, contents,
      } = fromRow(row)
      if(order.length > 0) {
        throw new Error(`MOUNT ${edgeId(edge)} is both a link & a layer.`)
      }
      if(uuid != null) {
        if(held.has(uuid)) {
          throw new Error(`Spot #${layer.id} mounts the link ${uuid} twice.`)
        }
        held.add(uuid)
        if(listed.has(uuid)) continue
        listed.add(uuid)
      }
      links.push({
        edge: edgeId(edge),
        ...(uuid == null ? {} : { uuid }),
        name,
        id,
        layer: layer.id,
        own: layer.own,
        moved: Number(moved) > 0,
        container: Number(container) > 0,
        contents: rankedContents(contents, id),
      })
    }
  }
  return links
}

/**
 * Merges layers in precedence order, as with a union mount: each
 * layer’s Contents are placed over the layers below (`overlay()`), &
 * same-named children merge.
 */
export function assembleListing(rows: Rows): Listing {
  const layers = layersOf(rows)
  const children = new Map<string, Child & { lists: Array<Array<Content>> }>()
  for(const link of visibleLinks(rows)) {
    const { name, id } = link
    let child = children.get(name)
    if(!child) {
      child = {
        name, ids: [], parents: [], contents: [], container: false, lists: [],
      }
      children.set(name, child)
    }
    if(child.ids.includes(id)) continue
    child.ids.push(id)
    child.parents.push(link.layer)
    child.container ||= link.container
    if(link.own && link.moved) child.moved = link.edge
    child.lists.push(link.contents)
  }

  return {
    layers: layers.map(({ id }) => id),
    contents: stack(layers.map(({ id, contents }) => rankedContents(contents, id))),
    children: [...children.values()].map(({ lists, ...child }) => (
      { ...child, contents: stack(lists) }
    )),
  }
}
