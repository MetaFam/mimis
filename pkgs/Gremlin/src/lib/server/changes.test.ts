import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import * as dagCBOR from '@ipld/dag-cbor'
import { cidFor } from '#lib/updates.js'
import {
  entriesOf, fingerprint, pendingSpots, rootOf,
} from '#lib/server/changes.js'
import { putRepresentation, retire } from '#lib/server/edits.js'
import { edgeId } from '#lib/server/janusgraph.js'
import {
  addSpot, attach, link, markPublished, mount, seedTree, seedUser,
  testAccount, transaction, type Id,
} from '#lib/server/testing.js'

const { statics: __ } = gremlin.process
type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
let address: string
let root: Id
let ids: Map<string, Id>
const now = '2026-11-21T00:00:00.000Z'

const file = async (n: number) => (
  (await cidFor(dagCBOR.encode({ file: n }))).toString()
)
const newAddress = () => testAccount().address.toLowerCase()

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  address = newAddress()
  ;({ root } = await seedUser(source, { address }))
  ids = await seedTree(source, {
    root,
    tree: {
      icon: { hat: { 'top.svg': { file: await file(1) } } },
      a: { s: {} },
      b: {},
    },
  })
})

afterEach(async () => {
  await rollback()
})

const spotIds = () => [...ids.entries()].filter(([path]) => !path.includes('.')).map(([, id]) => id)
const publishAll = () => markPublished(source, { ids: spotIds(), address })
const pending = async () => (
  (await pendingSpots({ source, address })).map(({ path }) => path.join('/'))
)
const edgeFrom = async (from: Id, label: string) => (
  edgeId((await source.V(from).outE(label).id().next()).value)
)
const containsOf = async (from: Id, to: Id) => (
  edgeId((await source.V(from).outE('CONTAINS').where(__.inV().hasId(to)).id().next()).value)
)

describe('fingerprint', () => {
  it.each([
    [{ kind: 'CONTAINS', path: 'hat', child: 'u1' }, '["hat","u1"]'],
    [{ kind: 'MOUNT', target: 't1', order: 2 }, '["t1",null,2]'],
    [{ kind: 'MOUNT', target: 't1', creator: '0xabc', order: 2 }, '["t1","0xabc",2]'],
    [{ kind: 'AS', content: 'c1', order: -1, type: 'image/png' }, '["c1",-1,"image/png"]'],
    [{ kind: 'IS', uuid: 'i1', cid: 'bafy', size: 3 }, '["i1","bafy",3]'],
  ] as const)('fingerprints %o as %s', (fields, expected) => {
    expect(fingerprint(fields)).toBe(expected)
  })
})

describe('rootOf', () => {
  it('finds the root the user WRITES', async () => {
    expect(await rootOf({ source, address })).toBe(root)
  })

  it('throws for a user with no root', async () => {
    await expect(rootOf({ source, address: newAddress() }))
    .rejects.toThrow(/^No root Spot for 0x[0-9a-f]{40}\.$/)
  })
})

