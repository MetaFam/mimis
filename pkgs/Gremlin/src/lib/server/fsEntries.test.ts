import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  deleteEntry, findRep, listEntries, renameEntry, statEntry,
} from '#lib/server/fsEntries.js'
import {
  addSpot, attach, link, mount, mountLink, seedUser, testAccount, transaction,
  type Id,
} from '#lib/server/testing.js'

type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>
let address: string
let root: Id
let docs: Id
let notes: Id
let photo: Id
const now = '2026-11-21T00:00:00.000Z'

// root ─ docs ─┬─ notes   (text/markdown)        → docs/notes.md
//      │       ├─ photo   (image/jpeg, image/png) → docs/photo.jpg, .png
//      │       └ (text/markdown on docs itself)   → docs/md.md, docs.md
//      └ empty
beforeEach(async () => {
  ;({ source, rollback } = transaction())
  address = testAccount().address.toLowerCase()
  ;({ root } = await seedUser(source, { address }))
  ;[docs, notes, photo] = [await addSpot(source), await addSpot(source), await addSpot(source)]
  await link(source, { from: root, to: docs, name: 'docs' })
  await link(source, { from: root, to: await addSpot(source), name: 'empty' })
  await link(source, { from: docs, to: notes, name: 'notes' })
  await link(source, { from: docs, to: photo, name: 'photo' })
  await attach(source, { to: notes, type: 'text/markdown', cid: 'bafyNotes', size: 5 })
  await attach(source, { to: photo, type: 'image/jpeg', cid: 'bafyJPG' })
  await attach(source, { to: photo, type: 'image/png', cid: 'bafyPNG' })
  await attach(source, { to: docs, type: 'text/markdown', cid: 'bafyReadme' })
})

afterEach(async () => {
  await rollback()
})

const listed = async (path: Array<string>) => (
  (await listEntries({ source, address, path }))
  .map(({ name, kind }) => `${name}${kind === 'directory' ? '/' : ''}`)
  .sort()
)

describe('reading', () => {
  it('lists Spots as directories & their Contents as files', async () => {
    expect(await listed([])).toEqual(['docs.md', 'docs/', 'empty/'])
    expect(await listed(['docs'])).toEqual(['md.md', 'notes.md', 'photo.jpg', 'photo.png'])
  })

  it('describes a file by its Content’s Blob', async () => {
    expect(await statEntry({ source, address, path: ['docs', 'notes.md'] }))
    .toMatchObject({ name: 'notes.md', kind: 'file', type: 'text/markdown', cid: 'bafyNotes', size: 5 })
    expect(await findRep({ source, address, path: ['docs', 'photo.png'] }))
    .toMatchObject({ type: 'image/png', cid: 'bafyPNG' })
  })

  it('lists what a mounted layer holds', async () => {
    const { root: theirs } = await seedUser(source, { address: testAccount().address.toLowerCase() })
    await link(source, { from: theirs, to: await addSpot(source), name: 'shared' })
    await mount(source, { from: root, to: theirs })
    expect(await listed([])).toEqual(['docs.md', 'docs/', 'empty/', 'shared/'])
  })
})

describe('several Contents of a type (FR-019)', () => {
  beforeEach(async () => {
    await attach(source, { to: photo, type: 'image/png', cid: 'bafyPNG2' })
  })

  it('names one file per type, the best Content of it', async () => {
    expect(await listed(['docs'])).toEqual(['md.md', 'notes.md', 'photo.jpg', 'photo.png'])
    expect(await statEntry({ source, address, path: ['docs', 'photo.png'] }))
    .toMatchObject({ cid: 'bafyPNG' })
  })

  it('skips a proxy for the best of its type', async () => {
    const other = await addSpot(source)
    const { content: target } = await attach(source, { to: other, type: 'image/jpeg', cid: 'bafyTheirs' })
    const shot = await addSpot(source)
    await link(source, { from: docs, to: shot, name: 'shot' })
    await attach(source, { to: shot, type: 'image/jpeg', mounts: target })
    await attach(source, { to: shot, type: 'image/jpeg', cid: 'bafyMine' })
    expect(await findRep({ source, address, path: ['docs', 'shot.jpg'] }))
    .toMatchObject({ cid: 'bafyMine' })
  })

  it('deletes the best of a type & lists the next one, relinking it', async () => {
    await deleteEntry({ source, address, path: ['docs', 'photo.png'], now })
    expect(await statEntry({ source, address, path: ['docs', 'photo.png'] }))
    .toMatchObject({ cid: 'bafyPNG2' })
    expect(await listed(['docs'])).toEqual(['md.md', 'notes.md', 'photo.jpg', 'photo.png'])
  })
})

