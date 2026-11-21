import { describe, expect, it } from 'vitest'
import { seal, unseal } from '#lib/server/auth.js'

describe('seal', () => {
  const payload = JSON.stringify({ address: '0xb0b', σοφία: '✨' })

  it('unseals what it sealed', async () => {
    expect(await unseal(await seal(payload))).toBe(payload)
  })

  it('unseals a tampered token to null', async () => {
    const token = await seal(payload)
    const at = token.indexOf('b0b')
    const tampered = `${token.slice(0, at)}b0c${token.slice(at + 3)}`
    expect(await unseal(tampered)).toBeNull()
  })

  it('unseals a token without a seal to null', async () => {
    expect(await unseal(payload.replaceAll('.', ''))).toBeNull()
  })
})
