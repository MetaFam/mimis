import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { parseSiweMessage, verifySiweMessage } from 'viem/siwe'
import { createSessionCookie } from '$lib/server/auth'

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

export const POST: RequestHandler = async ({ request, platform }) => {
  const { message, signature } = await request.json()
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
      { error: 'invalid SIWE message' },
      { status: 422 },
    )
  }

  const storedNonce = await platform!.env.NONCES.get(
    `nonce:${address}`,
  )
  if(!storedNonce || storedNonce !== parsed.nonce) {
    return json(
      { error: 'invalid or expired nonce' },
      { status: 401 },
    )
  }

  const valid = await verifySiweMessage(publicClient, {
    message,
    signature,
  })
  if(!valid) {
    return json({ error: 'invalid signature' }, { status: 401 })
  }

  await platform!.env.NONCES.delete(`nonce:${address}`)

  const cookie = await createSessionCookie(address)
  return json(
    { address },
    { headers: { 'Set-Cookie': cookie } },
  )
}
