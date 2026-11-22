import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { putRepresentation } from '#lib/server/edits.js'
import {
  assembleListing, listingTraversal, overlay, resolvePath, stack,
  type Content,
} from '#lib/server/listing.js'
import {
  addSpot, attach, link, mount, seed, transaction, type Id,
} from '#lib/server/testing.js'

type Source = ReturnType<typeof transaction>['source']
type Rows = Parameters<typeof assembleListing>[0]

let source: Source
let rollback: () => Promise<void>
let ids: Map<string, Id>
let other: Id
let y: Id

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  ids = await seed(source, { x: {} })
  other = await addSpot(source)
  y = await addSpot(source)
  await link(source, { from: other, to: y, name: 'y' })
  await mount(source, { from: ids.get('x')!, to: other })
})

afterEach(async () => {
  await rollback()
})

const root = () => source.V(ids.get('')!)

describe('listingTraversal', () => {
  it('lists a mounted layer’s children under the mounting Spot', async () => {
    const rows = await (
      listingTraversal({ from: root(), path: ['x'] }).toList()
    ) as Rows
    const listing = assembleListing(rows)
    expect(listing.layers).toEqual([ids.get('x'), other])
    expect(listing.contents).toEqual([])
    expect(listing.children).toEqual([{
      name: 'y',
      ids: [y],
      parents: [other],
      contents: [],
      container: false,
    }])
  })
})

describe('resolvePath', () => {
  const resolved = (path: Array<string>) => (
    resolvePath({ from: root(), path }).id().toList()
  )

  it('reaches a Spot through a mount on the way', async () => {
    expect(await resolved(['x', 'y'])).toEqual([y])
  })

  it('resolves an empty path to where it started', async () => {
    expect(await resolved([])).toEqual([ids.get('')])
  })

  it('resolves a missing name to nothing', async () => {
    expect(await resolved(['nope'])).toEqual([])
  })

  it('leaves the end’s own mounts to the caller', async () => {
    expect(await resolved(['x'])).toEqual([ids.get('x')])
  })
})

const as = (id: string, mounts?: string): Content => ({
  id, uuid: id, type: 'image/svg+xml', cid: `bafy${id}`, size: 1, spot: 0,
  ...(mounts == null ? {} : { mounts }),
})
const idsOf = (contents: Array<Content>) => contents.map(({ id }) => id)
const below = ['a1', 'a2', 'a3', 'a4', 'a5'].map((id) => as(id))

describe('overlay (FR-013)', () => {
  it('puts a layer with no proxies first', () => {
    expect(idsOf(overlay([as('b1'), as('b2')], below)))
    .toEqual(['b1', 'b2', 'a1', 'a2', 'a3', 'a4', 'a5'])
  })

  it('fills the mounted Contents’ places with the proxies, in the layer’s order', () => {
    expect(idsOf(overlay([as('p4', 'a4'), as('p3', 'a3')], below)))
    .toEqual(['a1', 'a2', 'p4', 'p3', 'a5'])
  })

  it('keeps every unmounted Content in its place (SC-003)', () => {
    const merged = idsOf(overlay([as('p5', 'a5'), as('p1', 'a1')], below))
    expect(merged).toEqual(['p5', 'a2', 'a3', 'a4', 'p1'])
    for(const kept of ['a2', 'a3', 'a4']) {
      expect(merged.indexOf(kept)).toBe(idsOf(below).indexOf(kept))
    }
  })

  it('ranks the layer’s own Contents just before its next proxy', () => {
    expect(idsOf(overlay([as('b1'), as('p3', 'a3'), as('b2'), as('p2', 'a2')], below)))
    .toEqual(['a1', 'b1', 'p3', 'b2', 'p2', 'a4', 'a5'])
  })

  it('ranks its Contents after its last proxy just after that proxy', () => {
    expect(idsOf(overlay([as('p2', 'a2'), as('b1'), as('b2')], below)))
    .toEqual(['a1', 'p2', 'b1', 'b2', 'a3', 'a4', 'a5'])
  })

  it('takes a proxy of nothing below as one of its own Contents', () => {
    expect(idsOf(overlay([as('px', 'gone'), as('p2', 'a2')], below)))
    .toEqual(['a1', 'px', 'p2', 'a3', 'a4', 'a5'])
  })

  it('takes a second proxy of the same Content as its own', () => {
    expect(idsOf(overlay([as('p2', 'a2'), as('q2', 'a2')], below)))
    .toEqual(['a1', 'p2', 'q2', 'a3', 'a4', 'a5'])
  })

  it('doesn’t list a Content below twice', () => {
    expect(idsOf(overlay([as('a3'), as('b1')], below)))
    .toEqual(['b1', 'a1', 'a2', 'a3', 'a4', 'a5'])
  })

  it('overlays nothing onto nothing', () => {
    expect(overlay([], [])).toEqual([])
  })
})

