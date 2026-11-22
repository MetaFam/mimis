import { describe, expect, it } from 'vitest'
import { sizeOf } from '#lib/size.js'

describe('sizeOf', () => {
  it.each([
    [0, '0 B'],
    [1023, '1023 B'],
    [1024, '1.0 KiB'],
    [1536, '1.5 KiB'],
    [5 * 1024 ** 2, '5.0 MiB'],
    [3 * 1024 ** 5, '3072.0 TiB'],
  ])('gives %i bytes as %s', (bytes, shown) => {
    expect(sizeOf(bytes)).toBe(shown)
  })
})
