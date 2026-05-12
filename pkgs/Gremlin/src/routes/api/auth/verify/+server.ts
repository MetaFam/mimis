import { json, error } from '@sveltejs/kit'
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
    throw error(422, 'Message and signature are required')
  }

  const parsed = parseSiweMessage(message)
  const address = parsed.address?.toLowerCase()
  if(!address) {
    throw error(422, 'Invalid SIWE Message')
  }

  const nonces = getNonceStore(platform)
  const storedNonce = await nonces.get(`nonce:${address}`)
  if(!storedNonce || storedNonce !== parsed.nonce) {
    throw error(401, 'Invalid Or Expired Nonce')
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
    throw error(401, 'Invalid SIWE Message Fields')
  }

  if(!await valid.recovery) {
    throw error(401, 'Invalid Signature')
  }

  await nonces.delete(`nonce:${address}`)

  const cookie = await createSessionCookie(address)
  return json(
    { address },
    { headers: { 'Set-Cookie': cookie } },
  )
}
