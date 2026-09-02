import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { createExchangeCode, getSessionAddress } from '$lib/server/auth'

/**
 * Returns a single-use, minute-long code for the logged-in user.
 * The file browser hands it to the editor in the `folder` URL,
 * where the extension trades it for a bearer token.
 */
export const GET: RequestHandler = async () => {
  const address = await getSessionAddress({ throw: true })
  const { code, expires } = await createExchangeCode(address!)
  return json({ code, expires })
}
