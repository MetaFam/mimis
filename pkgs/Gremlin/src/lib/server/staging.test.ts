import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanStaged, stageSpots } from '#lib/server/staging.js'
import { pendingSpots } from '#lib/server/changes.js'
import {
  addSpot, link, markPublished, seedTree, seedUser, testAccount,
  transaction, type Id,
} from '#lib/server/testing.js'

type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
let address: string
let root: Id
let ids: Map<string, Id>

const newAddress = () => testAccount().address.toLowerCase()
const staged = async () => (
  (await pendingSpots({ source, address })).filter(({ staged }) => staged).map(({ id }) => id).sort()
)
const flagged = async (id: Id) => (
  (await source.V(id).values('staged').toList())
)

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  address = newAddress()
  ;({ root } = await seedUser(source, { address }))
  ids = await seedTree(source, { root, tree: { a: { s: {} }, b: {} } })
})

afterEach(async () => {
  await rollback()
})

describe('stageSpots', () => {
  it('stages & unstages Spots by id', async () => {
    const [a, b] = [ids.get('a')!, ids.get('b')!]
    expect(await stageSpots({ source, address, ids: [a, b], staged: true }))
    .toEqual({ staged: 2 })
    expect(await staged()).toEqual([a, b].sort())
    expect(await stageSpots({ source, address, ids: [a], staged: false }))
    .toEqual({ staged: 1 })
    expect(await staged()).toEqual([b])
    expect(await flagged(a)).toEqual([])
  })

  it('stages exactly the pending Spots with `all`', async () => {
    await markPublished(source, { ids: [ids.get('a/s')!], address })
    expect(await stageSpots({ source, address, all: true })).toEqual({ staged: 3 })
    expect(await staged()).toEqual([root, ids.get('a')!, ids.get('b')!].sort())
    expect(await flagged(ids.get('a/s')!)).toEqual([])
  })

  it('refuses a Spot in another user’s tree with a 403', async () => {
    const { root: theirs } = await seedUser(source, { address: newAddress() })
    await expect(stageSpots({ source, address, ids: [theirs], staged: true }))
    .rejects.toMatchObject({
      status: 403,
      body: { message: `The Spot, Spot #${theirs}, doesn’t belong to the user ${address}.` },
    })
    expect(await flagged(theirs)).toEqual([])
  })

  it('refuses a Spot with nothing pending with a 400', async () => {
    const s = ids.get('a/s')!
    await markPublished(source, { ids: [s], address })
    await expect(stageSpots({ source, address, ids: [s], staged: true }))
    .rejects.toMatchObject({
      status: 400,
      body: { message: `Spot #${s} has nothing to publish.` },
    })
  })

  it('unstages a Spot with nothing pending', async () => {
    const s = ids.get('a/s')!
    await source.V(s).property('staged', true).toList()
    await markPublished(source, { ids: [s], address })
    await stageSpots({ source, address, ids: [s], staged: false })
    expect(await flagged(s)).toEqual([])
  })
})

describe('cleanStaged', () => {
  it('unstages only staged Spots with nothing pending (R19)', async () => {
    const [a, s, b] = [ids.get('a')!, ids.get('a/s')!, ids.get('b')!]
    await stageSpots({ source, address, ids: [a, s, b], staged: true })
    await markPublished(source, { ids: [s, b], address })
    await link(source, { from: b, to: s, name: 'again' })
    await cleanStaged({ source, address })
    expect(await flagged(a)).toEqual([true])
    expect(await flagged(s)).toEqual([])
    expect(await flagged(b)).toEqual([true])
  })
})
