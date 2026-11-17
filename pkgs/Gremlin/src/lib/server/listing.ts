import gremlin from 'gremlin'

const { statics: __, order: Order } = gremlin.process
type GraphTraversal = InstanceType<typeof gremlin.process.GraphTraversal>
type Id = string | number

export interface Content {
  id: Id
  type: string
  cid: string
  size: number
  /** The Spot, the cursor or one of its mounted layers, holding it. */
  spot: Id
}

export interface Child {
  /** The `path` of the `CONTAINS` edge(s) leading to it. */
  name: string
  /** Every Spot with this name, highest precedence first. */
  ids: Array<Id>
  /** The layer whose `CONTAINS` edge leads to each of `ids`. */
  parents: Array<Id>
  /** Its own `Content`s, merged across same-named Spots. */
  contents: Array<Content>
  /** Has `CONTAINS` or `MOUNT` edges, so it can be browsed into. */
  container: boolean
}

export interface Listing {
  /** The Spots the path resolves to with their mounted layers. */
  layers: Array<Id>
  /** `Content` attached to the cursor or its mounted layers. */
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
const withMounts = (
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

/**
 * Current (unsuperseded) `Content`s with their `Blob`s, newest first
 * within each `order`.
 */
export const contentsOf = () => (
  __.outE('AS')
  .inV()
  .hasLabel('Content')
  .has('type')
  .not(__.inE('PREVIOUS'))
  .where(__.out('IS').hasLabel('Blob'))
  .order()
  .by(__.coalesce(__.values('order'), __.constant(0)))
  .by(__.coalesce(__.values('createdAt'), __.constant('')), Order.desc)
  .project('id', 'type', 'cid', 'size')
  .by(__.id())
  .by('type')
  .by(__.out('IS').hasLabel('Blob').values('cid'))
  .by(
    __.out('IS').hasLabel('Blob')
    .coalesce(__.values('size'), __.constant(0))
  )
  .fold()
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
  contents: Array<Row<Content>>
  children: Array<Row<Omit<Child, 'ids' | 'parents'> & { id: Id }>>
}

const fromRow = <T>(row: Row<T>) => (
  Object.fromEntries(row) as unknown as T
)

/**
 * Merges layers in precedence order, as with a union mount: there is
 * one `Content` per type, the first found, so a layer hides that type
 * in later layers, & same-named children merge.
 */
export function assembleListing(rows: Array<Row<Layer>>): Listing {
  const seen = new Set<Id>()
  const layers = (
    rows
    .map((row) => fromRow<Layer>(row))
    .sort((a, b) => compareKeys(a.key, b.key))
    .filter(({ id }) => {
      if(seen.has(id)) return false
      seen.add(id)
      return true
    })
  )

  const merge = (
    { into, from, spot }:
    { into: Array<Content>, from: Array<Row<Content>>, spot: Id }
  ) => {
    const held = new Set(into.map(({ type }) => type))
    for(const content of from.map((row) => fromRow<Content>(row))) {
      if(!held.has(content.type)) {
        held.add(content.type)
        into.push({ ...content, size: Number(content.size), spot })
      }
    }
  }

  const contents: Array<Content> = []
  const children = new Map<string, Child>()
  for(const layer of layers) {
    merge({ into: contents, from: layer.contents, spot: layer.id })
    for(const row of layer.children) {
      const { name, id, container, contents: own } = fromRow(row)
      let child = children.get(name)
      if(!child) {
        child = {
          name, ids: [], parents: [], contents: [], container: false,
        }
        children.set(name, child)
      }
      if(child.ids.includes(id)) continue
      child.ids.push(id)
      child.parents.push(layer.id)
      child.container ||= Number(container) > 0
      merge({
        into: child.contents,
        from: own as unknown as Array<Row<Content>>,
        spot: id,
      })
    }
  }

  return {
    layers: layers.map(({ id }) => id),
    contents,
    children: [...children.values()],
  }
}