describe('deleteEntry', () => {
  const remove = (path: Array<string>, { recursive = false } = {}) => (
    deleteEntry({ source, address, path, recursive, now })
  )

  it('takes a directory, & what’s in it, out of its parent', async () => {
    await remove(['docs'], { recursive: true })
    expect(await listed([])).toEqual(['empty/'])
    expect(await source.V(docs).out('CONTAINS').count().next()).toMatchObject({ value: 2 })
  })

  it('refuses a directory that isn’t empty unless recursive', async () => {
    await expect(remove(['docs'])).rejects.toMatchObject({
      status: 400, body: { message: '“docs” isn’t empty.' },
    })
    expect(await listed([])).toEqual(['docs.md', 'docs/', 'empty/'])
  })

  it('deletes an empty directory without recursive', async () => {
    await remove(['empty'])
    expect(await listed([])).toEqual(['docs.md', 'docs/'])
  })

  it('deletes a file & the Spot it leaves empty', async () => {
    await remove(['docs', 'notes.md'])
    expect(await listed(['docs'])).toEqual(['md.md', 'photo.jpg', 'photo.png'])
    expect(await source.V(docs).out('CONTAINS').id().toList()).toEqual([photo])
  })

  it('deletes one of a Spot’s files & keeps the others', async () => {
    await remove(['docs', 'photo.jpg'])
    expect(await listed(['docs'])).toEqual(['md.md', 'notes.md', 'photo.png'])
  })

  it('deletes a file of the directory itself & keeps the directory', async () => {
    await remove(['docs', 'md.md'])
    expect(await listed(['docs'])).toEqual(['notes.md', 'photo.jpg', 'photo.png'])
    expect(await listed([])).toEqual(['docs/', 'empty/'])
  })

  it('gives a 404 for nothing there', async () => {
    await expect(remove(['docs', 'nothing.txt'])).rejects.toMatchObject({
      status: 404, body: { message: 'Nothing at “/docs/nothing.txt”.' },
    })
  })

  it('refuses the root', async () => {
    await expect(remove([], { recursive: true })).rejects.toMatchObject({
      status: 400, body: { message: 'The root can’t be deleted.' },
    })
  })

  it('refuses what’s in someone else’s mounted tree', async () => {
    const other = testAccount().address.toLowerCase()
    const { root: theirs } = await seedUser(source, { address: other })
    const shared = await addSpot(source)
    await link(source, { from: theirs, to: shared, name: 'shared' })
    await attach(source, { to: shared, type: 'text/plain', cid: 'bafyTheirs' })
    await mount(source, { from: root, to: theirs })
    await expect(remove(['shared'], { recursive: true })).rejects.toMatchObject({
      status: 403,
      body: { message: `The directory, Spot #${theirs}, doesn’t belong to the user ${address}.` },
    })
    await expect(remove(['shared.txt'])).rejects.toMatchObject({ status: 403 })
    expect(await listed([])).toEqual(['docs.md', 'docs/', 'empty/', 'shared.txt'])
  })
})

