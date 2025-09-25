import { json } from '@sveltejs/kit'

export async function POST({ request }: { request: Request }) {
	const tx = await request.json()

  console.debug({ tx })

	return json({})
}