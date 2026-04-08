import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { v7 as uuidV7 } from 'uuid'

export const POST: RequestHandler = async ({ request, platform }) => {
  const { address } = await request.json()
  if(!address) {
    return json({ error: 'address is required' }, { status: 422 })
  }

  const nonce = uuidV7().replaceAll('-', '')
  await platform!.env.NONCES.put(
    `nonce:${address.toLowerCase()}`,
    nonce,
    { expirationTtl: 300 },
  )

  return json({ nonce })
}