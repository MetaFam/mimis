import { type Handle, redirect } from '@sveltejs/kit'
import { resourceFor } from '$lib/resourceFor'
import { toHTTP } from '$lib'

export const handle: Handle = async ({ event, resolve }) => {
  const path = (
    event.url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  )
	if(path.at(-1) === 'svg') {
    const resource = await resourceFor({ path })
    if(resource) {
      throw redirect(303, toHTTP({ cid: resource.cid }))
    }
	}

	return await resolve(event)
};