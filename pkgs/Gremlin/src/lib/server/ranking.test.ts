import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import { holdingsOf, putRepresentation, release } from '#lib/server/edits.js'
import { placeContent, rankingAt } from '#lib/server/ranking.js'
import {
  attach, mount, seedTree, seedUser, testAccount, transaction, type Id,
} from '#lib/server/testing.js'

const { statics: __ } = gremlin.process
type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
const now = '2026-11-22T00:00:00.000Z'
const newAddress = () => testAccount().address.toLowerCase()

// A: /image/hat holds A1–A5. B’s root mounts A’s, so B sees them too.
let a: string
let b: string
let aHat: Id
let theirs: Array<Id>
let bRoot: Id
beforeEach(async () => {
  ;({ source, rollback } = transaction())
  ;[a, b] = [newAddress(), newAddress()]
  const { root: aRoot } = await seedUser(source, { address: a })
  ;({ root: bRoot } = await seedUser(source, { address: b }))
  aHat = (await seedTree(source, { root: aRoot, tree: { image: { hat: {} } } })).get('image/hat')!
  theirs = []
  for(const n of [1, 2, 3, 4, 5]) {
    theirs.push((await attach(source, { to: aHat, type: 'image/svg+xml', cid: `bafyA${n}` })).content)
  }
  await mount(source, { from: bRoot, to: aRoot })
})

afterEach(async () => {
  await rollback()
})

const path = ['image', 'hat']
const cids = async (address: string) => (
  (await rankingAt({ source, address, path })).map(({ cid }) => cid)
)
const place = (address: string, content: Id, index: number) => (
  placeContent({ source, address, path, content, index, now })
)
const aOrder = async () => (
  (await holdingsOf({ source, spot: aHat })).map(({ id, after }) => [id, after])
)
const bHat = async () => (
  (await (
    source.V(bRoot)
    .outE('CONTAINS').has('path', 'image').inV()
    .outE('CONTAINS').has('path', 'hat').inV()
    .id()
    .next()
  )).value as Id | undefined
)

describe('rankingAt', () => {
  it('ranks the Contents at a path, marking whose they are', async () => {
    expect(await rankingAt({ source, address: a, path })).toEqual(
      theirs.map((id, n) => expect.objectContaining({ id, cid: `bafyA${n + 1}`, own: true }))
    )
    expect((await rankingAt({ source, address: b, path })).map(({ own }) => own))
    .toEqual([false, false, false, false, false])
  })

  it('ranks nothing at an empty path', async () => {
    expect(await rankingAt({ source, address: a, path: ['image'] })).toEqual([])
  })
})

