import { query } from '$app/server'
import { error } from '@sveltejs/kit'
import { clearSessionCookie } from '$lib/server/auth.ts'

export const logout = query(
  async () => {
    try {
      return await clearSessionCookie()
    } catch(err) {
      console.error({ logout: err })
      throw error(500, 'Failed to clear session.')
    }
  },
)