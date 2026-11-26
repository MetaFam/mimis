import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { putRepresentation } from '#lib/server/edits.js'
import {
  layerRows, listingAt as listed, overlay, resolveSpots, stack,
  type Content,
} from '#lib/server/listing.js'
import {
  addSpot, attach, link, mount, mountLink, seed, seedTree, seedUser,
  transaction, type FileTree, type Id,
} from '#lib/server/testing.js'

type Source = ReturnType<typeof transaction>['source']

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

describe('listingAt', () => {
  it('lists a mounted layer’s children under the mounting Spot', async () => {
    const listing = await listed({ source, from: root(), path: ['x'] })
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

describe('resolveSpots', () => {
  const resolved = async (path: Array<string>) => (
    (await resolveSpots({ source, from: root(), path })).map(({ id }) => id)
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
  const listingAt = (from: Id, path: Array<string>) => (
    listed({ source, from: source.V(from), path })
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
      return cids((await listingAt(spot, [])).contents)
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

describe('mounted links (FR-012, FR-013)', () => {
  let b: Awaited<ReturnType<typeof seedUser>>
  let s: Awaited<ReturnType<typeof seedUser>>
  let theirs: Map<string, Id>
  let image: Id
  let hatz: string

  const uuidOf = async (from: Id, name: string) => (
    (await source.V(from).outE('CONTAINS').has('path', name).values('uuid').next()).value as string
  )
  const spotUuid = async (id: Id) => (
    (await source.V(id).values('uuid').next()).value as string
  )
  const resolved = async (from: Id, path: Array<string>) => (
    (await resolveSpots({ source, from: source.V(from), path })).map(({ id }) => id)
  )
  const at = (from: Id, path: Array<string>) => (
    listed({ source, from: source.V(from), path })
  )
  const names = async (from: Id, path: Array<string>) => (
    (await at(from, path)).children.map(({ name }) => name).sort()
  )
  const renameAsB = async (path = 'hats') => {
    await mountLink(source, {
      from: image,
      to: theirs.get('image/hatz')!,
      uuid: hatz,
      path,
      base: 'hatz',
      parent: await spotUuid(theirs.get('image')!),
    })
  }

  beforeEach(async () => {
    b = await seedUser(source, { address: '0xb' })
    s = await seedUser(source, { address: '0xs' })
    theirs = await seedTree(source, {
      root: s.root, tree: { image: { hatz: { top: {}, bowler: {} } } },
    })
    await mount(source, { from: b.root, to: s.root })
    image = (await seedTree(source, { root: b.root, tree: { image: {} } })).get('image')!
    hatz = await uuidOf(theirs.get('image')!, 'hatz')
  })

  it('resolves trees without link mounts as before, best first', async () => {
    const t = await seedUser(source, { address: '0xt' })
    const tImage = await seedTree(source, { root: t.root, tree: { image: { deep: { er: {} } } } })
    await mount(source, { from: b.root, to: t.root, order: 1 })
    expect(await resolveSpots({ source, from: source.V(b.root), path: [] }))
    .toEqual([{ id: b.root, key: [], own: true }])
    expect(await resolveSpots({ source, from: source.V(b.root), path: ['image'] }))
    .toEqual([
      { id: image, key: ['/'], own: true },
      { id: theirs.get('image'), key: [0, '/'], own: false },
      { id: tImage.get('image'), key: [1, '/'], own: false },
    ])
    expect(await resolved(b.root, ['image', 'deep', 'er'])).toEqual([tImage.get('image/deep/er')])
  })

  it('follows a link mount, & not the link it shadows (FR-013)', async () => {
    await renameAsB()
    expect(await resolved(b.root, ['image', 'hats'])).toEqual([theirs.get('image/hatz')])
    expect(await resolved(b.root, ['image', 'hatz'])).toEqual([])
    expect(await resolved(s.root, ['image', 'hatz'])).toEqual([theirs.get('image/hatz')])
  })

  it('lets a higher layer’s own link outrank a lower layer’s mount of it', async () => {
    const t = await seedUser(source, { address: '0xt' })
    const tImage = (await seedTree(source, { root: t.root, tree: { image: {} } })).get('image')!
    await mount(source, { from: b.root, to: t.root, order: 1 })
    await mountLink(source, {
      from: tImage,
      to: theirs.get('image/hatz')!,
      uuid: hatz,
      path: 'caps',
      parent: await spotUuid(theirs.get('image')!),
    })
    expect(await resolved(b.root, ['image', 'hatz'])).toEqual([theirs.get('image/hatz')])
    expect(await resolved(b.root, ['image', 'caps'])).toEqual([])
    expect(await names(b.root, ['image'])).toEqual(['hatz'])
    expect(await resolved(t.root, ['image', 'caps'])).toEqual([theirs.get('image/hatz')])
  })

  it('lists a link mount as one entry, not as a layer (R4)', async () => {
    await renameAsB()
    const listing = await at(b.root, ['image'])
    expect(listing.layers).toEqual([image, theirs.get('image')])
    expect(listing.children).toEqual([{
      name: 'hats',
      ids: [theirs.get('image/hatz')],
      parents: [image],
      contents: [],
      container: true,
    }])
    expect(await names(b.root, ['image', 'hats'])).toEqual(['bowler', 'top'])
    expect(await names(s.root, ['image'])).toEqual(['hatz'])
  })

  it('still merges same-named links of different uuids', async () => {
    const own = (await seedTree(source, { root: b.root, tree: { image: { hatz: {} } } })).get('image/hatz')!
    const [child] = (await at(b.root, ['image'])).children
    expect(child).toMatchObject({ name: 'hatz', ids: [own, theirs.get('image/hatz')] })
  })

  it('keeps listing a mount whose link is gone, or whose layer is (FR-014)', async () => {
    await renameAsB()
    await source.V(theirs.get('image')!).outE('CONTAINS').drop().toList()
    expect(await names(b.root, ['image'])).toEqual(['hats'])
    expect(await names(b.root, ['image', 'hats'])).toEqual(['bowler', 'top'])
    await source.V(b.root).outE('MOUNT').drop().toList()
    const [child] = (await at(b.root, ['image'])).children
    expect(child).toEqual(expect.objectContaining({ name: 'hats' }))
    expect(child.moved).toBeUndefined()
  })

  it('finishes when a mounted link’s target mounts the tree above it', async () => {
    await renameAsB()
    await mount(source, { from: theirs.get('image/hatz')!, to: b.root })
    expect(await resolved(b.root, ['image', 'hats', 'image', 'hats']))
    .toEqual([theirs.get('image/hatz')])
    const listing = await at(b.root, ['image', 'hats'])
    const images = listing.children.filter(({ name }) => name === 'image')
    expect(images).toHaveLength(1)
    expect(images[0].ids.filter((id) => id === image)).toHaveLength(1)
  })

  it('lists a Unicode-named link mount (FR-012)', async () => {
    await renameAsB('帽子 🎩')
    expect(await names(b.root, ['image'])).toEqual(['帽子 🎩'])
    expect(await names(b.root, ['image', '帽子 🎩'])).toEqual(['bowler', 'top'])
  })

  it('refuses a Spot holding two mounts of one link', async () => {
    await renameAsB()
    await renameAsB('caps')
    await expect(at(b.root, ['image'])).rejects.toThrow(/mounts the link .* twice/)
  })

  it('refuses a mount that is both a link & a layer', async () => {
    await renameAsB()
    await source.V(image).outE('MOUNT').property('order', 0).toList()
    await expect(at(b.root, ['image'])).rejects.toThrow(/both a link & a layer/)
  })

  it('gives every layer row the key of its start', async () => {
    const starts = await resolveSpots({ source, from: source.V(b.root), path: ['image'] })
    const rows = await layerRows({ source, starts })
    expect(rows.map((row) => row.get('key'))).toEqual([['/'], [0, '/']])
  })
})

describe('listing deep through mounts & mounted links (plan.md)', () => {
  const listingAt = listed
  it('lists at depth 10 through 3 layers & a mounted link per level in under 150 ms', { timeout: 120_000 }, async () => {
    const { renameSpot } = await import('#lib/server/renames.js')
    const b = await seedUser(source, { address: '0xb' })
    const chain = (depth: number): FileTree => (
      depth === 0 ? {} : { d: chain(depth - 1), [`leaf${depth}`]: {} }
    )
    for(const [order, address] of ['0x1', '0x2', '0x3'].entries()) {
      const other = await seedUser(source, { address })
      await seedTree(source, { root: other.root, tree: chain(11) })
      await mount(source, { from: b.root, to: other.root, order })
    }
    const path: Array<string> = []
    for(let level = 0; level < 10; level++) {
      await renameSpot({ source, address: '0xb', path, from: 'd', to: `e${level}`, now: new Date().toISOString() })
      path.push(`e${level}`)
    }
    const listed = () => listingAt({ source, from: source.V(b.root), path })
    expect((await listed()).children.map(({ name }) => name).sort()).toEqual(['d', 'leaf1'])
    const times = []
    for(let run = 0; run < 5; run++) {
      const start = performance.now()
      await listed()
      times.push(performance.now() - start)
    }
    times.sort((x, y) => x - y)
    expect(times[2]).toBeLessThan(150)
  })
})
