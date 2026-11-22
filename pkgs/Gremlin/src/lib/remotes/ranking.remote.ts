import * as v from 'valibot'
import { command, query } from '$app/server'
import { getSessionAddress } from '#lib/server/auth.js'
import { rethrow } from '#lib/server/errors.js'
import { g, inTransaction, verifyBase } from '#lib/server/janusgraph.js'
import { placeContent, rankingAt } from '#lib/server/ranking.js'
import { listing } from './listing.remote'
import { pending } from './pending.remote'

const PathSchema = v.object({ path: v.array(v.string()) })

/** The Contents at `path`, best first, marked with whether they’re the user’s. */
export const ranking = query(PathSchema, async ({ path }) => {
  try {
    const address = (await getSessionAddress({ throw: true }))!
    await verifyBase()
    return await rankingAt({ source: g(), address, path: path.filter(Boolean) })
  } catch(err) {
    rethrow('Ranking', err)
  }
})

const PlaceSchema = v.object({
  path: v.array(v.string()),
  content: v.union([v.number(), v.string()]),
  index: v.pipe(v.number(), v.safeInteger(), v.minValue(0)),
})

/** Moves a Content at `path` to `index` in the user’s view of it. */
export const place = command(PlaceSchema, async ({ path, content, index }) => {
  try {
    const address = (await getSessionAddress({ throw: true }))!
    path = path.filter(Boolean)
    await inTransaction((source) => placeContent({
      source, address, path, content, index, now: new Date().toISOString(),
    }))
    void ranking({ path }).refresh()
    void listing({ path }).refresh()
    void listing({ path: path.slice(0, -1) }).refresh()
    void pending().refresh()
  } catch(err) {
    rethrow('Placing', err)
  }
})
