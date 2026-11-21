import { query } from '$app/server'
import { getSessionAddress } from '#lib/server/auth.js'
import { pendingSpots } from '#lib/server/changes.js'
import { rethrow } from '#lib/server/errors.js'
import { g, verifyBase } from '#lib/server/janusgraph.js'

export type { PendingSpot } from '#lib/server/changes.js'

/** The session user’s pending Spots, staged & not. */
export const pending = query(async () => {
  try {
    const address = (await getSessionAddress({ throw: true }))!
    await verifyBase()
    const spots = await pendingSpots({ source: g(), address })
    return {
      staged: spots.filter(({ staged }) => staged),
      unstaged: spots.filter(({ staged }) => !staged),
    }
  } catch(err) {
    rethrow('Pending', err)
  }
})