describe('mounted links (FR-013)', () => {
  beforeEach(async () => {
    const { root: theirs } = await seedUser(source, { address: testAccount().address.toLowerCase() })
    const image = await addSpot(source)
    const hatz = await addSpot(source)
    await link(source, { from: theirs, to: image, name: 'image' })
    await link(source, { from: image, to: hatz, name: 'hatz' })
    await link(source, { from: hatz, to: await addSpot(source), name: 'top' })
    await mount(source, { from: root, to: theirs })
    const mine = await addSpot(source)
    await link(source, { from: root, to: mine, name: 'image' })
    const { value: uuid } = await source.V(image).outE('CONTAINS').values('uuid').next()
    const { value: parent } = await source.V(image).values('uuid').next()
    await mountLink(source, {
      from: mine, to: hatz, uuid: uuid as string, path: 'hats', parent: parent as string,
    })
  })

  it('lists a mounted link by its mount’s name, & not the link it shadows', async () => {
    expect(await listed(['image'])).toEqual(['hats/'])
    expect(await listed(['image', 'hats'])).toEqual(['top/'])
  })

  it('describes a mounted link as a directory', async () => {
    expect(await statEntry({ source, address, path: ['image', 'hats'] }))
    .toMatchObject({ name: 'hats', kind: 'directory' })
    expect(await statEntry({ source, address, path: ['image', 'hatz'] })).toBeNull()
  })
})

describe('renameEntry (FR-017)', () => {
  const rename = (from: Array<string>, to: Array<string>) => (
    renameEntry({ source, address, from, to, now })
  )
  const uuidOf = async (from: Id, name: string) => (
    (await source.V(from).outE('CONTAINS').has('path', name).values('uuid').next()).value
  )

  it('renames a directory in place, keeping its link’s uuid', async () => {
    const uuid = await uuidOf(root, 'docs')
    await rename(['docs'], ['papers'])
    expect(await listed([])).toEqual(['empty/', 'papers.md', 'papers/'])
    expect(await uuidOf(root, 'papers')).toBe(uuid)
  })

  it('renames a file by its Spot, keeping its extension', async () => {
    await rename(['docs', 'notes.md'], ['docs', 'memo.md'])
    expect(await listed(['docs'])).toEqual(['md.md', 'memo.md', 'photo.jpg', 'photo.png'])
  })

  it('mounts someone else’s link under the new name, as the app does', async () => {
    const { root: theirs } = await seedUser(source, { address: testAccount().address.toLowerCase() })
    await link(source, { from: theirs, to: await addSpot(source), name: 'shared' })
    await mount(source, { from: root, to: theirs })
    await rename(['shared'], ['common'])
    expect(await listed([])).toEqual(['common/', 'docs.md', 'docs/', 'empty/'])
    expect(await source.V(root).outE('MOUNT').has('path', 'common').count().next())
    .toMatchObject({ value: 1 })
    expect(await source.V(theirs).outE('CONTAINS').values('path').toList()).toEqual(['shared'])
  })

  it('refuses a name the directory already holds', async () => {
    await expect(rename(['docs', 'notes.md'], ['docs', 'photo.md'])).rejects.toMatchObject({
      status: 409, body: { message: '/docs/ already contains “photo”' },
    })
  })

  it('refuses a name that isn’t one', async () => {
    await expect(rename(['docs', 'notes'], ['docs', '..'])).rejects.toMatchObject({
      status: 400, body: { message: '“..” isn’t a name: it’s reserved.' },
    })
  })

  it('refuses a name nothing is listed under', async () => {
    await expect(rename(['docs', 'gone'], ['docs', 'here'])).rejects.toMatchObject({
      status: 404, body: { message: 'No entry named “gone” at /docs/' },
    })
  })

  it.each([
    { what: 'another directory', from: ['docs', 'notes.md'], to: ['empty', 'notes.md'], message: 'Moving between directories isn’t supported here — drag & drop in the Mïmis app instead.' },
    { what: 'another extension', from: ['docs', 'notes.md'], to: ['docs', 'notes.txt'], message: 'Changing a file’s extension would change its representation type — unsupported.' },
    { what: 'a context-free name', from: ['docs', 'md.md'], to: ['docs', 'x.md'], message: 'Context-free names (like `md.md`) label their parent Spot & can’t be renamed.' },
  ])('still refuses $what', async ({ from, to, message }) => {
    await expect(rename(from, to)).rejects.toMatchObject({ status: 400, body: { message } })
  })
})
