import gremlin from 'gremlin'
import { error } from '@sveltejs/kit'
import { pendingSpots, spotIsPending, treeOf } from '#lib/server/changes.js'
import {
  assertOwned, writeAll, type GraphTraversalSource, type Id,
} from '#lib/server/janusgraph.js'

const { statics: __ } = gremlin.process

const flag = (id: Id, staged: boolean) => (
  staged ? __.V(id).property('staged', true) : __.V(id).properties('staged').drop()
)

/**
 * Stages or unstages Spots by id, or stages every pending Spot. How
 * many pending Spots are staged after.
 */
export async function stageSpots(
  args: { source: GraphTraversalSource, address: string } & (
    | { ids: Array<Id>, staged: boolean }
    | { all: true }
  ),
) {
  const { source, address } = args
  const pending = await pendingSpots({ source, address })
  const isPending = new Set(pending.map(({ id }) => id))
  const now = new Set(pending.filter(({ staged }) => staged).map(({ id }) => id))
  const [ids, staged] = 'all' in args ? [[...isPending], true] : [args.ids, args.staged]

  if(!('all' in args)) {
    for(const id of ids) {
      await assertOwned({ source, ids: { Spot: id }, address })
      if(staged && !isPending.has(id)) {
        throw error(400, `Spot #${id} has nothing to publish.`)
      }
    }
  }
  await writeAll(source, ids.map((id) => flag(id, staged)))
  for(const id of ids) {
    if(staged) now.add(id)
    else now.delete(id)
  }
  return { staged: now.size }
}

/** Unstages the staged Spots with nothing left to publish (R19). */
export async function cleanStaged(
  { source, address }: { source: GraphTraversalSource, address: string },
) {
  const { spots, contents } = await treeOf({ source, address })
  const stale = (
    [...spots.values()]
    .filter((spot) => spot.staged && !spotIsPending(spot, contents))
    .map(({ id }) => id)
  )
  await writeAll(source, stale.map((id) => flag(id, false)))
  return stale
}
