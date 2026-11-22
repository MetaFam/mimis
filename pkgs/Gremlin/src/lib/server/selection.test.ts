import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import * as dagCBOR from '@ipld/dag-cbor'
import { cidFor } from '#lib/updates.js'
import { select } from '#lib/server/selection.js'
import { putRepresentation, retire } from '#lib/server/edits.js'
import { relinkContent, relinkSpot } from '#lib/server/moves.js'
import { v7 as uuidV7 } from 'uuid'
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
const at = (path: string) => ids.get(path)!
const containsOf = async (from: Id, to: Id) => (
  edgeId((await source.V(from).outE('CONTAINS').where(__.inV().hasId(to)).id().next()).value)
)
const reasons = (selected: Map<Id, { reason: string }>) => (
  Object.fromEntries([...selected.entries()].map(([id, { reason }]) => [id, reason]))
)

describe('select', () => {
  it('leaves a staged Spot’s links to new folders for those folders (FR-030)', async () => {
    const { spots, contents, clean } = await select({ source, address, staged: [root] })
    expect(reasons(spots)).toEqual({ [root]: 'staged' })
    expect(spots.get(root)).toMatchObject({ root: true, entries: [] })
    expect(contents.size).toBe(0)
    expect(clean).toEqual([])
  })

  it('brings along a staged Spot’s new files, with their Content (rule 2)', async () => {
    const { spots, contents } = await select({ source, address, staged: [at('icon/hat')] })
    expect(reasons(spots)).toEqual({
      [at('icon/hat')]: 'staged',
      [at('icon/hat/top')]: 'new',
      [at('icon')]: 'connect',
      [root]: 'connect',
    })
    expect(reasons(contents)).toEqual({ [at('icon/hat/top.svg')]: 'new' })
    expect(spots.get(at('icon/hat'))!.entries)
    .toEqual([expect.objectContaining({ kind: 'CONTAINS', to: at('icon/hat/top') })])
  })

  it('links new Spots staged together, once each', async () => {
    const shared = await addSpot(source)
    await link(source, { from: at('a'), to: shared, name: 'one' })
    await link(source, { from: at('b'), to: shared, name: 'two' })
    const { spots } = await select({ source, address, staged: [...spotIds(), shared] })
    expect(new Set(Object.values(reasons(spots)))).toEqual(new Set(['staged']))
    expect(spots.size).toBe(spotIds().length + 1)
    expect(spots.get(root)).toMatchObject({ root: true })
    expect(spots.get(at('a'))).toMatchObject({ root: false })
    expect(spots.get(at('a'))!.entries.map(({ kind }) => kind)).toEqual(['CONTAINS', 'CONTAINS'])
  })

  it('selects a staged Spot’s pending entries & its Contents’ representations (rule 1)', async () => {
    await publishAll()
    const fedora = await addSpot(source)
    await attach(source, { to: fedora, type: 'image/svg+xml', cid: await file(3) })
    await link(source, { from: at('icon/hat/top'), to: fedora, name: 'fedora' })
    await putRepresentation({
      source, spot: at('icon/hat/top'), type: 'image/svg+xml', cid: await file(2), size: 2, now,
    })
    const { spots, contents } = await select({ source, address, staged: [at('icon/hat/top')] })
    expect(reasons(spots)).toEqual({ [at('icon/hat/top')]: 'staged', [fedora]: 'new' })
    const top = spots.get(at('icon/hat/top'))!
    expect(top.entries).toEqual([expect.objectContaining({ kind: 'CONTAINS', to: fedora })])
    const content = contents.get(at('icon/hat/top.svg'))!
    expect(content.reason).toBe('staged')
    expect(content.entries).toEqual([expect.objectContaining({
      kind: 'IS', fields: expect.objectContaining({ cid: await file(2), previous: expect.any(String) }),
    })])
    expect(content.markers).toEqual([])
  })

  it('doesn’t bring along a published child with changes of its own (FR-030)', async () => {
    await publishAll()
    await link(source, { from: at('a/s'), to: at('b'), name: 'again' })
    const fresh = await addSpot(source)
    await attach(source, { to: fresh, type: 'text/plain', cid: await file(3) })
    await link(source, { from: at('a'), to: fresh, name: 'fresh' })
    const { spots } = await select({ source, address, staged: [at('a')] })
    expect(reasons(spots)).toEqual({ [at('a')]: 'staged', [fresh]: 'new' })
  })

  it('publishes a mount but never follows it', async () => {
    await publishAll()
    const { root: theirs } = await seedUser(source, { address: newAddress() })
    await mount(source, { from: at('b'), to: theirs, order: 1 })
    const { spots } = await select({ source, address, staged: [at('b')] })
    expect(reasons(spots)).toEqual({ [at('b')]: 'staged' })
    expect(spots.get(at('b'))!.entries).toEqual([expect.objectContaining({ kind: 'MOUNT', to: theirs })])
  })

  it('selects nothing for Spots whose changes cancel out, & cleans them', async () => {
    await publishAll()
    const edge = await containsOf(at('a'), at('a/s'))
    const uuid = (await source.E(edge).values('uuid').next()).value as string
    await retire({ source, edge, now })
    await source.V(at('a')).addE('CONTAINS').to(__.V(at('a/s')))
    .property('path', 's').property('uuid', uuid).toList()
    const { spots, contents, clean } = await select({ source, address, staged: [at('a'), at('b')] })
    expect(spots.size).toBe(0)
    expect(contents.size).toBe(0)
    expect(clean.sort()).toEqual([at('a'), at('b')].sort())
  })

  it('takes the staged Spots from the graph by default', async () => {
    await source.V(at('b')).property('staged', true).toList()
    await publishAll()
    await link(source, { from: at('b'), to: at('a/s'), name: 'again' })
    const { spots } = await select({ source, address })
    expect(spots.get(at('b'))).toMatchObject({ reason: 'staged' })
  })
})

