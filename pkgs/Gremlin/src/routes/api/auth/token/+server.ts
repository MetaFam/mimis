import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { createSessionToken, getSessionAddress } from '$lib/server/auth'

/**
 * Returns a bearer token for the logged-in user, for use by
 * clients that can’t share the session cookie (e.g. the VS Code
 * web editor’s `mimis-fs` extension).
 */
export const GET: RequestHandler = async () => {
  const address = await getSessionAddress({ throw: true })
  const { token, expires } = await createSessionToken(address!)
  return json({ address, token, expires })
}
