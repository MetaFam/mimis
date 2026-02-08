import type { HandleClientError } from '@sveltejs/kit'

export const handleError: HandleClientError = (
  async ({ error, event, status, message }) => {
	  console.debug({ error, event, status, message })
  	return error
  }
)