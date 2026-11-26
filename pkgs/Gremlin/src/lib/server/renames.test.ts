import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import { v7 as uuidV7 } from 'uuid'
import { unlinkSpot } from '#lib/server/edits.js'
import { edgeId, ownersOf } from '#lib/server/janusgraph.js'
import { listingAt } from '#lib/server/listing.js'
import { relinkSpot } from '#lib/server/moves.js'
import {
  followMount, keepMount, noticesFor, removeMount, renameSpot, viewPathOf,
} from '#lib/server/renames.js'
import {
  addSpot, attach, link, mount, seedTree, seedUser, snapshot, transaction,
  type Id,
} from '#lib/server/testing.js'

const { statics: __ } = gremlin.process
type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
const now = '2026-11-22T00:00:00.000Z'
const B = '0xb'
let b: Awaited<ReturnType<typeof seedUser>>
let mine: Map<string, Id>

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  b = await seedUser(source, { address: B })
})

afterEach(async () => {
  await rollback()
})

const seedMine = async () => {
  mine = await seedTree(source, {
    root: b.root,
    tree: {
      image: {
        hatz: { top: {}, bowler: {} },
        'hat.svg': { file: 'bafyHat1' },
      },
    },
  })
  await attach(source, { to: mine.get('image/hat')!, type: 'image/svg+xml', cid: 'bafyHat2' })
}

const listed = (root: Id, path: Array<string>) => (
  listingAt({ source, from: source.V(root), path })
)
const names = async (root: Id, path: Array<string>) => (
  (await listed(root, path)).children.map(({ name }) => name).sort()
)
const rename = (path: Array<string>, from: string, to: string, address = B) => (
  renameSpot({ source, address, path, from, to, now })
)
/** Every edge out of `spot`, by label, with its properties. */
const edgesOf = async (spot: Id) => (
  (await (
    source.V(spot).outE()
    .project('id', 'label', 'props')
    .by(__.id())
    .by(__.label())
    .by(__.valueMap())
    .toList()
  ) as Array<Map<string, unknown>>).map((row): Record<string, unknown> => ({
    id: JSON.stringify(row.get('id')),
    label: row.get('label'),
    ...Object.fromEntries(row.get('props') as Map<string, unknown>),
  }))
)

describe('renaming one’s own Spots (US1)', () => {
  beforeEach(seedMine)

  it('renames a folder, keeping its edge & uuid (US1-1, FR-003)', async () => {
    const [before] = (await edgesOf(mine.get('image')!)).filter(({ path }) => path === 'hatz')
    expect(await rename(['image'], 'hatz', 'hats')).toEqual({ path: ['image', 'hats'] })
    const [after] = (await edgesOf(mine.get('image')!)).filter(({ path }) => path === 'hats')
    expect(after).toEqual({ ...before, path: 'hats' })
    expect(await names(b.root, ['image'])).toEqual(['hat', 'hats'])
    expect(await names(b.root, ['image', 'hats'])).toEqual(['bowler', 'top'])
    expect(await names(b.root, ['image', 'hatz'])).toEqual([])
  })

  it('renames a file’s Spot, keeping its Contents in order (US1-2)', async () => {
    await rename(['image'], 'hat', 'cap')
    const listing = await listed(b.root, ['image', 'cap'])
    expect(listing.contents.map(({ cid }) => cid)).toEqual(['bafyHat1', 'bafyHat2'])
    expect(await names(b.root, ['image'])).toEqual(['cap', 'hatz'])
  })

  it('writes nothing for the unchanged name (FR-008)', async () => {
    const before = await edgesOf(mine.get('image')!)
    expect(await rename(['image'], 'hat', 'hat')).toEqual({ path: ['image', 'hat'] })
    expect(await rename(['image'], 'hat', '  hat ')).toEqual({ path: ['image', 'hat'] })
    expect(await edgesOf(mine.get('image')!)).toEqual(before)
  })

  it('keeps the renamed Spot’s layer mounts (FR-003)', async () => {
    const other = await seedUser(source, { address: '0xo' })
    await mount(source, { from: mine.get('image/hatz')!, to: other.root })
    await rename(['image'], 'hatz', 'hats')
    expect(await edgesOf(mine.get('image/hatz')!)).toContainEqual(
      expect.objectContaining({ label: 'MOUNT', order: 0 })
    )
  })

  it('renames to Unicode names exactly as typed (edge case)', async () => {
    await rename(['image'], 'hatz', 'chapeaux 🎩')
    expect(await names(b.root, ['image'])).toEqual(['chapeaux 🎩', 'hat'])
    await rename(['image'], 'chapeaux 🎩', 'été')
    expect(await names(b.root, ['image'])).toEqual(['été', 'hat'])
    expect(await names(b.root, ['image', 'été'])).toEqual(['bowler', 'top'])
    await rename(['image'], 'été', '  hats  ')
    expect(await names(b.root, ['image'])).toEqual(['hat', 'hats'])
  })

  it('renames at the root', async () => {
    expect(await rename([], 'image', 'images')).toEqual({ path: ['images'] })
    expect(await names(b.root, [])).toEqual(['images'])
  })
})

