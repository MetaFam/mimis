import { describe, expect, it } from 'vitest'
import { isHttpError } from '@sveltejs/kit'
import { nameProblem, validName } from '#lib/names.js'

describe('validName (FR-007)', () => {
  it.each([
    ['hats', 'hats'],
    ['  hats  ', 'hats'],
    ['Hat', 'Hat'],
    ['chapeau ☂', 'chapeau ☂'],
    ['été', 'été'],
    ['a?b', 'a?b'],
    ['a#b', 'a#b'],
    ['50%', '50%'],
    ['two words', 'two words'],
    ['帽子 🎩', '帽子 🎩'],
  ])('accepts %j as %j', (name, trimmed) => {
    expect(validName(name)).toBe(trimmed)
    expect(nameProblem(name)).toBeNull()
  })

  it.each([
    ['', '“” isn’t a name: it’s empty.'],
    ['   ', '“   ” isn’t a name: it’s empty.'],
    ['.', '“.” isn’t a name: it’s reserved.'],
    ['..', '“..” isn’t a name: it’s reserved.'],
    [' .. ', '“ .. ” isn’t a name: it’s reserved.'],
    ['a/b', '“a/b” isn’t a name: it contains “/”.'],
  ])('refuses %j with its reason', (name, reason) => {
    expect(nameProblem(name)).toBe(reason)
    try {
      validName(name)
      expect.unreachable()
    } catch(err) {
      expect(isHttpError(err)).toBe(true)
      expect(err).toMatchObject({ status: 400, body: { message: reason } })
    }
  })
})
