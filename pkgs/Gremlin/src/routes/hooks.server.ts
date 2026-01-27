import { type Handle, redirect } from '@sveltejs/kit'
import { resourceFor } from '$lib/resourceFor'
import { toHTTP } from '$lib'

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.endsWith('/svg')) {
    const resource = resourceFor(
      event.url.pathname.split('/').filter(Boolean)
    )
    if(resource) {
      throw redirect(303, toHTTP({ cid: resource.cid }))
    }
    return new Response('custom response');
	}

	const response = await resolve(event);
	return response;
};