import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import FileBrowser from './FileBrowser.svelte'

const { listing, searchSpots } = vi.hoisted(() => ({
  listing: vi.fn(() => Object.assign(
    Promise.resolve({
      layers: [1],
      contents: [],
      children: [{
        name: 'listed',
        ids: [2],
        parents: [1],
        contents: [],
        container: true,
      }],
    }),
    { refresh: vi.fn() },
  )),
  searchSpots: vi.fn(() => new Promise(() => {})),
}))

vi.mock('#lib/remotes/listing.remote.js', () => ({ listing }))
vi.mock('#lib/remotes/searchSpots.remote.js', () => ({ searchSpots }))

afterEach(() => {
  document.body.innerHTML = ''
})

const showing = async (query: string) => {
  await render(FileBrowser, { props: { path: ['a'], query } })
  await vi.waitFor(() => (
    expect(
      document.querySelector('#search-results')
      ?? document.querySelector('nav.details li')
    ).not.toBeNull()
  ))
  return {
    results: document.querySelector('#search-results') != null,
    listing: document.body.textContent?.includes('listed') ?? false,
  }
}

describe('FileBrowser', () => {
  it.each(['', '   ', '//'])(
    'shows the normal listing for the query %j',
    async (query) => {
      expect(await showing(query)).toEqual({ results: false, listing: true })
    },
  )

  it('shows search results in place of the listing', async () => {
    expect(await showing('emm')).toEqual({ results: true, listing: false })
  })
})
