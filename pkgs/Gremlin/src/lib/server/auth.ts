import { error } from '@sveltejs/kit'
import { getRequestEvent } from '$app/server'
import { env } from '$env/dynamic/private'

const SESSION_COOKIE = 'mimis_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

async function getKey(): Promise<CryptoKey> {
  const secret = env.SESSION_SECRET
  if(!secret) throw new Error('SESSION_SECRET is not set')
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function toHex(buffer: ArrayBuffer): string {
  return (
    [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  )
}

async function sign(payload: string): Promise<string> {
  const key = await getKey()
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  )
  return `${payload}.${toHex(sig)}`
}

async function verify(token: string): Promise<string | null> {
  const lastDot = token.lastIndexOf('.')
  if(lastDot === -1) return null

  const payload = token.slice(0, lastDot)
  const expected = await sign(payload)
  if(token !== expected) return null

  return payload
}

export async function createSessionCookie(address: string): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE * 1000
  const payload = JSON.stringify({
    address: address.toLowerCase(), expires,
  })
  const token = await sign(payload)
  return (
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
  )
}

export async function parseSession(
  cookieHeader: string | null,
) {
  if(!cookieHeader) return null

  const match = (
    cookieHeader.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
  )
  if(!match) return null

  const token = match.slice(SESSION_COOKIE.length + 1)
  const payload = await verify(token)
  if(!payload) return null

  try {
    const session = JSON.parse(payload)
    if(Date.now() > session.expires) return null
    return session as { address: string, expires: number }
  } catch {
    return null
  }
}

export function clearSessionCookie(): string {
  return (
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  )
}

export async function getSessionAddress(opts: { throw?: boolean } = {}) {
  const { request } = getRequestEvent()
  const { address } = (
    (await parseSession(request.headers.get('cookie'))) ?? {}
  )
  if(opts.throw && !address) {
    throw error(401, 'Unauthorized: No valid session cookie found.')
  }
  return address ?? null
}
