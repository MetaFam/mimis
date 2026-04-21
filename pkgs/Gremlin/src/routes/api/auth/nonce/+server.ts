import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { v7 as uuidV7 } from 'uuid'
import { getNonceStore } from '$lib/server/nonces'

export const POST: RequestHandler = async ({ request, platform }) => {
  const { address } = await request.json() as { address: string }
  if(!address) {
    return json({ error: 'Address Is Required' }, { status: 422 })
  }

  const nonces = getNonceStore(platform)
  const nonce = uuidV7().replaceAll('-', '')
  await nonces.put(
    `nonce:${address.toLowerCase()}`,
    nonce,
    { expirationTtl: 300 },
  )

  return json({ nonce })
}