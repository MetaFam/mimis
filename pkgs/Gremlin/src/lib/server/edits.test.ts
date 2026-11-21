import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import { putRepresentation, retire, unlinkSpot } from '#lib/server/edits.js'
import { edgeId } from '#lib/server/janusgraph.js'
import {
  addSpot, attach, link, mount, transaction, type Id,
} from '#lib/server/testing.js'

const { statics: __ } = gremlin.process
type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
const now = '2026-11-21T00:00:00.000Z'

beforeEach(() => {
  ;({ source, rollback } = transaction())
})

afterEach(async () => {
  await rollback()
})

const edgeOf = async (from: Id, label: string) => (
  edgeId((await source.V(from).outE(label).id().next()).value)
)
const uuidOf = async (id: Id) => (
  (await source.V(id).values('uuid').next()).value as string
)
const markers = async (from: Id) => (
  (await (
    source.V(from).outE('REMOVED')
    .project('kind', 'key', 'published', 'createdAt', 'to')
    .by('kind').by('entry').by('published').by('createdAt').by(__.inV().id())
    .toList()
  )).map((row) => Object.fromEntries(row as Map<string, unknown>))
)

/** Each kind of entry edge, from `from` to `to`, & its key. */
const kinds = {
  CONTAINS: async () => {
    const [from, to] = [await addSpot(source), await addSpot(source)]
    await link(source, { from, to, name: 'x' })
    const edge = await edgeOf(from, 'CONTAINS')
    const key = (await source.E(edge).values('uuid').next()).value as string
    return { from, to, edge, key }
  },
  MOUNT: async () => {
    const [from, to] = [await addSpot(source), await addSpot(source)]
    await mount(source, { from, to })
    return { from, to, edge: await edgeOf(from, 'MOUNT'), key: await uuidOf(to) }
  },
  AS: async () => {
    const from = await addSpot(source)
    const { content: to } = await attach(source, { to: from, type: 'text/plain', cid: 'bafyTXT' })
    return { from, to, edge: await edgeOf(from, 'AS'), key: await uuidOf(to) }
  },
  IS: async () => {
    const spot = await addSpot(source)
    const { content: from, is: edge } = await attach(source, { to: spot, type: 'text/plain', cid: 'bafyTXT' })
    const to = (await source.E(edge).inV().id().next()).value as Id
    const key = (await source.E(edge).values('uuid').next()).value as string
    return { from, to, edge, key }
  },
}

describe('retire', () => {
  it.each(Object.keys(kinds))('drops an unpublished %s & leaves no marker', async (kind) => {
    const { from, edge } = await kinds[kind as keyof typeof kinds]()
    await retire({ source, edge, now })
    expect(await source.E(edge).count().next()).toMatchObject({ value: 0 })
    expect(await markers(from)).toEqual([])
  })

  it.each(Object.keys(kinds))('leaves a marker for a published %s', async (kind) => {
    const { from, to, edge, key } = await kinds[kind as keyof typeof kinds]()
    await source.E(edge).property('published', '["fingerprint"]').toList()
    await retire({ source, edge, now })
    expect(await source.E(edge).count().next()).toMatchObject({ value: 0 })
    expect(await markers(from)).toEqual([
      { kind, key, published: '["fingerprint"]', createdAt: now, to },
    ])
  })

  it('throws on an edge that isn’t an entry', async () => {
    const [user, root] = [
      (await source.addV('User').id().next()).value as Id,
      await addSpot(source),
    ]
    const edge = edgeId((await source.V(user).addE('WRITES').to(__.V(root)).id().next()).value)
    await expect(retire({ source, edge, now }))
    .rejects.toThrow(`Edge ${edge} is a WRITES, not an entry.`)
  })

  it('throws on a missing edge', async () => {
    const { edge } = await kinds.CONTAINS()
    await source.E(edge).drop().toList()
    await expect(retire({ source, edge, now }))
    .rejects.toThrow(`Edge ${edge} doesn’t exist.`)
  })
})

