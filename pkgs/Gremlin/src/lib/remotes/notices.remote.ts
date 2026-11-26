import { query } from '$app/server'
import { getSessionAddress } from '#lib/server/auth.js'
import { rethrow } from '#lib/server/errors.js'
import { g } from '#lib/server/janusgraph.js'
import { noticesFor } from '#lib/server/renames.js'

export type { Notice } from '#lib/server/renames.js'

/** The signed-in user’s notices of moved links, or none if signed out. */
export const notices = query(async () => {
  try {
    const address = await getSessionAddress()
    return address ? await noticesFor({ source: g(), address }) : []
  } catch(err) {
    rethrow('Notices', err)
  }
})
