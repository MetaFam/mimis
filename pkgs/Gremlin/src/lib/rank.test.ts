import { describe, expect, it } from 'vitest'
import { predecessors, rank } from '#lib/rank.js'

const item = (uuid: string, after?: string) => (
  after == null ? { uuid } : { uuid, after }
)
const uuids = (items: Array<{ uuid: string }>) => items.map(({ uuid }) => uuid)

describe('rank', () => {
  it('ranks nothing as nothing', () => {
    expect(rank([])).toEqual([])
  })

  it('follows each `after` from the head', () => {
    const items = [item('c', 'b'), item('a'), item('d', 'c'), item('b', 'a')]
    expect(uuids(rank(items))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('puts several heads first, by uuid', () => {
    expect(uuids(rank([item('b'), item('a'), item('c', 'b')])))
    .toEqual(['a', 'b', 'c'])
  })

  it('takes a predecessor the Spot doesn’t hold as no predecessor', () => {
    expect(uuids(rank([item('b', 'gone'), item('a', 'b')])))
    .toEqual(['b', 'a'])
  })

  it('orders followers of one Content by uuid, each with its own followers', () => {
    const items = [
      item('a'), item('c', 'a'), item('b', 'a'), item('d', 'b'),
    ]
    expect(uuids(rank(items))).toEqual(['a', 'b', 'd', 'c'])
  })

  it('puts a loop last, by uuid', () => {
    const items = [item('z'), item('b', 'c'), item('c', 'b'), item('a', 'c')]
    expect(uuids(rank(items))).toEqual(['z', 'a', 'b', 'c'])
  })

  it('ranks a loop with no head at all', () => {
    expect(uuids(rank([item('b', 'a'), item('a', 'b')]))).toEqual(['a', 'b'])
  })

  it('ranks Unicode-free uuids by code unit, as their bytes compare', () => {
    expect(uuids(rank([item('0b'), item('0B'), item('00')])))
    .toEqual(['00', '0B', '0b'])
  })

  it('ranks a list of 10,000 without recursing', () => {
    const items = Array.from({ length: 10_000 }, (_, n) => (
      item(String(n).padStart(5, '0'), n === 0 ? undefined : String(n - 1).padStart(5, '0'))
    )).reverse()
    const ranked = rank(items)
    expect(ranked).toHaveLength(10_000)
    expect(ranked[0].uuid).toBe('00000')
    expect(ranked.at(-1)!.uuid).toBe('09999')
  })
})

describe('predecessors', () => {
  it('names each item’s predecessor, & none for the first', () => {
    expect(predecessors([item('a'), item('b'), item('c')]).map(({ after }) => after))
    .toEqual([undefined, 'a', 'b'])
  })

  it('round-trips through rank', () => {
    const order = [item('q'), item('b'), item('x'), item('a')]
    const linked = predecessors(order).map(({ item: { uuid }, after }) => item(uuid, after))
    expect(uuids(rank(linked.reverse()))).toEqual(['q', 'b', 'x', 'a'])
  })
})
