import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import {
  arrange, holdingsOf, putRepresentation, release, retire, unlinkSpot,
} from '#lib/server/edits.js'
import { edgeId } from '#lib/server/janusgraph.js'
import {
  addSpot, attach, link, mount, mountLink, transaction, type Id,
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

  it('keys a published link MOUNT’s marker by its uuid, not its target', async () => {
    const [from, to] = [await addSpot(source), await addSpot(source)]
    await mountLink(source, { from, to, uuid: 'u-link', path: 'hats', parent: 'u-parent' })
    const edge = await edgeOf(from, 'MOUNT')
    await source.E(edge).property('published', '["fingerprint"]').toList()
    await retire({ source, edge, now })
    expect(await markers(from)).toEqual([
      { kind: 'MOUNT', key: 'u-link', published: '["fingerprint"]', createdAt: now, to },
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

const ranked = async (spot: Id) => (
  (await holdingsOf({ source, spot })).map(({ id }) => id)
)
const afters = async (spot: Id) => (
  Object.fromEntries((await holdingsOf({ source, spot })).map(({ id, after }) => [id, after]))
)

describe('putRepresentation', () => {
  const held = async (spot: Id) => (
    (await (
      source.V(spot).outE('AS')
      .project('after', 'content', 'uuid', 'type', 'blobs')
      .by(__.values('after').fold())
      .by(__.inV().id())
      .by(__.inV().values('uuid'))
      .by(__.inV().values('type'))
      .by(
        __.inV().outE('IS')
        .project('uuid', 'cid', 'size', 'previous')
        .by('uuid')
        .by(__.inV().values('cid'))
        .by(__.inV().values('size'))
        .by(__.inV().out('PREVIOUS').values('cid').fold())
        .fold()
      )
      .toList()
    )).map((row) => {
      const entry = Object.fromEntries(row as Map<string, unknown>)
      entry.blobs = (entry.blobs as Array<Map<string, unknown>>).map(
        (blob) => Object.fromEntries(blob)
      ).sort((a, b) => (String(a.uuid) < String(b.uuid) ? -1 : 1))
      return entry
    })
  )
  const svg = { type: 'image/svg+xml', size: 12, now }
  const publish = (content: Id) => (
    source.V(content).outE('IS').property('published', '["published"]').toList()
  )

  it('creates a Content, its `AS`, & an `IS` to a Blob', async () => {
    const spot = await addSpot(source)
    const content = await putRepresentation({ source, spot, ...svg, cid: 'bafySVG' })
    expect(await held(spot)).toEqual([{
      after: [],
      content,
      uuid: expect.stringMatching(/^[0-9a-f-]{36}$/),
      type: 'image/svg+xml',
      blobs: [{
        uuid: expect.stringMatching(/^[0-9a-f-]{36}$/),
        cid: 'bafySVG',
        size: 12,
        previous: [],
      }],
    }])
  })

  it('changes nothing for the current data (FR-009)', async () => {
    const spot = await addSpot(source)
    const args = { source, spot, ...svg, cid: 'bafySVG' }
    const content = await putRepresentation(args)
    await publish(content)
    const before = await held(spot)
    expect(await putRepresentation(args)).toBe(content)
    expect(await held(spot)).toEqual(before)
  })

  it('adds a version over a published Blob, naming it `previous` (FR-006)', async () => {
    const spot = await addSpot(source)
    const content = await putRepresentation({ source, spot, ...svg, cid: 'bafyOld' })
    await publish(content)
    expect(await putRepresentation({ source, spot, ...svg, cid: 'bafyNew', size: 13 }))
    .toBe(content)
    const [{ blobs }] = await held(spot)
    expect(blobs).toEqual([
      expect.objectContaining({ cid: 'bafyOld', size: 12, previous: [] }),
      expect.objectContaining({ cid: 'bafyNew', size: 13, previous: ['bafyOld'] }),
    ])
    expect(await markers(content)).toEqual([])
  })

  it('overwrites an unpublished Blob in place (FR-007)', async () => {
    const spot = await addSpot(source)
    const content = await putRepresentation({ source, spot, ...svg, cid: 'bafyOld' })
    const [{ blobs: [before] }] = await held(spot) as Array<{ blobs: Array<{ uuid: string }> }>
    await putRepresentation({ source, spot, ...svg, cid: 'bafyNew', size: 13, now: '2026-11-22T00:00:00.000Z' })
    const [{ blobs }] = await held(spot)
    expect(blobs).toEqual([{ uuid: before.uuid, cid: 'bafyNew', size: 13, previous: [] }])
    expect(await source.V(content).out('IS').values('createdAt').toList())
    .toEqual(['2026-11-22T00:00:00.000Z'])
  })

  it('overwrites only the newest version once it’s unpublished', async () => {
    const spot = await addSpot(source)
    const content = await putRepresentation({ source, spot, ...svg, cid: 'bafyV1' })
    await publish(content)
    await putRepresentation({ source, spot, ...svg, cid: 'bafyV2' })
    await putRepresentation({ source, spot, ...svg, cid: 'bafyV3' })
    const [{ blobs }] = await held(spot)
    expect(blobs).toEqual([
      expect.objectContaining({ cid: 'bafyV1', previous: [] }),
      expect.objectContaining({ cid: 'bafyV3', previous: ['bafyV1'] }),
    ])
  })

  it('chains five published versions (SC-005)', async () => {
    const spot = await addSpot(source)
    let content: Id | undefined
    for(const n of [1, 2, 3, 4, 5, 6]) {
      content = await putRepresentation({ source, spot, ...svg, cid: `bafyV${n}` })
      await publish(content)
    }
    const chain = await (
      source.V(content!).out('IS').not(__.inE('PREVIOUS'))
      .emit().repeat(__.out('PREVIOUS')).values('cid').toList()
    )
    expect(chain).toEqual(['bafyV6', 'bafyV5', 'bafyV4', 'bafyV3', 'bafyV2', 'bafyV1'])
  })

  it('versions the best Content of the type, not a later one (FR-018)', async () => {
    const spot = await addSpot(source)
    const first = await putRepresentation({ source, spot, ...svg, cid: 'bafyA' })
    const second = await putRepresentation({ source, spot, ...svg, cid: 'bafyB', alternative: true })
    expect(second).not.toBe(first)
    expect(await putRepresentation({ source, spot, ...svg, cid: 'bafyC' })).toBe(first)
    expect(await ranked(spot)).toEqual([first, second])
  })

  it('makes a new Content of another type, ranked last', async () => {
    const spot = await addSpot(source)
    const png = await putRepresentation({ source, spot, type: 'image/png', cid: 'bafyPNG', size: 1, now })
    const svgId = await putRepresentation({ source, spot, ...svg, cid: 'bafySVG' })
    expect(svgId).not.toBe(png)
    expect(await ranked(spot)).toEqual([png, svgId])
  })

  it('adds an alternative of the same type, ranked last (FR-001, FR-017)', async () => {
    const spot = await addSpot(source)
    const ids = []
    for(const cid of ['bafyA', 'bafyB', 'bafyA']) {
      ids.push(await putRepresentation({ source, spot, ...svg, cid, alternative: true }))
    }
    expect(new Set(ids).size).toBe(3)
    expect(await ranked(spot)).toEqual(ids)
    expect((await held(spot)).map(({ type }) => type))
    .toEqual(['image/svg+xml', 'image/svg+xml', 'image/svg+xml'])
  })

  it('doesn’t version a proxy of the type', async () => {
    const spot = await addSpot(source)
    const other = await addSpot(source)
    const { content: target } = await attach(source, { to: other, type: 'image/svg+xml', cid: 'bafyT' })
    const { content: proxy } = await attach(source, { to: spot, type: 'image/svg+xml', mounts: target })
    const made = await putRepresentation({ source, spot, ...svg, cid: 'bafyNew' })
    expect(made).not.toBe(proxy)
    expect(await ranked(spot)).toEqual([proxy, made])
    expect(await source.V(proxy).outE('IS').count().next()).toMatchObject({ value: 0 })
  })
})

describe('hold & release', () => {
  let spot: Id
  let contents: Array<Id>
  beforeEach(async () => {
    spot = await addSpot(source)
    contents = []
    for(const cid of ['bafyA', 'bafyB', 'bafyC']) {
      contents.push((await attach(source, { to: spot, type: 'text/plain', cid })).content)
    }
  })
  const edgeTo = async (content: Id) => (
    edgeId((await source.V(spot).outE('AS').where(__.inV().hasId(content)).id().next()).value)
  )

  it('ranks each held Content after the last (FR-004)', async () => {
    expect(await ranked(spot)).toEqual(contents)
    const uuids = await Promise.all(contents.map(uuidOf))
    expect(await afters(spot)).toEqual({
      [contents[0]]: undefined, [contents[1]]: uuids[0], [contents[2]]: uuids[1],
    })
  })

  it.each([
    { removed: 0, left: [1, 2] },
    { removed: 1, left: [0, 2] },
    { removed: 2, left: [0, 1] },
  ])('relinks what followed Content $removed when it’s released (FR-021)', async ({ removed, left }) => {
    await release({ source, edge: await edgeTo(contents[removed]), now })
    expect(await ranked(spot)).toEqual(left.map((n) => contents[n]))
    const uuids = await Promise.all(contents.map(uuidOf))
    expect(await afters(spot)).toEqual({
      [contents[left[0]]]: undefined, [contents[left[1]]]: uuids[left[0]],
    })
  })

  it('leaves a marker for a published `AS` it releases', async () => {
    const edge = await edgeTo(contents[1])
    await source.E(edge).property('published', '["p"]').toList()
    await release({ source, edge, now })
    expect(await markers(spot)).toEqual([expect.objectContaining({ kind: 'AS', key: await uuidOf(contents[1]) })])
  })

  it('throws on an edge that isn’t an `AS`', async () => {
    const { edge } = await kinds.CONTAINS()
    await expect(release({ source, edge, now })).rejects.toThrow(`There’s no AS ${edge}.`)
  })
})

describe('arrange', () => {
  let spot: Id
  let contents: Array<Id>
  let uuids: Array<string>
  beforeEach(async () => {
    spot = await addSpot(source)
    contents = []
    for(const cid of ['bafyA', 'bafyB', 'bafyC', 'bafyD']) {
      contents.push((await attach(source, { to: spot, type: 'text/plain', cid })).content)
    }
    uuids = await Promise.all(contents.map(uuidOf))
  })
  const changed = async (order: Array<number>) => {
    const before = await afters(spot)
    await arrange({ source, spot, order: order.map((n) => uuids[n]) })
    expect(await ranked(spot)).toEqual(order.map((n) => contents[n]))
    const after = await afters(spot)
    return contents.flatMap((id, n) => (before[id] === after[id] ? [] : [n]))
  }

  it('changes only the moved Content & its new follower, moving the last to the top', async () => {
    expect(await changed([3, 0, 1, 2])).toEqual([0, 3])
  })

  it('changes three entries moving one down a place (FR-003)', async () => {
    expect(await changed([0, 2, 1, 3])).toEqual([1, 2, 3])
  })

  it('changes nothing for the order it already has', async () => {
    expect(await changed([0, 1, 2, 3])).toEqual([])
  })

  it.each([
    { given: 'a missing Content', order: () => uuids.slice(1) },
    { given: 'a duplicate', order: () => [uuids[0], ...uuids.slice(0, 3)] },
    { given: 'a stranger', order: () => [...uuids.slice(1), 'nope'] },
  ])('throws on $given', async ({ order }) => {
    await expect(arrange({ source, spot, order: order() }))
    .rejects.toThrow(`That order isn’t of Spot #${spot}’s Contents.`)
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

  it('takes out a link MOUNT by its name, & leaves a layer MOUNT of the same Spot', async () => {
    await mountLink(source, { from, to: what, uuid: 'u-link', path: 'hats', parent: 'u-parent' })
    await mount(source, { from, to: what })
    expect(await unlinkSpot({ source, from, what, name: 'hats', now })).toBe(true)
    expect(await source.V(from).outE('MOUNT').has('path').count().next()).toMatchObject({ value: 0 })
    expect(await source.V(from).outE('MOUNT').count().next()).toMatchObject({ value: 1 })
    expect(await names(from)).toEqual(['x'])
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