describe('pendingSpots', () => {
  it('lists a new tree, sorted by path, with its counts', async () => {
    expect(await pendingSpots({ source, address })).toEqual([
      { id: root, uuid: expect.any(String), path: [], isNew: true, staged: false, added: 3, removed: 0 },
      { id: ids.get('a'), uuid: expect.any(String), path: ['a'], isNew: true, staged: false, added: 1, removed: 0 },
      { id: ids.get('a/s'), uuid: expect.any(String), path: ['a', 's'], isNew: true, staged: false, added: 0, removed: 0 },
      { id: ids.get('b'), uuid: expect.any(String), path: ['b'], isNew: true, staged: false, added: 0, removed: 0 },
      { id: ids.get('icon'), uuid: expect.any(String), path: ['icon'], isNew: true, staged: false, added: 1, removed: 0 },
      { id: ids.get('icon/hat'), uuid: expect.any(String), path: ['icon', 'hat'], isNew: true, staged: false, added: 1, removed: 0 },
      { id: ids.get('icon/hat/top'), uuid: expect.any(String), path: ['icon', 'hat', 'top'], isNew: true, staged: false, added: 2, removed: 0 },
    ])
  })

  it('reports `staged`', async () => {
    await source.V(ids.get('b')).property('staged', true).toList()
    expect((await pendingSpots({ source, address })).find(({ id }) => id === ids.get('b')))
    .toMatchObject({ staged: true })
  })

  it('is empty once everything is marked published', async () => {
    await publishAll()
    expect(await pendingSpots({ source, address })).toEqual([])
  })

  describe('after publishing, a Spot is pending when', () => {
    beforeEach(publishAll)

    it('it has no `cid`', async () => {
      await source.V(ids.get('b')).properties('cid').drop().toList()
      expect(await pendingSpots({ source, address })).toEqual([
        expect.objectContaining({ path: ['b'], isNew: true, added: 0, removed: 0 }),
      ])
    })

    it('an entry has no `published`', async () => {
      await link(source, { from: ids.get('b')!, to: await addSpot(source), name: 'new' })
      expect(await pending()).toEqual(['b', 'b/new'])
    })

    it('a link is renamed, under its old key & with no marker', async () => {
      const edge = await containsOf(ids.get('a')!, ids.get('a/s')!)
      const key = (await source.E(edge).values('uuid').next()).value
      await source.E(edge).property('path', 'renamed').toList()
      expect(await pending()).toEqual(['a'])
      const { spots } = await entriesOf({ source, ids: [ids.get('a')!], address })
      const a = spots.get(ids.get('a')!)!
      expect(a.entries).toEqual([expect.objectContaining({ kind: 'CONTAINS', key, pending: true })])
      expect(a.markers).toEqual([])
    })

    it('a Content’s `AS.order` changes', async () => {
      await source.V(ids.get('icon/hat/top')).outE('AS').property('order', 3).toList()
      expect(await pending()).toEqual(['icon/hat/top'])
    })

    it('it has a `REMOVED` out-edge', async () => {
      await retire({ source, edge: await containsOf(ids.get('a')!, ids.get('a/s')!), now })
      expect(await pendingSpots({ source, address })).toEqual([
        expect.objectContaining({ path: ['a'], added: 0, removed: 1 }),
      ])
    })

    it('a Content it holds has no `cid`', async () => {
      await source.V(ids.get('icon/hat/top.svg')).properties('cid').drop().toList()
      expect(await pending()).toEqual(['icon/hat/top'])
    })

    it('a Content it holds has a pending representation', async () => {
      await putRepresentation({
        source, spot: ids.get('icon/hat/top')!, type: 'image/svg+xml', cid: await file(2), size: 5, now,
      })
      expect(await pendingSpots({ source, address })).toEqual([
        expect.objectContaining({ path: ['icon', 'hat', 'top'], added: 1, removed: 1 }),
      ])
    })
  })

  describe('after publishing, a Spot isn’t pending when', () => {
    beforeEach(publishAll)

    it('a child gets a new version (FR-011)', async () => {
      await source.V(ids.get('a/s')).property('cid', await file(9)).toList()
      expect(await pendingSpots({ source, address })).toEqual([])
    })

    it('a link is moved away & back', async () => {
      const edge = await containsOf(ids.get('a')!, ids.get('a/s')!)
      const uuid = (await source.E(edge).values('uuid').next()).value as string
      await retire({ source, edge, now })
      await source.V(ids.get('a')).addE('CONTAINS').to(__.V(ids.get('a/s')))
      .property('path', 's').property('uuid', uuid).toList()
      expect(await pendingSpots({ source, address })).toEqual([])
      const { spots } = await entriesOf({ source, ids: [ids.get('a')!], address })
      expect(spots.get(ids.get('a')!)!.markers).toEqual([
        expect.objectContaining({ kind: 'CONTAINS', key: uuid, pending: false }),
      ])
    })

    it('an entry is added & retired before publishing (FR-010)', async () => {
      const child = await addSpot(source)
      await link(source, { from: ids.get('b')!, to: child, name: 'brief' })
      await retire({ source, edge: await edgeFrom(ids.get('b')!, 'CONTAINS'), now })
      expect(await pendingSpots({ source, address })).toEqual([])
    })
  })

  it('doesn’t list a Spot reached only through a mount', async () => {
    await publishAll()
    const { root: elsewhere } = await seedUser(source, { address: newAddress() })
    await mount(source, { from: ids.get('b')!, to: elsewhere })
    await source.V(ids.get('b')).outE('MOUNT').property('published', 'stale').toList()
    expect((await pendingSpots({ source, address })).map(({ id }) => id)).not.toContain(elsewhere)
  })

  it('doesn’t list a Spot reached only through a marker', async () => {
    await publishAll()
    await retire({ source, edge: await containsOf(ids.get('a')!, ids.get('a/s')!), now })
    await source.V(ids.get('a/s')).properties('cid').drop().toList()
    expect(await pending()).toEqual(['a'])
  })

  it('lists a Spot with two parents once, by its lowest-uuid link', async () => {
    const shared = await addSpot(source)
    await link(source, { from: ids.get('b')!, to: shared, name: 'first' })
    await link(source, { from: ids.get('a')!, to: shared, name: 'second' })
    const listed = (await pendingSpots({ source, address })).filter(({ id }) => id === shared)
    expect(listed).toEqual([expect.objectContaining({ path: ['b', 'first'] })])
  })
})