describe('placeContent', () => {
  it('reorders the user’s own Contents in place, with no proxies (US3)', async () => {
    await place(a, theirs[2], 0)
    expect(await cids(a)).toEqual(['bafyA3', 'bafyA1', 'bafyA2', 'bafyA4', 'bafyA5'])
    expect(await source.V(aHat).out('AS').out('MOUNT').count().next()).toMatchObject({ value: 0 })
  })

  it('moves one down a place', async () => {
    await place(a, theirs[1], 2)
    expect(await cids(a)).toEqual(['bafyA1', 'bafyA3', 'bafyA2', 'bafyA4', 'bafyA5'])
  })

  describe('in another user’s layer (US4)', () => {
    let before: Awaited<ReturnType<typeof aOrder>>
    beforeEach(async () => {
      before = await aOrder()
      await place(b, theirs[3], 2)
    })

    it('shows the user the new order, & the owner the old one (US4-1)', async () => {
      expect(await cids(b)).toEqual(['bafyA1', 'bafyA2', 'bafyA4', 'bafyA3', 'bafyA5'])
      expect(await cids(a)).toEqual(['bafyA1', 'bafyA2', 'bafyA3', 'bafyA4', 'bafyA5'])
    })

    it('changes nothing in the owner’s tree (SC-003)', async () => {
      expect(await aOrder()).toEqual(before)
      expect(await source.V(aHat).outE('AS').count().next()).toMatchObject({ value: 5 })
    })

    it('makes the user’s Spot with proxies for exactly what the move passed (US4-2)', async () => {
      const hat = await bHat()
      expect(hat).toBeDefined()
      const held = await holdingsOf({ source, spot: hat! })
      expect(held.map(({ mounts }) => mounts)).toEqual([theirs[3], theirs[2]])
      expect(held.map(({ type }) => type)).toEqual(['image/svg+xml', 'image/svg+xml'])
    })

    it('keeps the order as the owner adds Contents (US4-3)', async () => {
      await attach(source, { to: aHat, type: 'image/svg+xml', cid: 'bafyA6' })
      expect(await cids(b)).toEqual(['bafyA1', 'bafyA2', 'bafyA4', 'bafyA3', 'bafyA5', 'bafyA6'])
    })

    it('shows a target’s new version through its proxy (US4-4)', async () => {
      const replaced = (await source.V(theirs[3]).out('IS').id().next()).value as Id
      await (
        source.V(theirs[3]).as('content')
        .addV('Blob').property('cid', 'bafyA4v2').property('size', 1).as('blob')
        .addE('IS').from_('content').property('uuid', 'ffffffff-ffff-7fff-bfff-ffffffffffff')
        .select('blob').addE('PREVIOUS').to(__.V(replaced))
        .toList()
      )
      expect(await cids(b)).toEqual(['bafyA1', 'bafyA2', 'bafyA4v2', 'bafyA3', 'bafyA5'])
    })

    it('keeps showing a target its owner deletes', async () => {
      const [, , , gone] = await holdingsOf({ source, spot: aHat })
      await release({ source, edge: gone.edge, now })
      expect(await cids(a)).toEqual(['bafyA1', 'bafyA2', 'bafyA3', 'bafyA5'])
      expect(await cids(b)).toEqual(['bafyA1', 'bafyA2', 'bafyA4', 'bafyA3', 'bafyA5'])
    })

    it('reuses its proxies for a later move', async () => {
      const shown = await rankingAt({ source, address: b, path })
      await place(b, shown[3].id, 2)
      expect(await cids(b)).toEqual(['bafyA1', 'bafyA2', 'bafyA3', 'bafyA4', 'bafyA5'])
      expect(await holdingsOf({ source, spot: (await bHat())! })).toHaveLength(2)
    })
  })

  it('proxies only what the user’s own Content passes over', async () => {
    const hat = await placeAlternative()
    expect(await cids(b)).toEqual(['bafyB1', 'bafyA1', 'bafyA2', 'bafyA3', 'bafyA4', 'bafyA5'])
    const [mine] = await rankingAt({ source, address: b, path })
    await place(b, mine.id, 2)
    expect(await cids(b)).toEqual(['bafyA1', 'bafyA2', 'bafyB1', 'bafyA3', 'bafyA4', 'bafyA5'])
    expect((await holdingsOf({ source, spot: hat })).map(({ mounts }) => mounts ?? 'own'))
    .toEqual([theirs[0], theirs[1], 'own'])
  })

  it('moves a Content to the last place', async () => {
    await place(b, theirs[0], 4)
    expect(await cids(b)).toEqual(['bafyA2', 'bafyA3', 'bafyA4', 'bafyA5', 'bafyA1'])
    expect(await cids(a)).toEqual(['bafyA1', 'bafyA2', 'bafyA3', 'bafyA4', 'bafyA5'])
  })

  it('gives a 404 for a Content that isn’t at the path', async () => {
    const elsewhere = (await attach(source, { to: bRoot, type: 'text/plain', cid: 'bafyX' })).content
    await expect(place(b, elsewhere, 0)).rejects.toMatchObject({
      status: 404, body: { message: `Content #${elsewhere} isn’t at /image/hat.` },
    })
  })

  it.each([-1, 5, 1.5])('gives a 400 for place %s', async (index) => {
    await expect(place(b, theirs[0], index)).rejects.toMatchObject({
      status: 400, body: { message: `There’s no place ${index} among 5 Contents.` },
    })
  })

  async function placeAlternative() {
    const hat = (await seedTree(source, { root: bRoot, tree: { image: { hat: {} } } })).get('image/hat')!
    await putRepresentation({ source, spot: hat, type: 'image/svg+xml', cid: 'bafyB1', size: 1, now })
    return hat
  }
})
