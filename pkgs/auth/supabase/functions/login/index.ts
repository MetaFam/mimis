import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SiweMessage, SiweErrorType } from 'https://esm.sh/siwe'
import {
  SignJWT,
} from 'https://deno.land/x/jose@v5.2.2/index.ts'
import { Database } from '../lib/database.types.ts'
import { cors, getSession } from '../lib/utils.ts'
import {
  decodeBase64
} from 'https://deno.land/std/encoding/base64.ts'

function createErrorResponse({
  error,
  headers,
  statusCode = 400
}: {
  error: Error | string,
  headers: Headers,
  statusCode?: number,
}) {
  console.error({ error })
  headers.append('Content-Type', 'application/json')
  return new Response(
    JSON.stringify({ error: error.message ?? error }),
    { status: statusCode, headers },
  )
}

serve(async (req) => {
  const { method, headers: reqHeaders } = req
  const origin = reqHeaders.get('Origin')
  const headers = cors(origin)

  if (method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    )

    const iron = await getSession({
      reqHeaders, resHeaders: headers,
    })
    const { message, signature } = await req.json()
    const msg = new SiweMessage(message)
    const { data: { address, chainId } } = (
      await msg.verify({ signature, nonce: iron.nonce })
    )

    iron.nonce = undefined
    iron.address = address
    iron.chainId = chainId
    await iron.save();

    const { data: byAddy, error } = (
      await supabase.from('userinfo').upsert(
        [{ address }], { onConflict: 'address' },
      )
      .single()
      .select()
    )
    if(error) {
      return createErrorResponse({ error, headers })
    }

    let authedUser
    if(!byAddy.user_id) {
      const { data: { user }, error: lookupError } = (
        await supabase.auth.admin.createUser({
          email: `${address}@ethereum.email`,
          email_confirm: true,
        })
      )
      if(lookupError) {
        return createErrorResponse({
          error: lookupError, headers
        })
      }
      authedUser = user

      const { updateError } = (
        await supabase.from('userinfo').update({
          updated_at: undefined,
          user_id: authedUser.id,
        })
        .eq('address', address)
        .select()
      )
      if(updateError) {
        return createErrorResponse({ error: updateError, headers })
      }
    } else {
      const { data: { user }, error } = (
        await supabase.auth.admin.getUserById(byAddy.user_id)
      )
      if (error) {
        return createErrorResponse({ error, headers })
      }
      authedUser = user
    }

    const jwtSecret = Deno.env.get('JWT_SECRET')
    if (!jwtSecret) {
      throw new Error(
        'Please set the $JWT_SECRET environment variable.'
      )
    }

    let rawJWTSecret = jwtSecret
    if(Deno.env.get('JWT_SECRET_B64')) {
      rawJWTSecret = decodeBase64(jwtSecret)
    }
    rawJWTSecret = new TextEncoder().encode(rawJWTSecret)

    // const key = await crypto.subtle.importKey(
    //   'raw', // format of the key's data
    //   rawJWTSecret,
    //   { name: 'HMAC', hash: 'SHA-256' },
    //   false, // whether the key is extractable
    //   ['sign', 'verify'], // key usages
    // )

    // const payload: Payload = {
    //   iss: 'https://code.trwb.live',
    //   sub: authedUser.id,
    //   aud: authedUser.aud,
    //   email: authedUser.email,
    //   role: authedUser.role,
    //   address,
    //   exp: new Date().getTime() + 1000 * 60 * 60 * 24 * 7,
    // }
    // const header: Header = { alg: 'HS256', typ: 'JWT' }
    // const jwt = await createJWT(header, payload, key)

    const jwt = (
      await new SignJWT({ address, role: authedUser.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('https://code.trwb.live')
      .setAudience(authedUser.aud)
      .setSubject(authedUser.id)
      .setExpirationTime('7d')
      .sign(rawJWTSecret)
    )

    headers.append('Content-Type', 'text/plain')
    return new Response(jwt, { headers })
  } catch (error) {
    switch (error) {
      case SiweErrorType.INVALID_NONCE:
      case SiweErrorType.INVALID_SIGNATURE: {
        return createErrorResponse({
          error, headers, statusCode: 422,
        })
      }
      default: {
        return createErrorResponse({
          error, headers, statusCode: 400,
        })
      }
    }
  }
})