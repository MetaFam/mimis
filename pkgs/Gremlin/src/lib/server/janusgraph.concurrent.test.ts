import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { assertLocalGraph } from '#lib/server/backfill.js'
import { edgeId, g, inTransaction } from '#lib/server/janusgraph.js'
import { addSpot, link, type Id } from '#lib/server/testing.js'
import settings from '#lib/settings.svelte.js'

// Commits (plan.md, Complexity Tracking): a commit only fails on a lock
// another session holds, so this links two throwaway Spots for real &
// drops them afterwards.

let from: Id
let to: Id
let edge: string

beforeEach(async () => {
  assertLocalGraph(settings.janusGraphURL, { remote: false })
  ;[from, to] = [await addSpot(g()), await addSpot(g())]
  await link(g(), { from, to, name: 'held' })
  edge = edgeId((await g().V(from).outE('CONTAINS').id().next()).value)
})

afterEach(async () => {
  await g().V(from, to).drop().toList()
})

describe('inTransaction', () => {
  it('reports a failed commit, not the rollback its closed session refuses', async () => {
    const holder = g().tx()
    try {
      // A read lock that the drop’s commit waits on until it times out.
      await holder.begin().E(edge).toList()
      await expect(inTransaction((source) => source.E(edge).drop().toList()))
      .rejects.toThrow(/Could not commit transaction/)
    } finally {
      await holder.rollback()
    }
    expect(await g().E(edge).count().next()).toMatchObject({ value: 1 })
  })
})
