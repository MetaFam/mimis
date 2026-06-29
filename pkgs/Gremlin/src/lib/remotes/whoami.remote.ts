import { query } from '$app/server'
import { error } from '@sveltejs/kit'
import { getSessionAddress } from '$lib/server/auth.ts'

export const whoami = query(
  async () => {
    try {
      return await getSessionAddress()
    } catch(err) {
      console.error({ whoami: err })
      throw error(500, 'Failed to retrieve session address.')
    }
  },
)