describe('connection', () => {
  let one: Id
  let two: Id
  beforeEach(async () => {
    await publishAll()
    ;({ one, two } = Object.fromEntries(await Promise.all(
      ['one', 'two'].map(async (name) => [name, await addSpot(source)] as const)
    )))
    await link(source, { from: at('a'), to: one, name: 'one' })
    await link(source, { from: at('b'), to: two, name: 'two' })
  })

  it('connects a staged new Spot through its parent’s entry alone (US2-1, US2-3)', async () => {
    const other = await addSpot(source)
    await link(source, { from: at('a'), to: other, name: 'other' })
    const { spots } = await select({ source, address, staged: [one] })
    expect(reasons(spots)).toEqual({ [one]: 'staged', [at('a')]: 'connect' })
    expect(spots.get(at('a'))!.entries).toEqual([expect.objectContaining({ kind: 'CONTAINS', to: one })])
  })

  it('connects a new chain up to the first published Spot (US2-2)', async () => {
    const [p, q, r] = [await addSpot(source), await addSpot(source), await addSpot(source)]
    await link(source, { from: root, to: p, name: 'p' })
    await link(source, { from: p, to: q, name: 'q' })
    await link(source, { from: q, to: r, name: 'r' })
    const { spots } = await select({ source, address, staged: [r] })
    expect(reasons(spots)).toEqual({ [r]: 'staged', [q]: 'connect', [p]: 'connect', [root]: 'connect' })
    expect(spots.get(root)!.entries).toEqual([expect.objectContaining({ to: p })])
  })

  it('needs no connector for a Spot whose link readers already have', async () => {
    await source.V(one).properties('cid').drop().toList()
    await source.V(at('a')).outE('CONTAINS').where(__.inV().hasId(one))
    .property('published', 'an earlier version').toList()
    const { spots } = await select({ source, address, staged: [one] })
    expect(reasons(spots)).toEqual({ [one]: 'staged' })
  })

  it('connects through the lowest-uuid link of two pending parents', async () => {
    await link(source, { from: at('icon'), to: one, name: 'also' })
    const { spots } = await select({ source, address, staged: [one] })
    expect(reasons(spots)).toEqual({ [one]: 'staged', [at('a')]: 'connect' })
  })

  it('leaves another staged Spot’s unrelated changes out', async () => {
    const { spots } = await select({ source, address, staged: [one] })
    expect(spots.has(two)).toBe(false)
    expect(spots.has(at('b'))).toBe(false)
  })
})

describe('moves', () => {
  beforeEach(publishAll)
  const moveS = (to: Id) => relinkSpot({ source, what: at('a/s'), from: at('a'), to, now, uuid: uuidV7() })

  it('brings a moved link’s new parent along with its old one’s tombstone', async () => {
    await moveS(at('b'))
    const { spots } = await select({ source, address, staged: [at('a')] })
    expect(reasons(spots)).toEqual({ [at('a')]: 'staged', [at('b')]: 'move' })
    expect(spots.get(at('a'))!.markers).toEqual([expect.objectContaining({ kind: 'CONTAINS', pending: true })])
    expect(spots.get(at('b'))!.entries).toEqual([expect.objectContaining({ kind: 'CONTAINS', to: at('a/s') })])
  })

  it('brings a moved link’s old parent along with its new one', async () => {
    await moveS(at('b'))
    const { spots } = await select({ source, address, staged: [at('b')] })
    expect(reasons(spots)).toEqual({ [at('b')]: 'staged', [at('a')]: 'move' })
    expect(spots.get(at('a'))!.markers).toHaveLength(1)
  })

  it('pairs a moved Content’s holdings by its uuid', async () => {
    const content = at('icon/hat/top.svg')
    await relinkContent({ source, what: content, from: at('icon/hat/top'), to: at('b'), now })
    const { spots, contents } = await select({ source, address, staged: [at('icon/hat/top')] })
    expect(reasons(spots)).toEqual({ [at('icon/hat/top')]: 'staged', [at('b')]: 'move' })
    expect(spots.get(at('b'))!.entries).toEqual([expect.objectContaining({ kind: 'AS', to: content })])
    expect(contents.size).toBe(0)
  })

  it('connects a new destination too (US3-5)', async () => {
    const fresh = await addSpot(source)
    await link(source, { from: at('b'), to: fresh, name: 'fresh' })
    await moveS(fresh)
    const { spots } = await select({ source, address, staged: [at('a')] })
    expect(reasons(spots)).toEqual({ [at('a')]: 'staged', [fresh]: 'move', [at('b')]: 'connect' })
    expect(spots.get(fresh)!.entries).toEqual([expect.objectContaining({ to: at('a/s') })])
  })
})
