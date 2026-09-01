import { type Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  // const path = (
  //   event.url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  // )
  // const { cid } = await resourceFor({ path, onlyViewable: true }) ?? {}
  // if(cid) {
  //   redirect(303, toHTTP({ cid }))
  // }

  return await resolve(event)
}