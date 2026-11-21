import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  deleteEntry, findRep, listEntries, statEntry,
} from '#lib/server/fsEntries.js'
import {
  addSpot, attach, link, mount, seedUser, testAccount, transaction,
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