describe('renaming another user’s Spots (US2)', () => {
  const S = '0xs'
  let s: Awaited<ReturnType<typeof seedUser>>
  let theirs: Map<string, Id>

  /** The link `MOUNT`s out of B's Spot at `path`, with their properties. */
  const mountsAt = async (path: Array<string>) => {
    let at = source.V(b.root)
    for(const name of path) at = at.outE('CONTAINS').has('path', name).inV()
    return (
      (await at.outE('MOUNT').has('path').project('to', 'props')
      .by(__.inV().id())
      .by(__.valueMap())
      .toList()) as Array<Map<string, unknown>>
    ).map((row): Record<string, unknown> => ({
      to: row.get('to'),
      ...Object.fromEntries(row.get('props') as Map<string, unknown>),
    }))
  }
  const uuidOf = async (from: Id, name: string) => (
    (await source.V(from).outE('CONTAINS').has('path', name).values('uuid').next()).value
  )

  beforeEach(async () => {
    s = await seedUser(source, { address: S })
    theirs = await seedTree(source, {
      root: s.root, tree: { image: { hatz: { top: {}, bowler: {} } } },
    })
    await mount(source, { from: b.root, to: s.root })
  })

  it('mounts their link in the user’s own Spot, with the new name (US2-1, US2-2)', async () => {
    const before = await snapshot({ source, root: s.root })
    expect(await rename(['image'], 'hatz', 'hats')).toEqual({ path: ['image', 'hats'] })
    expect(await mountsAt(['image'])).toEqual([{
      to: theirs.get('image/hatz'),
      uuid: await uuidOf(theirs.get('image')!, 'hatz'),
      path: 'hats',
      base: 'hatz',
      parent: (await source.V(theirs.get('image')!).values('uuid').next()).value,
      createdAt: now,
    }])
    expect(await names(b.root, ['image'])).toEqual(['hats'])
    expect(await names(b.root, ['image', 'hats'])).toEqual(['bowler', 'top'])
    expect(await names(s.root, ['image'])).toEqual(['hatz'])
    expect(await snapshot({ source, root: s.root })).toEqual(before)
    expect(await ownersOf({ source, spot: theirs.get('image/hatz')! })).toEqual([S])
  })

  it('shows their later changes through, but not their renames (US2-3 to US2-5)', async () => {
    await rename(['image'], 'hatz', 'hats')
    await link(source, { from: theirs.get('image/hatz')!, to: await addSpot(source), name: 'fedora' })
    expect(await names(b.root, ['image', 'hats'])).toEqual(['bowler', 'fedora', 'top'])
    await rename(['image'], 'hatz', 'caps', S)
    expect(await names(s.root, ['image'])).toEqual(['caps'])
    expect(await names(b.root, ['image'])).toEqual(['hats'])
    await unlinkSpot({
      source, from: theirs.get('image')!, what: theirs.get('image/hatz')!, name: 'caps', now,
    })
    expect(await names(b.root, ['image'])).toEqual(['hats'])
    expect(await names(b.root, ['image', 'hats'])).toEqual(['bowler', 'fedora', 'top'])
  })

  it('renames a name merged across layers in each (US2-6, FR-005)', async () => {
    const own = (await seedTree(source, { root: b.root, tree: { image: { hatz: {} } } }))
    await rename(['image'], 'hatz', 'cap')
    const edges = await edgesOf(own.get('image')!)
    expect(edges.filter(({ label }) => label === 'CONTAINS').map(({ path }) => path)).toEqual(['cap'])
    expect((await mountsAt(['image'])).map(({ path, to }) => [path, to]))
    .toEqual([['cap', theirs.get('image/hatz')]])
    const listing = await listed(b.root, ['image'])
    expect(listing.children.map(({ name, ids }) => [name, ids]))
    .toEqual([['cap', [own.get('image/hatz'), theirs.get('image/hatz')]]])
  })

  it('renames a mount again in place (US2-7)', async () => {
    await rename(['image'], 'hatz', 'hats')
    await rename(['image'], 'hats', 'caps')
    expect((await mountsAt(['image'])).map(({ path, base }) => [path, base])).toEqual([['caps', 'hatz']])
    expect(await names(b.root, ['image'])).toEqual(['caps'])
  })

  it('keeps a mount renamed back to the lower name (edge case)', async () => {
    await rename(['image'], 'hatz', 'hats')
    await rename(['image'], 'hats', 'hatz')
    expect((await mountsAt(['image'])).map(({ path }) => path)).toEqual(['hatz'])
    await rename(['image'], 'hatz', 'caps', S)
    expect(await names(b.root, ['image'])).toEqual(['hatz'])
  })

  it('mounts each of several layers’ links under one name (edge case)', async () => {
    const t = await seedUser(source, { address: '0xt' })
    const tTree = await seedTree(source, { root: t.root, tree: { image: { hatz: {} } } })
    await mount(source, { from: b.root, to: t.root, order: 1 })
    await rename(['image'], 'hatz', 'hats')
    expect((await mountsAt(['image'])).map(({ path, to }) => [path, to]).sort())
    .toEqual([['hats', theirs.get('image/hatz')], ['hats', tTree.get('image/hatz')]].sort())
    const [child] = (await listed(b.root, ['image'])).children
    expect(child.name).toBe('hats')
    expect([...child.ids].sort()).toEqual([theirs.get('image/hatz'), tTree.get('image/hatz')].sort())
  })

  it('mounts with a Unicode name (edge case)', async () => {
    await rename(['image'], 'hatz', '帽子')
    expect((await mountsAt(['image'])).map(({ path }) => path)).toEqual(['帽子'])
    expect(await names(b.root, ['image', '帽子'])).toEqual(['bowler', 'top'])
  })

  it('inherits the parent of a mount it mounts', async () => {
    const t = await seedUser(source, { address: '0xt' })
    const tImage = await addSpot(source)
    await link(source, { from: t.root, to: tImage, name: 'image' })
    await source.V(tImage).addE('MOUNT').to(__.V(theirs.get('image/hatz')!))
    .property('uuid', await uuidOf(theirs.get('image')!, 'hatz') as string)
    .property('path', 'caps').property('base', 'hatz')
    .property('parent', (await source.V(theirs.get('image')!).values('uuid').next()).value as string)
    .toList()
    const c = await seedUser(source, { address: '0xc' })
    await mount(source, { from: c.root, to: t.root })
    await rename(['image'], 'caps', 'lids', '0xc')
    const [mount_] = (await (
      source.V(c.root).out('CONTAINS').outE('MOUNT').has('path').valueMap().toList()
    )) as Array<Map<string, unknown>>
    expect(Object.fromEntries(mount_)).toMatchObject({
      path: 'lids',
      base: 'caps',
      parent: (await source.V(theirs.get('image')!).values('uuid').next()).value,
    })
  })
})

