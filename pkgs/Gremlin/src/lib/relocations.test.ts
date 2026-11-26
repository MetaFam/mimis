import { describe, expect, it } from 'vitest'
import relocations, { follow, relocate } from '#lib/relocations.svelte.js'

describe('follow (FR-016)', () => {
  const ab = { from: ['a', 'b'], to: ['a', 'c'] }

  it('rewrites a path under the renamed one', () => {
    expect(follow(['a', 'b', 'x'], ab)).toEqual(['a', 'c', 'x'])
  })

  it('rewrites the renamed path itself', () => {
    expect(follow(['a', 'b'], ab)).toEqual(['a', 'c'])
  })

  it.each([[['a', 'bb']], [['z']], [['a']], [[]]])('leaves %j alone', (path) => {
    expect(follow(path, ab)).toBe(path)
  })

  it('follows a rename of the root’s child', () => {
    expect(follow(['b', 'x', 'y'], { from: ['b'], to: ['c'] })).toEqual(['c', 'x', 'y'])
  })

  it('follows a rename four deep', () => {
    expect(follow(['m', 'n', 'o', 'p', 'q'], { from: ['m', 'n', 'o', 'p'], to: ['m', 'n', 'o', 'P'] }))
    .toEqual(['m', 'n', 'o', 'P', 'q'])
  })

  it('follows a move to another parent', () => {
    expect(follow(['image', 'hats', 'top'], { from: ['image', 'hats'], to: ['old', 'hats'] }))
    .toEqual(['old', 'hats', 'top'])
  })
})

describe('relocate', () => {
  it('records the latest relocation', () => {
    relocate({ from: ['a'], to: ['b'] })
    relocate({ from: ['c'], to: ['d'] })
    expect(relocations.latest).toEqual({ from: ['c'], to: ['d'] })
  })
})
