import { describe, expect, it } from 'vitest'
import { PAGE_SIZE, partsOf } from '#lib/search.js'

describe('partsOf', () => {
  it.each(['', '   ', '/', '//', ' / ', '""', '" "', '"'])(
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
    ['austen  emma ', ['austen', 'emma']],
  ])('drops the empty parts of %j', (query, parts) => {
    expect(partsOf(query)).toEqual(parts)
  })

  it.each([
    ['publication date', ['publication', 'date']],
    ['a / b', ['a', 'b']],
    ['Émma ✨', ['Émma', '✨']],
    ['austen\temma', ['austen', 'emma']],
  ])('splits %j at its spaces', (query, parts) => {
    expect(partsOf(query)).toEqual(parts)
  })

  it.each([
    ['"publication date"', ['publication date']],
    ['austen/"publication date" emma', ['austen', 'publication date', 'emma']],
    ['"a "/" b"', ['a ', ' b']],
    ['"Émma ✨"', ['Émma ✨']],
    ['"AC/DC"', ['AC/DC']],
    ['a.b(c)[d]\\E', ['a.b(c)[d]\\E']],
  ])('keeps the parts of %j exactly as typed', (query, parts) => {
    expect(partsOf(query)).toEqual(parts)
  })

  it.each([
    ['"publication da', ['publication da']],
    ['austen "collected em', ['austen', 'collected em']],
  ])('holds the rest of %j in an unclosed quote', (query, parts) => {
    expect(partsOf(query)).toEqual(parts)
  })
})

describe('PAGE_SIZE', () => {
  it('is a hundred', () => {
    expect(PAGE_SIZE).toBe(100)
  })
})
