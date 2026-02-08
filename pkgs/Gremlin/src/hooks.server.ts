import { type Handle, redirect } from '@sveltejs/kit'
import { resourceFor } from '$lib/resourceFor'
import { toHTTP, viewable } from '$lib'

export const handle: Handle = async ({ event, resolve }) => {
  const path = (
    event.url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  )
	if(viewable(path.at(-1))) {
    const { cid } = await resourceFor({ path }) ?? {}
    if(cid) {
      throw redirect(303, toHTTP({ cid }))
      // return new Response(null, {
      //   status: 303,
      //   headers: { Location: toHTTP({ cid }) },
      // })
    }
	}

	return await resolve(event)
};