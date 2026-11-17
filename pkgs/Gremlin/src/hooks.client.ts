import type { HandleClientError } from '@sveltejs/kit/hooks'

export const handleError: HandleClientError = (
  async ({ kind, error, event }) => {
    console.debug({ kind, error, event })
    return error
  }
)
