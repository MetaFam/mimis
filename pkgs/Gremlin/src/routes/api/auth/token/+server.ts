import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import {
  createSessionToken, getSessionAddress, redeemExchangeCode,
} from '$lib/server/auth'

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

/**
 * Trades an exchange code from `/api/auth/code` for a token. The
 * code stands in for the session here, so no cookie is needed:
 * the extension has neither when it redeems.
 */
export const POST: RequestHandler = async ({ request }) => {
  const { code } = await request.json() as { code?: string }
  if(!code) error(400, 'No `code` given.')

  const address = await redeemExchangeCode(code)
  if(!address) {
    error(401, 'Unauthorized: the code is invalid, expired, or spent.')
  }

  const { token, expires } = await createSessionToken(address)
  return json({ address, token, expires })
}
