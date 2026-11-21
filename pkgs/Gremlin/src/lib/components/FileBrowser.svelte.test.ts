import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import FileBrowser from './FileBrowser.svelte'

const { listing, refresh, searchSpots, deleteSpot } = vi.hoisted(() => {
  const refresh = vi.fn()
  return {
    refresh,
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
      { refresh },
    )),
    searchSpots: vi.fn(() => new Promise(() => {})),
    deleteSpot: vi.fn(async () => true),
  }
})

vi.mock('#lib/remotes/listing.remote.js', () => ({ listing }))
vi.mock('#lib/remotes/searchSpots.remote.js', () => ({ searchSpots }))
vi.mock('#lib/remotes/deleteSpot.remote.js', () => ({ deleteSpot }))

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  refresh.mockClear()
  deleteSpot.mockClear()
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

describe('the context menu', () => {
  const onerror = vi.fn()

  const menuOn = async (selector: string) => {
    onerror.mockClear()
    await render(FileBrowser, { props: { path: ['a'], onerror } })
    const target = await vi.waitFor(() => {
      const found = document.querySelector(selector)
      expect(found).not.toBeNull()
      return found!
    })
    target.dispatchEvent(new MouseEvent('contextmenu', {
      ctrlKey: true, bubbles: true, cancelable: true, clientX: 5, clientY: 5,
    }))
    const menu = document.querySelector<HTMLElement>('menu.context')!
    await vi.waitFor(() => expect(menu.matches(':popover-open')).toBe(true))
    return {
      menu,
      items: () => [...menu.querySelectorAll('button')].map((button) => (
        button.textContent?.trim()
      )),
      button: (text: string) => (
        [...menu.querySelectorAll('button')]
        .find((button) => button.textContent?.includes(text))!
      ),
    }
  }

  it('offers to delete a tile', async () => {
    const { items } = await menuOn('nav.details li')
    await vi.waitFor(() => (
      expect(items()).toEqual(['Edit /a/listed in VS Code', 'Delete “listed”'])
    ))
  })

  it('offers no delete on the folder’s background', async () => {
    const { items } = await menuOn('nav.details')
    expect(items()).toEqual(['Edit /a in VS Code'])
  })

  it('deletes the tile’s link once confirmed, & refreshes the listing', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { menu, button } = await menuOn('nav.details li')
    await vi.waitFor(() => expect(button('Delete')).toBeDefined())
    button('Delete').click()
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(confirm).toHaveBeenCalledWith('Delete “listed” from /a?')
    expect(deleteSpot).toHaveBeenCalledWith({ what: 2, from: 1, name: 'listed' })
    expect(menu.matches(':popover-open')).toBe(false)
    expect(onerror).not.toHaveBeenCalled()
  })

  it('deletes nothing when the confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { button } = await menuOn('nav.details li')
    await vi.waitFor(() => expect(button('Delete')).toBeDefined())
    button('Delete').click()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(deleteSpot).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('reports a failed delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    deleteSpot.mockRejectedValueOnce(new Error('Nope.'))
    const { button } = await menuOn('nav.details li')
    await vi.waitFor(() => expect(button('Delete')).toBeDefined())
    button('Delete').click()
    await vi.waitFor(() => expect(onerror).toHaveBeenCalledWith('Nope.'))
    expect(refresh).not.toHaveBeenCalled()
  })
})