describe('entriesOf', () => {
  const entriesOfA = () => entriesOf({ source, ids: [ids.get('a')!], address })

  it('throws for a link without a uuid', async () => {
    const edge = await containsOf(ids.get('a')!, ids.get('a/s')!)
    await source.E(edge).properties('uuid').drop().toList()
    await expect(entriesOfA()).rejects.toThrow(`CONTAINS ${edge} has no uuid.`)
  })

  it('throws for a link without a path', async () => {
    const edge = await containsOf(ids.get('a')!, ids.get('a/s')!)
    await source.E(edge).properties('path').drop().toList()
    await expect(entriesOfA()).rejects.toThrow(`CONTAINS ${edge} has no path.`)
  })

  it('throws for a representation without a uuid', async () => {
    const { is } = await attach(source, { to: ids.get('a')!, type: 'text/plain', cid: await file(3) })
    await source.E(is).properties('uuid').drop().toList()
    await expect(entriesOfA()).rejects.toThrow(`IS ${is} has no uuid.`)
  })

  it('throws for a holding without an order', async () => {
    // The graph’s schema makes `order` an Integer, so a missing one is
    // the only kind that isn’t a number.
    await attach(source, { to: ids.get('a')!, type: 'text/plain', cid: await file(3) })
    const edge = await edgeFrom(ids.get('a')!, 'AS')
    await source.E(edge).properties('order').drop().toList()
    await expect(entriesOfA()).rejects.toThrow(`AS ${edge} has no numeric order.`)
  })

  it('throws for two current Contents of one type', async () => {
    await attach(source, { to: ids.get('a')!, type: 'text/plain', cid: await file(3) })
    await attach(source, { to: ids.get('a')!, type: 'text/plain', cid: await file(4) })
    await expect(entriesOfA())
    .rejects.toThrow(`Spot #${ids.get('a')} holds two Contents of type “text/plain”.`)
  })

  it('throws a 400 for two mounts of one target', async () => {
    const target = ids.get('b')!
    await mount(source, { from: ids.get('a')!, to: target, order: 0 })
    await mount(source, { from: ids.get('a')!, to: target, order: 1 })
    await expect(entriesOfA()).rejects.toMatchObject({
      status: 400,
      body: { message: `Spot #${ids.get('a')} mounts Spot #${target} twice.` },
    })
  })

  describe('mount creators (R14)', () => {
    const mountEntry = async (target: Id) => {
      await mount(source, { from: ids.get('a')!, to: target, order: 1 })
      const { spots } = await entriesOfA()
      return spots.get(ids.get('a')!)!.entries.find(({ kind }) => kind === 'MOUNT')!
    }
    const uuidOf = async (id: Id) => (await source.V(id).values('uuid').next()).value as string

    it('gives none for a target in the publisher’s own tree', async () => {
      const entry = await mountEntry(ids.get('b')!)
      expect(entry.fields).toEqual({ kind: 'MOUNT', target: await uuidOf(ids.get('b')!), order: 1 })
      expect(entry.fingerprint).toBe(`["${await uuidOf(ids.get('b')!)}",null,1]`)
    })

    it('gives the owner’s `INCLUDES.author` for another user’s tree', async () => {
      const other = newAddress()
      const { root: theirs } = await seedUser(source, { address: other })
      const entry = await mountEntry(theirs)
      expect(entry.fields).toEqual({ kind: 'MOUNT', target: await uuidOf(theirs), creator: other, order: 1 })
      expect(entry.fingerprint).toBe(`["${await uuidOf(theirs)}","${other}",1]`)
    })

    it('throws a 500 for a target no user reaches', async () => {
      const orphan = await addSpot(source)
      await expect(mountEntry(orphan)).rejects.toMatchObject({
        status: 500,
        body: { message: `Can’t tell who owns mount target Spot #${orphan}.` },
      })
    })

    it('throws a 500 for a target two other users reach', async () => {
      const shared = await addSpot(source)
      for(const other of [newAddress(), newAddress()]) {
        const { root: theirs } = await seedUser(source, { address: other })
        await link(source, { from: theirs, to: shared, name: 'shared' })
      }
      await expect(mountEntry(shared)).rejects.toMatchObject({
        status: 500,
        body: { message: `Can’t tell who owns mount target Spot #${shared}.` },
      })
    })
  })

  it('gives each kind of entry its key & fingerprint', async () => {
    const { spots, contents } = await entriesOf({
      source, ids: [ids.get('icon/hat')!, ids.get('icon/hat/top')!], address,
    })
    const hat = spots.get(ids.get('icon/hat')!)!
    const top = spots.get(ids.get('icon/hat/top')!)!
    const [link] = hat.entries
    expect(link).toMatchObject({
      kind: 'CONTAINS', to: ids.get('icon/hat/top'), pending: true,
      fields: { kind: 'CONTAINS', path: 'top', child: top.uuid },
    })
    expect(link.fingerprint).toBe(`["top","${top.uuid}"]`)
    const content = contents.get(ids.get('icon/hat/top.svg')!)!
    expect(top.contents).toEqual([content.id])
    expect(top.entries).toEqual([expect.objectContaining({
      kind: 'AS', key: content.uuid,
      fields: { kind: 'AS', content: content.uuid, order: 0, type: 'image/svg+xml' },
    })])
    expect(content.entries).toEqual([expect.objectContaining({
      kind: 'IS', fields: { kind: 'IS', uuid: content.entries[0].key, cid: await file(1), size: 1 },
    })])
  })
})
