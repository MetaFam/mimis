import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { verifyMessage } from 'viem'
import { parseSiweMessage, validateSiweMessage } from 'viem/siwe'
import { createSessionCookie } from '$lib/server/auth'
import { getNonceStore } from '$lib/server/nonces'

export const POST: RequestHandler = async ({ request, platform }) => {
  const { message, signature } = await request.json() as {
    message?: string, signature?: string
  }
  if(!message || !signature) {
    return json(
      { error: 'message and signature are required' },
      { status: 422 },
    )
  }

  const parsed = parseSiweMessage(message)
  const address = parsed.address?.toLowerCase()
  if(!address) {
    return json(
      { error: 'Invalid SIWE Message' },
      { status: 422 },
    )
  }

  const nonces = getNonceStore(platform)
  const storedNonce = await nonces.get(`nonce:${address}`)
  if(!storedNonce || storedNonce !== parsed.nonce) {
    return json(
      { error: 'Invalid Or Expired Nonce' },
      { status: 401 },
    )
  }

  const valid = {
    message: validateSiweMessage({
      message: parsed,
      domain: parsed.domain,
      nonce: storedNonce,
    }),
    recovery: verifyMessage({
      address: parsed.address!,
      message,
      signature: signature as `0x${string}`,
    }),
  }
  if(!await valid.message) {
    return json({ error: 'Invalid SIWE Message Fields' }, { status: 401 })
  }

  if(!await valid.recovery) {
    return json({ error: 'Invalid Signature' }, { status: 401 })
  }

  await nonces.delete(`nonce:${address}`)

  const cookie = await createSessionCookie(address)
  return json(
    { address },
    { headers: { 'Set-Cookie': cookie } },
  )
}