describe('putRepresentation', () => {
  const held = async (spot: Id) => (
    (await (
      source.V(spot).outE('AS')
      .project('order', 'content', 'uuid', 'type', 'blobs')
      .by('order')
      .by(__.inV().id())
      .by(__.inV().values('uuid'))
      .by(__.inV().values('type'))
      .by(
        __.inV().outE('IS')
        .project('uuid', 'cid', 'size')
        .by('uuid').by(__.inV().values('cid')).by(__.inV().values('size'))
        .fold()
      )
      .toList()
    )).map((row) => {
      const entry = Object.fromEntries(row as Map<string, unknown>)
      entry.blobs = (entry.blobs as Array<Map<string, unknown>>).map(
        (blob) => Object.fromEntries(blob)
      )
      return entry
    })
  )

  it('creates a Content, its `AS`, & an `IS` to a Blob', async () => {
    const spot = await addSpot(source)
    const content = await putRepresentation({
      source, spot, type: 'image/svg+xml', cid: 'bafySVG', size: 12, now,
    })
    expect(await held(spot)).toEqual([{
      order: -1,
      content,
      uuid: expect.stringMatching(/^[0-9a-f-]{36}$/),
      type: 'image/svg+xml',
      blobs: [{ uuid: expect.stringMatching(/^[0-9a-f-]{36}$/), cid: 'bafySVG', size: 12 }],
    }])
  })

  it('changes nothing for the same type & CID', async () => {
    const spot = await addSpot(source)
    const args = { source, spot, type: 'image/svg+xml', cid: 'bafySVG', size: 12, now }
    const content = await putRepresentation(args)
    const before = await held(spot)
    expect(await putRepresentation(args)).toBe(content)
    expect(await held(spot)).toEqual(before)
  })

  it('replaces the blob within the same Content (FR-031)', async () => {
    const spot = await addSpot(source)
    const args = { source, spot, type: 'image/svg+xml', size: 12, now }
    const content = await putRepresentation({ ...args, cid: 'bafyOld' })
    const [{ uuid, blobs: [old] }] = await held(spot) as Array<{ uuid: string, blobs: Array<{ uuid: string }> }>
    await source.V(content).outE('IS').property('published', '["old"]').toList()

    expect(await putRepresentation({ ...args, cid: 'bafyNew', size: 13 })).toBe(content)
    const after = await held(spot)
    expect(after).toEqual([expect.objectContaining({
      content, uuid, blobs: [expect.objectContaining({ cid: 'bafyNew', size: 13 })],
    })])
    expect((after[0].blobs as Array<{ uuid: string }>)[0].uuid).not.toBe(old.uuid)
    expect(await markers(content)).toEqual([expect.objectContaining(
      { kind: 'IS', key: old.uuid, published: '["old"]' }
    )])
  })

  it('keeps another type in a separate Content', async () => {
    const spot = await addSpot(source)
    const svg = await putRepresentation({ source, spot, type: 'image/svg+xml', cid: 'bafySVG', size: 1, now })
    const png = await putRepresentation({ source, spot, type: 'image/png', cid: 'bafyPNG', size: 1, now })
    expect(png).not.toBe(svg)
    expect((await held(spot)).map(({ type }) => type).sort())
    .toEqual(['image/png', 'image/svg+xml'])
  })
})

describe('unlinkSpot', () => {
  let from: Id
  let what: Id
  let inside: Id
  beforeEach(async () => {
    ;[from, what, inside] = [await addSpot(source), await addSpot(source), await addSpot(source)]
    await link(source, { from, to: what, name: 'x' })
    await link(source, { from: what, to: inside, name: 'y' })
  })
  const names = async (spot: Id) => (
    (await source.V(spot).outE('CONTAINS').values('path').toList()).sort()
  )

  it('takes the Spot out of its container & keeps what it holds', async () => {
    expect(await unlinkSpot({ source, from, what, name: 'x', now })).toBe(true)
    expect(await names(from)).toEqual([])
    expect(await source.V(what).count().next()).toMatchObject({ value: 1 })
    expect(await names(what)).toEqual(['y'])
    expect(await markers(from)).toEqual([])
  })

  it('leaves a marker for a published link', async () => {
    await source.V(from).outE('CONTAINS').property('published', '["x","u"]').toList()
    const key = (await source.V(from).outE('CONTAINS').values('uuid').next()).value
    await unlinkSpot({ source, from, what, name: 'x', now })
    expect(await markers(from)).toEqual([
      { kind: 'CONTAINS', key, published: '["x","u"]', createdAt: now, to: what },
    ])
  })

  it('keeps the same Spot under another name', async () => {
    await link(source, { from, to: what, name: 'z' })
    await unlinkSpot({ source, from, what, name: 'x', now })
    expect(await names(from)).toEqual(['z'])
  })

  it.each([
    { given: 'a name it isn’t under', args: () => ({ from, what, name: 'nope' }) },
    { given: 'a container that doesn’t hold it', args: () => ({ from: what, what, name: 'x' }) },
    { given: 'a different Spot of that name', args: () => ({ from, what: inside, name: 'x' }) },
  ])('gives false & changes nothing for $given', async ({ args }) => {
    expect(await unlinkSpot({ source, now, ...args() })).toBe(false)
    expect(await names(from)).toEqual(['x'])
  })
})
