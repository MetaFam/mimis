import { describe, expect, it } from 'vitest'
import { FOLD_OVER, nest, type Row } from '#lib/pendingTree.js'
import type { PendingSpot } from '#lib/remotes/pending.remote.js'

let ids = 0
const spot = (path: Array<string>, extra: Partial<PendingSpot> = {}): PendingSpot => ({
  id: ++ids, uuid: `u${ids}`, path, isNew: false, staged: false, added: 1, removed: 0, ...extra,
})

/** Each row as `name` (a context row in brackets), with its children. */
type Shape = string | [string, Array<Shape>]
const shape = (rows: Array<Row>): Array<Shape> => rows.map((row) => {
  const name = row.spot ? row.name : `[${row.name}]`
  return row.children.length === 0 ? name : [name, shape(row.children)]
})

describe('nest (FR-001)', () => {
  it('nests Spots under their parents’ paths', () => {
    expect(shape(nest([spot(['icon']), spot(['icon', 'hat']), spot(['icon', 'cap'])])))
    .toEqual([['icon', ['hat', 'cap']]])
  })

  it('adds context rows for parents that aren’t pending (FR-003)', () => {
    const [icon] = nest([spot(['icon', 'hat', 'top'])])
    expect(shape([icon])).toEqual([['[icon]', [['[hat]', ['top']]]]])
    expect(icon).toMatchObject({ name: 'icon', path: ['icon'] })
    expect(icon.children[0]).toMatchObject({ name: 'hat', path: ['icon', 'hat'] })
    expect(icon.children[0].spot).toBeUndefined()
    expect(icon.children[0].children[0].spot).toMatchObject({ path: ['icon', 'hat', 'top'] })
  })

  it('heads everything with the root, when it’s pending (FR-002)', () => {
    const rows = nest([spot([]), spot(['docs'])])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ name: '', path: [], pending: 1 })
    expect(rows[0].spot).toBeDefined()
    expect(shape(rows)).toEqual([['', ['docs']]])
  })

  it('counts the pending Spots inside each row, & not context rows (FR-007)', () => {
    const [imported] = nest([
      spot(['import']),
      spot(['import', 'a']),
      spot(['import', 'b', 'c']),
      spot(['import', 'd']),
    ])
    expect(imported.pending).toBe(3)
    expect(imported.children.map(({ name, pending }) => [name, pending]))
    .toEqual([['a', 0], ['b', 1], ['d', 0]])
  })

  it('keeps the order it’s given, never re-sorting (FR-005)', () => {
    const sorted = [spot(['Icon']), spot(['art']), spot(['docs'])]
    expect(shape(nest(sorted))).toEqual(['Icon', 'art', 'docs'])
    expect(shape(nest([...sorted].reverse()))).toEqual(['docs', 'art', 'Icon'])
  })

  it('keeps names exactly', () => {
    const names = ['帽子 🎩', 'été', 'two words']
    expect(shape(nest(names.map((name) => spot(['x', name])))))
    .toEqual([['[x]', names]])
  })

  it('places a pending ancestor that comes after its descendants on their row', () => {
    const rows = nest([spot(['a', 'b']), spot(['a'])])
    expect(shape(rows)).toEqual([['a', ['b']]])
    expect(rows[0].pending).toBe(1)
  })

  it('nests nothing into nothing', () => {
    expect(nest([])).toEqual([])
  })
})

describe('FOLD_OVER (FR-009)', () => {
  it('folds rows with more than 50 inside', () => {
    expect(FOLD_OVER).toBe(50)
  })
})
