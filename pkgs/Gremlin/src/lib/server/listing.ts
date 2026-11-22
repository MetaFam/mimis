import gremlin from 'gremlin'
import { rank } from '#lib/rank.js'

const { statics: __, order: Order } = gremlin.process
type GraphTraversal = InstanceType<typeof gremlin.process.GraphTraversal>
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
  /** The `path` of the `CONTAINS` edge(s) leading to it. */
  name: string
  /** Every Spot with this name, highest precedence first. */
  ids: Array<Id>
  /** The layer whose `CONTAINS` edge leads to each of `ids`. */
  parents: Array<Id>
  /** Its own `Content`s, merged across same-named Spots, best first. */
  contents: Array<Content>
  /** Has `CONTAINS` or `MOUNT` edges, so it can be browsed into. */
  container: boolean
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
 * A traversal’s precedence: the `order` of each `MOUNT` taken, with
 * a `CONTAINS` boundary between path segments. Sorting these
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
    __.hasLabel('MOUNT'),
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

const childrenOf = () => (
  __.outE('CONTAINS')
  .project('name', 'id', 'container', 'contents')
  .by('path')
  .by(__.inV().id())
  .by(__.inV().outE('CONTAINS', 'MOUNT').limit(1).count())
  .by(__.inV().flatMap(contentsOf()))
  .fold()
)

/**
 * Every Spot a path could resolve to, following the mounts along the
 * way but not those of the Spots it ends at. Since resolution
 * backtracks, a path names a set of Spots, ranked by `precedence()`.
 */
export function resolvePath(
  { from, path, maxDepth = 10 }:
  { from: GraphTraversal, path: Array<string>, maxDepth?: number }
) {
  let traversal = from
  for(const [idx, element] of path.entries()) {
    traversal = (
      withMounts({ traversal, label: `segment:${idx}`, maxDepth })
      .outE('CONTAINS')
      .has('path', element)
      .inV()
    )
  }
  return traversal
}

/**
 * Every Spot a path could resolve to, each expanded into its mounted
 * layers, with each layer’s own `Content`s & `CONTAINS` children.
 */
export function listingTraversal(
  { from, path, maxDepth = 10 }:
  { from: GraphTraversal, path: Array<string>, maxDepth?: number }
) {
  return (
    withMounts({
      traversal: resolvePath({ from, path, maxDepth }),
      label: 'cursor',
      maxDepth,
    })
    .project('id', 'key', 'contents', 'children')
    .by(__.id())
    .by(precedence())
    .by(contentsOf())
    .by(childrenOf())
  )
}

type Row<T> = Map<keyof T, unknown>
interface Layer {
  id: Id
  key: Key
  contents: Array<Map<string, unknown>>
  children: Array<Row<Omit<Child, 'ids' | 'parents' | 'contents'> & {
    id: Id
    contents: Array<Map<string, unknown>>
  }>>
}

const fromRow = <T>(row: Row<T>) => (
  Object.fromEntries(row) as unknown as T
)

export type Rows = Array<Row<Layer>>

/** `listingTraversal()`’s rows, once each, highest precedence first. */
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

/**
 * Merges layers in precedence order, as with a union mount: each
 * layer’s Contents are placed over the layers below (`overlay()`), &
 * same-named children merge.
 */
export function assembleListing(rows: Rows): Listing {
  const layers = layersOf(rows)

  const children = new Map<string, Child & { lists: Array<Array<Content>> }>()
  for(const layer of layers) {
    for(const row of layer.children) {
      const { name, id, container, contents } = fromRow(row)
      let child = children.get(name)
      if(!child) {
        child = {
          name, ids: [], parents: [], contents: [], container: false, lists: [],
        }
        children.set(name, child)
      }
      if(child.ids.includes(id)) continue
      child.ids.push(id)
      child.parents.push(layer.id)
      child.container ||= Number(container) > 0
      child.lists.push(rankedContents(contents, id))
    }
  }

  return {
    layers: layers.map(({ id }) => id),
    contents: stack(layers.map(({ id, contents }) => rankedContents(contents, id))),
    children: [...children.values()].map(({ lists, ...child }) => (
      { ...child, contents: stack(lists) }
    )),
  }
}
