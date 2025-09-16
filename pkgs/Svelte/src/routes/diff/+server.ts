import { json } from '@sveltejs/kit'

export async function POST({ request }: { request: Request}) {
	const { nodes, relationships } = await request.json()

  console.debug({ nodes, relationships })

	return json({})
}