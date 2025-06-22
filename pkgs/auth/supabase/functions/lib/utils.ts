import {
  cryptoRandomString
} from 'https://deno.land/x/crypto_random_string@1.0.0/mod.ts'
import { getIronSession } from 'https://esm.sh/iron-session@latest'
import {
  getCookies, setCookie,
} from "https://deno.land/std/http/mod.ts";

export const cors = (origin: string) => {
  const allowedOrigins = [
    /^http:\/\/localhost(:\d+)?/,
    /^https:\/\/code.trwb.live/,
  ]

  const headers = new Headers()
  if(allowedOrigins.some((exp) => exp.test(origin))) {
    headers.set('Access-Control-Allow-Origin', origin)
  }
  headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  )
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, *',
  )
  headers.set('Access-Control-Allow-Credentials', 'true')

  return headers
}

export const getNonce = ({ length = 13 }) => (
  cryptoRandomString({ length, type: 'alphanumeric' })
)

export const supaConfig = {
  url: (
    Deno.env.get('SUPABASE_URL')
    ?? (() => { throw new Error(
      'Missing $SUPABASE_URL.'
    ) })()
  ),
  serviceRoleKey: (
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    ?? (() => { throw new Error(
      'Missing $SUPABASE_SERVICE_ROLE_KEY.'
    ) })()
  ),
}

export const ironSessionConfig = {
  password: (
    Deno.env.get('SESSION_SECRET')
    ?? (() => { throw new Error('No `$SESSION_SECRET`.') })()
  ),
  cookieName: 'mobbing-iron-session',
  cookieOptions: {
    sameSite: 'None',
    partitioned: true,
    // httpOnly: false,
    // secure: Boolean(Deno.env.get('SECURE_SESSION') ?? false),
  },
}

export const getSession = ({ reqHeaders, resHeaders}) => (
  getIronSession({
    get: (name) => {
      const cookies = getCookies(reqHeaders)
      // console.debug({ name, val: cookies[name]?.match(/.{1,30}/g) })
      return cookies[name]
    },
    set: (...args) => {
      if(args.length > 3) {
        throw new Error(`${args.length} arguments passed to \`cookies.set\`.`)
      }
      let opts
      if(args.length === 3) {
        opts = args[2]
        opts.value = args[1]
      } else if(args.length === 2) {
        opts = args[1]
      }
      opts.name = args[0]
      setCookie(resHeaders, opts)
    },
    has: (name) => {
      const cookies = getCookies(reqHeaders)
      return !!cookies[name]
    },
    getAll: () => (
      getCookies(reqHeaders)
    ),
    delete: (name) => {
      deleteCookie(resHeaders, name)
    },
  }, ironSessionConfig)
)