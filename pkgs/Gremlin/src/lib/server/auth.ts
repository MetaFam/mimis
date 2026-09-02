import { error } from '@sveltejs/kit'
import { getRequestEvent } from '$app/server'
import { env } from '$env/dynamic/private'

const SESSION_COOKIE = 'mimis_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
// Long enough for a cold editor to boot & get its extension host
// running; single use, not the clock, is what makes a code safe.
const EXCHANGE_MAX_AGE = 60 * 5 // seconds

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

export async function parseToken(token: string) {
  const payload = await verify(token)
  if(!payload) return null

  try {
    const session = JSON.parse(payload)
    // Exchange codes are signed with the same key: they buy a
    // token, but are not one.
    if(session.kind != null) return null
    if(Date.now() > session.expires) return null
    return session as { address: string, expires: number }
  } catch {
    return null
  }
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

  return parseToken(match.slice(SESSION_COOKIE.length + 1))
}

/** Issue a bare session token, e.g. for `Authorization: Bearer` use. */
export async function createSessionToken(address: string) {
  const expires = Date.now() + SESSION_MAX_AGE * 1000
  const payload = JSON.stringify({
    address: address.toLowerCase(), expires,
  })
  return { token: await sign(payload), expires }
}

/**
 * Nonces already redeemed. Single use is only enforced for as long
 * as the process lives; the minute-long expiry is the guarantee
 * that survives a restart or a second instance.
 */
const spent = new Map<string, number>()

function spend({ nonce, expires }: { nonce: string, expires: number }) {
  const now = Date.now()
  for(const [used, expiry] of spent) {
    if(expiry < now) spent.delete(used) // expired: replay barred anyway
  }
  if(spent.has(nonce)) return false
  spent.set(nonce, expires)
  return true
}

/**
 * A short-lived, single-use code, safe to hand off somewhere as
 * leaky as a URL: all it buys is one session token.
 */
export async function createExchangeCode(address: string) {
  const expires = Date.now() + EXCHANGE_MAX_AGE * 1000
  const payload = JSON.stringify({
    kind: 'code',
    address: address.toLowerCase(),
    expires,
    nonce: crypto.randomUUID(),
  })
  return { code: await sign(payload), expires }
}

/** The address the code was issued to, & only once. */
export async function redeemExchangeCode(code: string) {
  const payload = await verify(code)
  if(!payload) return null

  try {
    const { kind, address, expires, nonce } = JSON.parse(payload)
    if(kind !== 'code') return null
    if(Date.now() > expires) return null
    if(!spend({ nonce, expires })) return null
    return address as string
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
  const bearer = (
    request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  )
  const { address } = (
    (bearer ? await parseToken(bearer) : null)
    ?? (await parseSession(request.headers.get('cookie')))
    ?? {}
  )
  if(opts.throw && !address) {
    throw error(401, 'Unauthorized: No valid session cookie or bearer token found.')
  }
  return address ?? null
}
