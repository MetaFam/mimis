import gremlin from 'gremlin'
import settings from '#lib/settings.svelte.js'
import { g } from '#lib/server/janusgraph.js'

const { statics: __ } = gremlin.process
type GraphTraversalSource = (
  InstanceType<typeof gremlin.process.GraphTraversalSource>
)
export type Id = string | number
export interface Tree { [name: string]: Tree }

const BATCH = 1_000

/** A transaction to seed & search in, & a rollback to undo it all. */
export function transaction() {
  const { hostname } = new URL(settings.janusGraphURL)
  if(!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error(
      `Refusing to run graph tests against ${settings.janusGraphURL}.`
    )
  }
  const tx = g().tx()
  return { source: tx.begin(), rollback: () => tx.rollback() }
}

const idOf = async (traversal: { next: () => Promise<{ value: unknown }> }) => {
  const { value } = await traversal.next()
  if(typeof value !== 'number' && typeof value !== 'string') {
    throw new Error(`Expected a vertex id, got ${JSON.stringify(value)}.`)
  }
  return value
}

export const addSpot = (source: GraphTraversalSource) => (
  idOf(source.addV('Spot').id())
)

const addedOne = async (
  traversal: { next: () => Promise<{ value: unknown }> },
) => {
  const { value } = await traversal.next()
  if(Number(value) !== 1) {
    throw new Error(`Expected to add one edge, added ${value}.`)
  }
}

export const link = (
  source: GraphTraversalSource,
  { from, to, name }: { from: Id, to: Id, name: string },
) => (
  addedOne(
    source.V(from).addE('CONTAINS').to(__.V(to)).property('path', name)
    .count()
  )
)

export const mount = (
  source: GraphTraversalSource,
  { from, to, order = 0 }: { from: Id, to: Id, order?: number },
) => (
  addedOne(
    source.V(from).addE('MOUNT').to(__.V(to)).property('order', order)
    .count()
  )
)

/** Gives `to` a current `Content` of `type`, backed by a `Blob`. */
export async function attach(
  source: GraphTraversalSource,
  { to, type, cid, order = 0 }:
  { to: Id, type: string, cid: string, order?: number },
) {
  await addedOne(
    source.V(to)
    .as('spot')
    .addV('Content')
    .property('type', type)
    .property('order', order)
    .as('content')
    .addE('AS')
    .from_('spot')
    .to('content')
    .addV('Blob')
    .property('cid', cid)
    .property('size', 1)
    .as('blob')
    .addE('IS')
    .from_('content')
    .to('blob')
    .count()
  )
}

/**
 * Builds `tree` under a new root Spot. Its ids by slash-joined path,
 * with the root at `''`.
 */
export async function seed(source: GraphTraversalSource, tree: Tree) {
  const ids = new Map<string, Id>([['', await addSpot(source)]])
  const grow = async (branch: Tree, parent: string) => {
    for(const [name, sub] of Object.entries(branch)) {
      const at = parent ? `${parent}/${name}` : name
      const id = await addSpot(source)
      await link(source, { from: ids.get(parent)!, to: id, name })
      ids.set(at, id)
      await grow(sub, at)
    }
  }
  await grow(tree, '')
  return ids
}

/** Adds a child Spot under `under` for each of `names`, in batches. */
export async function seedWide(
  source: GraphTraversalSource,
  { under, names }: { under: Id, names: Array<string> },
) {
  for(let start = 0; start < names.length; start += BATCH) {
    const batch = names.slice(start, start + BATCH)
    const { value: added } = await (
      source.inject(batch)
      .unfold()
      .as('name')
      .addV('Spot')
      .as('spot')
      .addE('CONTAINS')
      .from_(__.V(under))
      .to('spot')
      .property('path', __.select('name'))
      .count()
      .next()
    )
    if(Number(added) !== batch.length) {
      throw new Error(`Seeded ${added} of ${batch.length} Spots.`)
    }
  }
}