describe('refusals (US4)', () => {
  const S = '0xs'
  let s: Awaited<ReturnType<typeof seedUser>>

  beforeEach(async () => {
    await seedMine()
    await seedTree(source, { root: b.root, tree: { image: { cap: {} } } })
    s = await seedUser(source, { address: S })
    await seedTree(source, { root: s.root, tree: { image: { lid: {} } } })
    await mount(source, { from: b.root, to: s.root })
  })

  /** Expects `renaming` to be refused as `status` with `message`, changing neither tree. */
  const refused = async (
    renaming: () => Promise<unknown>, status: number, message: string,
  ) => {
    const before = await Promise.all([b.root, s.root].map((root) => snapshot({ source, root })))
    await expect(renaming()).rejects.toMatchObject({ status, body: { message } })
    expect(await Promise.all([b.root, s.root].map((root) => snapshot({ source, root }))))
    .toEqual(before)
  }

  it('refuses a name the user’s own folder already holds (US4-1, FR-006)', async () => {
    await refused(() => rename(['image'], 'hat', 'cap'), 409, '/image/ already contains “cap”')
    await refused(() => rename(['image'], 'lid', 'cap'), 409, '/image/ already contains “cap”')
  })

  it('allows a name only a mounted layer holds, merging the two', async () => {
    await rename(['image'], 'hat', 'lid')
    expect((await listed(b.root, ['image'])).children.find(({ name }) => name === 'lid')!.ids)
    .toHaveLength(2)
  })

  it('renames a case-only change, which isn’t a clash (edge case)', async () => {
    await rename(['image'], 'hat', 'Hat')
    await rename(['image'], 'Hat', 'hat')
    expect(await names(b.root, ['image'])).toEqual(['cap', 'hat', 'hatz', 'lid'])
  })

  it.each([
    ['', '“” isn’t a name: it’s empty.'],
    ['   ', '“   ” isn’t a name: it’s empty.'],
    ['.', '“.” isn’t a name: it’s reserved.'],
    ['..', '“..” isn’t a name: it’s reserved.'],
    ['a/b', '“a/b” isn’t a name: it contains “/”.'],
  ])('refuses %j (US4-2, FR-007)', async (to, message) => {
    await refused(() => rename(['image'], 'hat', to), 400, message)
  })

  it('refuses a name nothing is listed under (edge case)', async () => {
    await refused(() => rename(['image'], 'gone', 'here'), 404, 'No entry named “gone” at /image/')
    await refused(() => rename([], 'gone', 'here'), 404, 'No entry named “gone” at /')
  })
})

