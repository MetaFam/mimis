import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import { v7 as uuidV7 } from 'uuid'
import { assertOwned, mergeDevice, ownersOf } from '#lib/server/janusgraph.js'
import {
  addSpot, link, seedTree, seedUser, testAccount, transaction, type Id,
} from '#lib/server/testing.js'

const { statics: __ } = gremlin.process
type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
let address: string
let user: Id
let device: Id
let root: Id
const now = '2026-11-21T00:00:00.000Z'
const newAddress = () => testAccount().address.toLowerCase()

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  address = newAddress()
  ;({ user, device, root } = await seedUser(source, { address }))
})

afterEach(async () => {
  await rollback()
})

describe('ownersOf', () => {
  it('gives the author of the tree holding a Spot, once', async () => {
    const ids = await seedTree(source, { root, tree: { a: { s: {} }, b: {} } })
    await link(source, { from: ids.get('b')!, to: ids.get('a/s')!, name: 'again' })
    expect(await ownersOf({ source, spot: ids.get('a/s')! })).toEqual([address])
    expect(await ownersOf({ source, spot: root })).toEqual([address])
  })

  it('gives nothing for a Spot no user reaches', async () => {
    expect(await ownersOf({ source, spot: await addSpot(source) })).toEqual([])
  })

  it('gives both authors for a Spot in two trees', async () => {
    const other = newAddress()
    const { root: theirs } = await seedUser(source, { address: other })
    const shared = await addSpot(source)
    await link(source, { from: root, to: shared, name: 'mine' })
    await link(source, { from: theirs, to: shared, name: 'theirs' })
    expect((await ownersOf({ source, spot: shared })).sort())
    .toEqual([address, other].sort())
  })

  it('throws for a user whose `INCLUDES` has no author', async () => {
    await source.V(user).inE('INCLUDES').properties('author').drop().toList()
    await expect(ownersOf({ source, spot: root }))
    .rejects.toThrow(`User #${user} has no INCLUDES author.`)
  })
})

describe('assertOwned', () => {
  it('passes for the owner', async () => {
    await expect(assertOwned({ source, ids: { spot: root }, address }))
    .resolves.toBeUndefined()
  })

  it('throws a 403 for anyone else', async () => {
    const other = newAddress()
    await expect(assertOwned({ source, ids: { spot: root }, address: other }))
    .rejects.toMatchObject({
      status: 403,
      body: { message: `The spot, Spot #${root}, doesn’t belong to the user ${other}.` },
    })
  })

  it('throws a 400 for something that isn’t an id', async () => {
    await expect(assertOwned({ source, ids: { spot: null }, address }))
    .rejects.toMatchObject({ status: 400 })
  })
})

describe('mergeDevice', () => {
  const chain = (updates: Id) => (
    source.V(updates)
    .in_('COMMITS').hasLabel('Device').as('device')
    .in_('USES').hasLabel('User').as('user')
    .inE('INCLUDES').as('includes')
    .outV().hasLabel('Users')
    .select('device', 'user', 'includes')
    .by('uuid').by('address').by('author')
    .toList()
  )
  const size = async () => (
    (await (
      source.V().has('User', 'address', address)
      .emit().repeat(__.out('USES', 'COMMITS'))
      .count().next()
    )).value
  )

  it('creates `Users` → `User` → `Device` → `Updates` for a new author', async () => {
    const other = newAddress()
    const uuid = uuidV7()
    const updates = await mergeDevice({ source, address: other, device: uuid, now })
    expect((await chain(updates)).map((row) => Object.fromEntries(row as Map<string, unknown>)))
    .toEqual([{ device: uuid, user: other, includes: other }])
  })

  it('reuses everything when run again', async () => {
    const other = newAddress()
    const uuid = uuidV7()
    const updates = await mergeDevice({ source, address: other, device: uuid, now })
    const before = (await source.V().has('User', 'address', other).bothE().count().next()).value
    expect(await mergeDevice({ source, address: other, device: uuid, now })).toBe(updates)
    expect((await source.V().has('User', 'address', other).bothE().count().next()).value)
    .toBe(before)
    expect((await source.V().has('User', 'address', other).count().next()).value).toBe(1)
  })

  it('finds a seeded user’s own Device', async () => {
    const uuid = (await source.V(device).values('uuid').next()).value as string
    const updates = (await source.V(device).out('COMMITS').id().next()).value
    const before = await size()
    expect(await mergeDevice({ source, address, device: uuid, now })).toBe(updates)
    expect(await size()).toBe(before)
  })

  it('keeps one user’s Device apart from another’s with the same uuid', async () => {
    const other = newAddress()
    const uuid = (await source.V(device).values('uuid').next()).value as string
    const theirs = await mergeDevice({ source, address: other, device: uuid, now })
    const mine = (await source.V(device).out('COMMITS').id().next()).value
    expect(theirs).not.toBe(mine)
    expect((await chain(theirs)).map((row) => Object.fromEntries(row as Map<string, unknown>)))
    .toEqual([{ device: uuid, user: other, includes: other }])
  })
})