describe('stack', () => {
  it('overlays each layer onto those below, from the lowest', () => {
    const lists = [
      [as('c1', 'p4')],
      [as('p4', 'a4'), as('p3', 'a3')],
      below,
    ]
    expect(idsOf(stack(lists))).toEqual(['a1', 'a2', 'c1', 'p3', 'a5'])
  })
})

describe('ranked listings', () => {
  const now = '2026-11-22T00:00:00.000Z'
  const listingAt = async (from: Id, path: Array<string>) => (
    assembleListing(await listingTraversal({ from: source.V(from), path }).toList() as Rows)
  )
  const cids = (contents: Array<Content>) => contents.map(({ cid }) => cid)

  it('lists several Contents of one type, best first (FR-001)', async () => {
    const hat = await addSpot(source)
    await link(source, { from: ids.get('x')!, to: hat, name: 'hat' })
    for(const cid of ['bafyA', 'bafyB', 'bafyC']) {
      await attach(source, { to: hat, type: 'image/svg+xml', cid })
    }
    const listing = await listingAt(ids.get('')!, ['x'])
    const child = listing.children.find(({ name }) => name === 'hat')!
    expect(cids(child.contents)).toEqual(['bafyA', 'bafyB', 'bafyC'])
    expect((await listingAt(ids.get('')!, ['x', 'hat'])).contents.map(({ cid }) => cid))
    .toEqual(['bafyA', 'bafyB', 'bafyC'])
  })

  it('shows a Content’s newest version (FR-008)', async () => {
    const spot = ids.get('x')!
    const content = await putRepresentation({ source, spot, type: 'text/plain', cid: 'bafyV1', size: 1, now })
    await source.V(content).outE('IS').property('published', '["p"]').toList()
    await putRepresentation({ source, spot, type: 'text/plain', cid: 'bafyV2', size: 2, now })
    expect((await listingAt(ids.get('')!, ['x'])).contents)
    .toEqual([expect.objectContaining({ id: content, cid: 'bafyV2', size: 2 })])
  })

  it('takes the greatest `IS` uuid of several current Blobs', async () => {
    const { content, is } = await attach(source, { to: ids.get('x')!, type: 'text/plain', cid: 'bafyLow' })
    await source.E(is).property('uuid', '00000000-0000-7000-8000-000000000000').toList()
    await (
      source.V(content).as('c')
      .addV('Blob').property('cid', 'bafyHigh').property('size', 1)
      .addE('IS').from_('c').property('uuid', 'ffffffff-0000-7000-8000-000000000000')
      .toList()
    )
    expect(cids((await listingAt(ids.get('')!, ['x'])).contents)).toEqual(['bafyHigh'])
  })

  it('shows a proxy with its target’s current data (FR-012)', async () => {
    const theirs = await addSpot(source)
    const { content: target } = await attach(source, { to: theirs, type: 'image/png', cid: 'bafyT' })
    const { content: proxy } = await attach(source, { to: ids.get('x')!, type: 'image/png', mounts: target })
    expect((await listingAt(ids.get('')!, ['x'])).contents)
    .toEqual([expect.objectContaining({ id: proxy, cid: 'bafyT', mounts: target, type: 'image/png' })])
  })

  it('leaves out a proxy whose target has no Blob, keeping what follows it in place', async () => {
    const x = ids.get('x')!
    const empty = (await source.addV('Content').property('uuid', 'u-empty').property('type', 'image/png').id().next()).value as Id
    await attach(source, { to: x, type: 'image/png', cid: 'bafyFirst' })
    await attach(source, { to: x, type: 'image/png', mounts: empty })
    await attach(source, { to: x, type: 'image/png', cid: 'bafyLast' })
    expect(cids((await listingAt(ids.get('')!, ['x'])).contents)).toEqual(['bafyFirst', 'bafyLast'])
  })

  it('follows proxies of proxies up to 10 deep, but no further', async () => {
    const theirs = await addSpot(source)
    let { content: target } = await attach(source, { to: theirs, type: 'image/png', cid: 'bafyDeep' })
    const chain: Array<Id> = []
    for(let n = 0; n < 11; n++) {
      ;({ content: target } = await attach(source, { to: theirs, type: 'image/png', mounts: target }))
      chain.push(target)
    }
    const shown = async (n: number) => {
      const spot = await addSpot(source)
      await attach(source, { to: spot, type: 'image/png', mounts: chain[n] })
      const rows = await listingTraversal({ from: source.V(spot), path: [] }).toList() as Rows
      return cids(assembleListing(rows).contents)
    }
    expect(await shown(8)).toEqual(['bafyDeep'])
    expect(await shown(10)).toEqual([])
  })

  it('reorders a mounted layer’s Contents with proxies, & leaves the rest in place (US4)', async () => {
    const a = await addSpot(source)
    const aHat = await addSpot(source)
    await link(source, { from: a, to: aHat, name: 'hat' })
    const theirs = []
    for(const n of [1, 2, 3, 4, 5]) {
      theirs.push((await attach(source, { to: aHat, type: 'image/svg+xml', cid: `bafyA${n}` })).content)
    }
    const b = await addSpot(source)
    await mount(source, { from: b, to: a })
    const bHat = await addSpot(source)
    await link(source, { from: b, to: bHat, name: 'hat' })
    await attach(source, { to: bHat, type: 'image/svg+xml', mounts: theirs[3] })
    await attach(source, { to: bHat, type: 'image/svg+xml', mounts: theirs[2] })

    expect(cids((await listingAt(b, ['hat'])).contents))
    .toEqual(['bafyA1', 'bafyA2', 'bafyA4', 'bafyA3', 'bafyA5'])
    expect(cids((await listingAt(a, ['hat'])).contents))
    .toEqual(['bafyA1', 'bafyA2', 'bafyA3', 'bafyA4', 'bafyA5'])

    await attach(source, { to: aHat, type: 'image/svg+xml', cid: 'bafyA6' })
    expect(cids((await listingAt(b, ['hat'])).contents))
    .toEqual(['bafyA1', 'bafyA2', 'bafyA4', 'bafyA3', 'bafyA5', 'bafyA6'])
    const tile = (await listingAt(b, [])).children.find(({ name }) => name === 'hat')!
    expect(cids(tile.contents)).toEqual(['bafyA1', 'bafyA2', 'bafyA4', 'bafyA3', 'bafyA5', 'bafyA6'])
  })

  it('ranks Unicode-named Spots’ Contents the same', async () => {
    const spot = await addSpot(source)
    await link(source, { from: ids.get('x')!, to: spot, name: '帽子 🎩' })
    await attach(source, { to: spot, type: 'image/png', cid: 'bafy1' })
    await attach(source, { to: spot, type: 'image/png', cid: 'bafy2' })
    expect(cids((await listingAt(ids.get('')!, ['x', '帽子 🎩'])).contents)).toEqual(['bafy1', 'bafy2'])
  })
})