describe('moved links (US6)', () => {
  const S = '0xs'
  let s: Awaited<ReturnType<typeof seedUser>>
  let theirs: Map<string, Id>

  const spotUuid = async (id: Id) => (await source.V(id).values('uuid').next()).value as string
  const move = (to: string, from = 'image') => relinkSpot({
    source, what: theirs.get('image/hatz')!, from: theirs.get(from)!, to: theirs.get(to)!,
    now, uuid: uuidV7(),
  })
  const notices = () => noticesFor({ source, address: B })
  const ownMount = async () => edgeId((await (
    source.V(b.root).out('CONTAINS').outE('MOUNT').has('path').id().next()
  )).value)
  const resolveWith = async (resolve: typeof removeMount) => {
    const [notice] = await notices()
    return resolve({ source, address: B, mount: notice.mount, now })
  }

  beforeEach(async () => {
    s = await seedUser(source, { address: S })
    theirs = await seedTree(source, {
      root: s.root,
      tree: { image: { hatz: { top: {}, bowler: {} } }, old: {}, attic: {} },
    })
    await mount(source, { from: b.root, to: s.root })
    await rename(['image'], 'hatz', 'hats')
  })

  it('notices a move of a mounted link, & marks its tile (US6-1, US6-2)', async () => {
    expect(await notices()).toEqual([])
    await move('old')
    const [notice] = await notices()
    expect(await notices()).toEqual([{
      mount: expect.any(String),
      uuid: (await source.V(theirs.get('old')!).outE('CONTAINS').values('uuid').next()).value,
      name: 'hats',
      from: ['image'],
      to: ['old'],
      ownerPath: ['old'],
      owner: S,
    }])
    const [tile] = (await listed(b.root, ['image'])).children
    expect(tile).toMatchObject({ name: 'hats', moved: notice.mount })
    expect(await names(b.root, ['old'])).toEqual(['hatz'])
  })

  it('names the latest place, & withdraws once moved back (US6-7, FR-022)', async () => {
    await move('old')
    await move('attic', 'old')
    expect((await notices()).map(({ to }) => to)).toEqual([['attic']])
    await move('image', 'attic')
    expect(await notices()).toEqual([])
    expect((await listed(b.root, ['image'])).children[0].moved).toBeUndefined()
  })

  it('finds the shortest view path through a cycle', async () => {
    await mount(source, { from: theirs.get('old')!, to: b.root })
    await move('old')
    const [notice] = await notices()
    expect(notice.to).toEqual(['old'])
    expect(await viewPathOf({ source, address: B, spot: theirs.get('old')! })).toEqual(['old'])
  })

  it('notices nothing once the layer is unmounted (FR-014)', async () => {
    await source.V(b.root).outE('MOUNT').drop().toList()
    expect(await notices()).toEqual([])
    await move('old')
    expect((await notices()).map(({ to }) => to)).toEqual([null])
  })

  it('notices no rename or removal by the owner', async () => {
    await rename(['image'], 'hatz', 'caps', S)
    await unlinkSpot({
      source, from: theirs.get('image')!, what: theirs.get('image/hatz')!, name: 'caps', now,
    })
    expect(await notices()).toEqual([])
  })

  it('removes the mount, so their link shows at its new place (US6-3)', async () => {
    await move('old')
    expect(await resolveWith(removeMount)).toEqual({ from: ['image', 'hats'], to: ['old', 'hatz'] })
    expect(await names(b.root, ['image'])).toEqual([])
    expect(await names(b.root, ['old'])).toEqual(['hatz'])
    expect(await notices()).toEqual([])
  })

  it('follows the move, keeping the mount’s uuid & name (US6-4)', async () => {
    await move('old')
    const [before] = await notices()
    expect(await resolveWith(followMount)).toEqual({ from: ['image', 'hats'], to: ['old', 'hats'] })
    const [followed] = (await (
      source.V(b.root).outE('CONTAINS').has('path', 'old').inV().outE('MOUNT').valueMap().toList()
    )) as Array<Map<string, unknown>>
    expect(Object.fromEntries(followed)).toMatchObject({
      uuid: before.uuid, path: 'hats', base: 'hatz', parent: await spotUuid(theirs.get('old')!),
    })
    expect(await names(b.root, ['image'])).toEqual([])
    expect(await names(b.root, ['old'])).toEqual(['hats'])
    expect(await names(b.root, ['old', 'hats'])).toEqual(['bowler', 'top'])
    expect(await notices()).toEqual([])
  })

  it('keeps the name as the user’s own, through a Spot of theirs (US6-5, R9)', async () => {
    await move('old')
    const [before] = await notices()
    expect(await resolveWith(keepMount)).toEqual({ from: ['image', 'hats'], to: ['image', 'hats'] })
    const image = (await source.V(b.root).outE('CONTAINS').has('path', 'image').inV().id().next()).value as Id
    const [kept] = (await edgesOf(image)).filter(({ label }) => label === 'CONTAINS')
    expect(kept).toMatchObject({ path: 'hats' })
    expect(kept.uuid).not.toBe(before.uuid)
    const own = (await source.V(image).outE('CONTAINS').has('path', 'hats').inV().id().next()).value as Id
    expect(await edgesOf(own)).toEqual([expect.objectContaining({ label: 'MOUNT', order: 0 })])
    expect(await names(b.root, ['image', 'hats'])).toEqual(['bowler', 'top'])
    expect(await names(b.root, ['old'])).toEqual(['hatz'])
    expect(await ownersOf({ source, spot: theirs.get('image/hatz')! })).toEqual([S])
    expect(await notices()).toEqual([])
  })

  it('can’t follow where the user can’t see (scenario 9)', async () => {
    await source.V(b.root).outE('MOUNT').drop().toList()
    const image = (await source.V(b.root).outE('CONTAINS').has('path', 'image').inV().id().next()).value as Id
    await mount(source, { from: image, to: theirs.get('image')! })
    await move('old')
    const [notice] = await notices()
    expect(notice).toMatchObject({ to: null, ownerPath: ['old'] })
    await expect(followMount({ source, address: B, mount: notice.mount, now })).rejects.toMatchObject({
      status: 400, body: { message: '0xs moved “hatz” where you can’t follow it, to /old/ in their tree.' },
    })
    expect(await removeMount({ source, address: B, mount: notice.mount, now }))
    .toEqual({ from: ['image', 'hats'], to: null })
  })

  it('refuses to follow onto a name the user’s own folder holds (scenario 10)', async () => {
    await seedTree(source, { root: b.root, tree: { old: { hats: {} } } })
    await move('old')
    await expect(resolveWith(followMount)).rejects.toMatchObject({
      status: 409, body: { message: '/old/ already contains “hats”' },
    })
    expect(await notices()).toHaveLength(1)
  })

  it.each([
    ['removeMount', removeMount],
    ['followMount', followMount],
    ['keepMount', keepMount],
  ] as const)('%s refuses an unknown mount, & another’s', async (_, resolve) => {
    await expect(resolve({ source, address: B, mount: 'nope', now })).rejects.toMatchObject({
      status: 404, body: { message: 'There’s no mounted link nope.' },
    })
    await expect(resolve({ source, address: S, mount: await ownMount(), now }))
    .rejects.toMatchObject({ status: 403 })
  })

  it('won’t follow a mount that hasn’t moved', async () => {
    await expect(followMount({ source, address: B, mount: await ownMount(), now })).rejects.toMatchObject({
      status: 409, body: { message: 'That link hasn’t moved.' },
    })
  })
})
