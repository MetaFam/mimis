import { type Handle, redirect } from '@sveltejs/kit'
import { resourceFor } from '$lib/resourceFor'
import { toHTTP, viewable } from '$lib'
import { parseSession } from '$lib/server/auth'

export const handle: Handle = async ({ event, resolve }) => {
  // const { address } = await parseSession(
  //   event.request.headers.get('cookie'),
  // )
  // event.locals.address = address

  // const path = (
  //   event.url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  // )
	// if(viewable(path.at(-1))) {
  //   const { cid } = await resourceFor({ path }) ?? {}
  //   if(cid) {
  //     throw redirect(303, toHTTP({ cid }))
  //   }
	// }

	return await resolve(event)
};