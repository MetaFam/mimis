import { describe, expect, it } from 'vitest'
import { PAGE_SIZE, partsOf } from '#lib/search.js'

describe('partsOf', () => {
  it.each(['', '   ', '/', '//', ' / '])(
    'finds nothing to search for in %j',
    (query) => {
      expect(partsOf(query)).toEqual([])
    },
  )

  it.each([
    ['emma/', ['emma']],
    ['/emma', ['emma']],
    ['austen//emma', ['austen', 'emma']],
    ['/austen/emma/', ['austen', 'emma']],
  ])('drops the empty parts of %j', (query, parts) => {
    expect(partsOf(query)).toEqual(parts)
  })

  it.each([
    ['publication date', ['publication date']],
    ['a / b', ['a ', ' b']],
    ['Émma ✨', ['Émma ✨']],
    ['a.b(c)[d]\\E', ['a.b(c)[d]\\E']],
  ])('keeps %j exactly as typed', (query, parts) => {
    expect(partsOf(query)).toEqual(parts)
  })
})

describe('PAGE_SIZE', () => {
  it('is a hundred', () => {
    expect(PAGE_SIZE).toBe(100)
  })
})
