import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import { v7 as uuidV7 } from 'uuid'
import { relinkContent, relinkSpot } from '#lib/server/moves.js'
import {
  addSpot, attach, link, transaction, type Id,
} from '#lib/server/testing.js'

const { statics: __ } = gremlin.process
type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
let from: Id
let to: Id
let what: Id
const now = '2026-11-21T00:00:00.000Z'

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  ;[from, to, what] = [await addSpot(source), await addSpot(source), await addSpot(source)]
})

afterEach(async () => {
  await rollback()
})

const edges = async (spot: Id, label: string) => (
  (await (
    source.V(spot).outE(label)
    .project('props', 'to')
    .by(__.valueMap())
    .by(__.inV().id())
    .toList()
  )).map((row): Record<string, unknown> => {
    const { props, to } = Object.fromEntries(row as Map<string, unknown>)
    return { ...Object.fromEntries(props as Map<string, unknown>), to }
  })
)

describe('relinkSpot', () => {
  beforeEach(async () => {
    await link(source, { from, to: what, name: 'σοφία' })
  })
  const move = () => relinkSpot({ source, what, from, to, now, uuid: uuidV7() })

  it('keeps the link’s `path` & `uuid`', async () => {
    const [{ uuid }] = await edges(from, 'CONTAINS')
    expect(await move()).toEqual(expect.any(String))
    expect(await edges(to, 'CONTAINS')).toEqual([
      { path: 'σοφία', uuid, createdAt: now, to: what },
    ])
    expect(await edges(from, 'CONTAINS')).toEqual([])
  })

  it('leaves no marker for an unpublished link', async () => {
    await move()
    expect(await edges(from, 'REMOVED')).toEqual([])
  })

  it('leaves a marker for a published link, & the new one unpublished', async () => {
    await source.V(from).outE('CONTAINS').property('published', '["σοφία","x"]').toList()
    const [{ uuid }] = await edges(from, 'CONTAINS')
    await move()
    expect(await edges(from, 'REMOVED')).toEqual([{
      kind: 'CONTAINS', entry: uuid, published: '["σοφία","x"]', createdAt: now, to: what,
    }])
    expect(await edges(to, 'CONTAINS')).toEqual([
      expect.not.objectContaining({ published: expect.anything() }),
    ])
  })

  it('gives nothing when `from` doesn’t contain `what`', async () => {
    expect(await relinkSpot({ source, what, from: to, to: from, now, uuid: uuidV7() }))
    .toBeNull()
  })
})

describe('relinkContent', () => {
  let content: Id
  beforeEach(async () => {
    ;({ content } = await attach(source, { to: from, type: 'image/png', cid: 'bafyPNG', order: 2 }))
  })
  const move = () => relinkContent({ source, what: content, from, to, now })

  it('keeps `order`, as a number', async () => {
    expect(await move()).toEqual(expect.any(String))
    expect(await edges(to, 'AS')).toEqual([{ order: 2, createdAt: now, to: content }])
    expect(await edges(from, 'AS')).toEqual([])
  })

  it('leaves no marker for an unpublished `AS`', async () => {
    await move()
    expect(await edges(from, 'REMOVED')).toEqual([])
  })

  it('leaves a marker for a published `AS`', async () => {
    await source.V(from).outE('AS').property('published', '["c",2,"image/png"]').toList()
    const uuid = (await source.V(content).values('uuid').next()).value
    await move()
    expect(await edges(from, 'REMOVED')).toEqual([{
      kind: 'AS', entry: uuid, published: '["c",2,"image/png"]', createdAt: now, to: content,
    }])
  })

  it('gives nothing when `from` doesn’t hold `what`', async () => {
    expect(await relinkContent({ source, what: content, from: to, to: from, now }))
    .toBeNull()
  })
})
