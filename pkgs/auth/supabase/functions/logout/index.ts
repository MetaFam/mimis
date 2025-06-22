import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { cors, getSession } from '../lib/utils.ts'

serve(async (req) => {
  const { method, headers: reqHeaders } = req
  const origin = reqHeaders.get('Origin')
  const headers = cors(origin)

  try {
    if(method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    const iron = await getSession({
      reqHeaders, resHeaders: headers,
    })
    iron.destroy()

    headers.append('Content-Type', 'text/plain')
    return new Response('done', { headers })
  } catch(err) {
    console.error({ err })
    headers.append('Content-Type', 'appplication/json')
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500 }
    )
  }
})