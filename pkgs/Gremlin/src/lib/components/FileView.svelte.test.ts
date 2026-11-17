import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import FileView from './FileView.svelte'

const { listing, searchSpots } = vi.hoisted(() => ({
  listing: vi.fn(() => Object.assign(
    Promise.resolve({ layers: [1], contents: [], children: [] }),
    { refresh: vi.fn() },
  )),
  searchSpots: vi.fn(() => new Promise(() => {})),
}))

vi.mock('#lib/remotes/listing.remote.js', () => ({ listing }))
vi.mock('#lib/remotes/searchSpots.remote.js', () => ({ searchSpots }))

afterEach(() => {
  document.body.innerHTML = ''
})

const browse = () => document.querySelector<HTMLElement>('section#browse')!

describe('FileView', () => {
  it('hides itself, despite its flex layout', async () => {
    await render(FileView, { props: { path: [], me: null, hidden: true } })
    expect(browse().hidden).toBe(true)
    expect(getComputedStyle(browse()).display).toBe('none')
  })

  it('shows itself by default', async () => {
    await render(FileView, { props: { path: [], me: null } })
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
