import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import FileView from './FileView.svelte'
import { relocate } from '#lib/relocations.svelte.js'

const { listing, searchSpots, renameSpot } = vi.hoisted(() => ({
  listing: vi.fn(() => Object.assign(
    Promise.resolve({ layers: [1], contents: [], children: [] }),
    { refresh: vi.fn() },
  )),
  searchSpots: vi.fn(() => new Promise(() => {})),
  renameSpot: vi.fn(async ({ path, to }: { path: Array<string>, to: string }) => (
    { path: [...path, to] }
  )),
}))

vi.mock('#lib/remotes/listing.remote.js', () => ({ listing }))
vi.mock('#lib/remotes/searchSpots.remote.js', () => ({ searchSpots }))
vi.mock('#lib/remotes/renameSpot.remote.js', () => ({ renameSpot }))

afterEach(() => {
  document.body.innerHTML = ''
})

const browse = () => document.querySelector<HTMLElement>('section#browse')!

describe('FileView', () => {
  it('hides itself, despite its flex layout', async () => {
    await render(FileView, { props: { path: [], me: null, hidden: true } })
    await vi.waitFor(() => expect(browse()).not.toBeNull())
    expect(browse().hidden).toBe(true)
    expect(getComputedStyle(browse()).display).toBe('none')
  })

  it('shows itself by default', async () => {
    await render(FileView, { props: { path: [], me: null } })
    await vi.waitFor(() => expect(browse()).not.toBeNull())
    expect(browse().hidden).toBe(false)
    expect(getComputedStyle(browse()).display).toBe('flex')
  })

  it('passes the query on to its file browser', async () => {
    await render(FileView, { props: { path: [], me: null, query: 'emm' } })
    await vi.waitFor(() => (
      expect(document.querySelector('#search-results')).not.toBeNull()
    ))
  })
})

describe('renaming from the breadcrumbs (US3)', () => {
  const crumbs = () => [...document.querySelectorAll('#crumbs li')]
  const pencil = (crumb: Element) => crumb.querySelector<HTMLButtonElement>('button.rename')

  it('offers a rename on every crumb but the root, when signed in (FR-002)', async () => {
    await render(FileView, { props: { path: ['media', 'book', 'by'], me: '0xme' } })
    await vi.waitFor(() => expect(crumbs()).toHaveLength(4))
    expect(crumbs().map((crumb) => pencil(crumb) != null)).toEqual([false, true, true, true])
  })

  it('offers no rename when signed out (FR-009)', async () => {
    await render(FileView, { props: { path: ['media'], me: null } })
    await vi.waitFor(() => expect(crumbs()).toHaveLength(2))
    expect(crumbs().some((crumb) => pencil(crumb) != null)).toBe(false)
  })

  it('renames a crumb, & the view follows to the same Spot (US3-1)', async () => {
    await render(FileView, {
      props: { path: ['media', 'book', 'by', 'Austen'], me: '0xme' },
    })
    await vi.waitFor(() => expect(crumbs()).toHaveLength(5))
    pencil(crumbs()[3])!.click()
    const dialog = await vi.waitFor(() => {
      const found = document.querySelector<HTMLDialogElement>('dialog')
      expect(found?.open).toBe(true)
      return found!
    })
    const input = dialog.querySelector('input')!
    expect(input.value).toBe('by')
    input.value = 'author'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    ;[...dialog.querySelectorAll('button')].find(({ textContent }) => textContent === 'Rename')!.click()
    await vi.waitFor(() => expect(renameSpot).toHaveBeenCalledWith({
      path: ['media', 'book'], from: 'by', to: 'author',
    }))
    await vi.waitFor(() => expect(crumbs().map((crumb) => crumb.textContent))
    .toEqual(expect.arrayContaining([expect.stringContaining('author/')])))
  })

  it('follows a relocation that covers its path, & ignores one that doesn’t (FR-016)', async () => {
    await render(FileView, { props: { path: ['a', 'b', 'x'], me: null } })
    await render(FileView, { props: { path: ['a'], me: null } })
    await vi.waitFor(() => expect(crumbs()).toHaveLength(6))
    relocate({ from: ['a', 'b'], to: ['a', 'c'] })
    await vi.waitFor(() => expect(crumbs().map((crumb) => crumb.textContent?.replace('⇨', '').trim()))
    .toEqual(['', 'a/', 'c/', 'x/', '', 'a/']))
  })
})
