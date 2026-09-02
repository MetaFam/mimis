import { type Handle } from '@sveltejs/kit'
import { env } from '$env/dynamic/public'

const editorOrigin = (
  (env.PUBLIC_EDITOR_URL || 'http://localhost:33333').replace(/\/+$/, '')
)

/** Routes the VS Code editor extension calls cross-origin. */
const corsPaths = /^\/api\/(fs|auth\/token)(\/|$)/

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const origin = event.request.headers.get('origin')
  const cors = (
    origin === editorOrigin && corsPaths.test(event.url.pathname)
  )

  if(cors && event.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin!) })
  }

  const response = await resolve(event)

  if(cors) {
    for(const [header, value] of Object.entries(corsHeaders(origin!))) {
      response.headers.set(header, value)
    }
  }

  return response
}
