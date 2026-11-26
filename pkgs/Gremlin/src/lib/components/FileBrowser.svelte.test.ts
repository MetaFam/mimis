import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import FileBrowser from './FileBrowser.svelte'
import type { Listing } from '#lib/remotes/listing.remote.js'
import settings from '#lib/settings.svelte.js'

const {
  listing, refresh, searchSpots, deleteSpot, renameSpot, drops,
} = vi.hoisted(() => {
  const refresh = vi.fn()
  return {
    refresh,
    drops: [] as Array<{ path: () => Array<string>, placement?: () => unknown }>,
    listing: vi.fn(() => Object.assign(
      Promise.resolve<Listing>({
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
    renameSpot: vi.fn(async ({ path, to }: { path: Array<string>, to: string }) => (
      { path: [...path, to] }
    )),
  }
})

vi.mock('#lib/remotes/listing.remote.js', () => ({ listing }))
vi.mock('#lib/remotes/searchSpots.remote.js', () => ({ searchSpots }))
vi.mock('#lib/remotes/deleteSpot.remote.js', () => ({ deleteSpot }))
vi.mock('#lib/remotes/renameSpot.remote.js', () => ({ renameSpot }))
vi.mock('#lib/remotes/notices.remote.js', () => ({
  notices: vi.fn(() => Object.assign(Promise.resolve([{
    mount: 'm1', uuid: 'u1', name: 'listed', from: ['a'], to: ['old'], ownerPath: ['old'], owner: '0xs',
  }]), { refresh: vi.fn() })),
}))
vi.mock('#lib/remotes/resolveMount.remote.js', () => ({
  removeMount: vi.fn(), followMount: vi.fn(), keepMount: vi.fn(),
}))
vi.mock('#lib/remotes/ranking.remote.js', () => ({
  ranking: vi.fn(() => Object.assign(Promise.resolve([]), { refresh: vi.fn() })),
  place: vi.fn(),
}))
vi.mock('#lib/ipfs.js', () => ({ addFiles: vi.fn() }))
// Records each drop target’s options, so their placements can be asked.
vi.mock('#lib', async (original) => {
  const lib = await original<typeof import('#lib')>()
  return {
    ...lib,
    dropGenerator: (options: Parameters<typeof lib.dropGenerator>[0]) => {
      drops.push(options)
      return lib.dropGenerator(options)
    },
  }
})

afterEach(() => {
  document.body.innerHTML = ''
  drops.length = 0
  settings.detailsView = 'icons'
  localStorage.removeItem('mimis-setting-details-view')
  vi.restoreAllMocks()
  refresh.mockClear()
  deleteSpot.mockClear()
  renameSpot.mockClear()
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

describe('tiles (FR-015)', () => {
  const content = (cid: string, type: string) => (
    { id: cid, uuid: cid, cid, type, size: 1, spot: 2 }
  )
  const tileWith = async (contents: Array<ReturnType<typeof content>>) => {
    listing.mockImplementationOnce(() => Object.assign(
      Promise.resolve({
        layers: [1],
        contents: [],
        children: [{ name: 'hat', ids: [2], parents: [1], contents, container: false }],
      }),
      { refresh },
    ))
    await render(FileBrowser, { props: { path: ['a'] } })
    return vi.waitFor(() => {
      const tile = document.querySelector('nav.details li')
      expect(tile).not.toBeNull()
      return tile!
    })
  }

  it('shows the best Content & how many there are', async () => {
    const tile = await tileWith([content('bafyBest', 'image/png'), content('bafyNext', 'image/png')])
    expect(tile.querySelector('img')!.getAttribute('src')).toContain('bafyBest')
    expect(tile.querySelector('.choices')!.textContent).toBe('2')
  })

  it('shows no count for a single Content', async () => {
    const tile = await tileWith([content('bafyOnly', 'image/png')])
    expect(tile.querySelector('.choices')).toBeNull()
  })

  it('displays a Spot’s best Content only (FR-015)', async () => {
    listing.mockImplementationOnce(() => Object.assign(
      Promise.resolve({
        layers: [1],
        contents: [content('bafyFirst', 'image/png'), content('bafySecond', 'image/png')],
        children: [],
      }),
      { refresh },
    ))
    await render(FileBrowser, { props: { path: ['a'] } })
    const shown = await vi.waitFor(() => {
      const found = [...document.querySelectorAll('#media img')]
      expect(found).toHaveLength(1)
      return found
    })
    expect(shown[0].getAttribute('src')).toContain('bafyFirst')
    expect(document.querySelector('.alternatives')).toBeNull()
  })

  it('names the best Content’s type when it can’t be shown, & ignores the rest', async () => {
    const tile = await tileWith([content('bafyText', 'text/plain'), content('bafyPic', 'image/png')])
    expect(tile.querySelector('aside')!.textContent).toBe('text/plain')
    expect(tile.querySelector('img')).toBeNull()
  })
})

describe('the context menu', () => {
  const onerror = vi.fn()

  const menuOn = async (selector: string, { me = '0xme' as string | null } = {}) => {
    onerror.mockClear()
    await render(FileBrowser, { props: { path: ['a'], onerror, me } })
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
      expect(items()).toEqual([
        'Edit /a/listed in VS Code', 'Rename “listed”…', 'Delete “listed”',
      ])
    ))
  })

  it('renames a tile through the dialog, & refreshes the listing (FR-001)', async () => {
    const { button } = await menuOn('nav.details li')
    button('Rename').click()
    const dialog = await vi.waitFor(() => {
      const found = document.querySelector<HTMLDialogElement>('dialog')
      expect(found?.open).toBe(true)
      return found!
    })
    const input = dialog.querySelector('input')!
    expect(input.value).toBe('listed')
    input.value = 'renamed'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    ;[...dialog.querySelectorAll('button')].find(({ textContent }) => textContent === 'Rename')!.click()
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(renameSpot).toHaveBeenCalledWith({ path: ['a'], from: 'listed', to: 'renamed' })
    await vi.waitFor(() => expect(document.querySelector('dialog')).toBeNull())
  })

  it('marks a moved tile, & offers to resolve its move (FR-022)', async () => {
    listing.mockImplementationOnce(() => Object.assign(
      Promise.resolve<Listing>({
        layers: [1],
        contents: [],
        children: [{
          name: 'listed', ids: [2], parents: [1], contents: [], container: true, moved: 'm1',
        }],
      }),
      { refresh },
    ))
    const { items, button } = await menuOn('nav.details li')
    const tile = document.querySelector('nav.details li')!
    expect(tile.classList.contains('moved')).toBe(true)
    expect(tile.querySelector<HTMLElement>('.moved-badge')!.title).toBe('Moved by its owner')
    await vi.waitFor(() => expect(items()).toContain('Resolve move…'))
    button('Resolve move').click()
    const dialog = await vi.waitFor(() => {
      const found = document.querySelector<HTMLDialogElement>('dialog')
      expect(found?.open).toBe(true)
      expect(found!.textContent).toContain('0xs moved “listed”')
      return found!
    })
    expect(dialog.querySelectorAll('li.notice')).toHaveLength(1)
  })

  it('offers no move to resolve on a tile that hasn’t moved', async () => {
    const { items } = await menuOn('nav.details li')
    await vi.waitFor(() => expect(items()).toContain('Delete “listed”'))
    expect(items()).not.toContain('Resolve move…')
    expect(document.querySelector('nav.details li.moved')).toBeNull()
  })

  it('offers no rename when signed out (FR-009)', async () => {
    const { items } = await menuOn('nav.details li', { me: null })
    await vi.waitFor(() => expect(items()).toContain('Delete “listed”'))
    expect(items().some((item) => item?.startsWith('Rename'))).toBe(false)
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

describe('the table view (FR-016)', () => {
  const content = (cid: string, type: string, size = 1) => (
    { id: cid, uuid: cid, cid, type, size, spot: 2 }
  )
  const listed = (listed: Listing) => listing.mockImplementation(() => (
    Object.assign(Promise.resolve(listed), { refresh })
  ))
  const toTable = async () => {
    await vi.waitFor(() => expect(document.querySelector('.views')).not.toBeNull())
    document.querySelector<HTMLButtonElement>('.views button[title="Table"]')!.click()
    return vi.waitFor(() => {
      const table = document.querySelector('nav.details > .table')
      expect(table).not.toBeNull()
      return table!
    })
  }

  afterEach(() => {
    listing.mockReset()
    listing.mockImplementation(() => Object.assign(
      Promise.resolve<Listing>({
        layers: [1],
        contents: [],
        children: [{ name: 'listed', ids: [2], parents: [1], contents: [], container: true }],
      }),
      { refresh },
    ))
  })

  it('switches between icons & a table, & remembers the choice', async () => {
    await render(FileBrowser, { props: { path: ['a'] } })
    await toTable()
    expect(document.querySelector('nav.details > ul')).toBeNull()
    expect(document.querySelector('.views button[title="Table"]')!.getAttribute('aria-pressed'))
    .toBe('true')
    expect(localStorage.getItem('mimis-setting-details-view')).toBe('table')
    document.querySelector<HTMLButtonElement>('.views button[title="Icons"]')!.click()
    await vi.waitFor(() => expect(document.querySelector('nav.details > ul')).not.toBeNull())
    expect(localStorage.getItem('mimis-setting-details-view')).toBe('icons')
  })

  it('lists each entry as a row of its name, type, choices, & size', async () => {
    listed({
      layers: [1],
      contents: [],
      children: [
        { name: 'docs', ids: [2], parents: [1], contents: [], container: true },
        {
          name: 'hat', ids: [3], parents: [1], container: false,
          contents: [content('bafyHat', 'image/svg+xml', 1536), content('bafyAlt', 'image/png')],
        },
      ],
    })
    await render(FileBrowser, { props: { path: ['a'] } })
    const table = await toTable()
    const rows = [...table.querySelectorAll('table.entries tbody tr')]
    expect(rows.map((row) => [...row.querySelectorAll('td')].slice(1).map(({ textContent }) => textContent)))
    .toEqual([['docs', 'folder', '0', ''], ['hat', 'image/svg+xml', '2', '1.5 KiB']])
    expect(rows[1].querySelector('img')!.getAttribute('src')).toContain('bafyHat')
    expect(rows.map((row) => row.getAttribute('data-kind'))).toEqual(['spot', 'spot'])
  })

  it('offers a row’s rename in its context menu (FR-001)', async () => {
    await render(FileBrowser, { props: { path: ['a'], me: '0xme' } })
    const table = await toTable()
    const row = await vi.waitFor(() => {
      const found = table.querySelector('table.entries tbody tr')
      expect(found).not.toBeNull()
      return found!
    })
    row.dispatchEvent(new MouseEvent('contextmenu', {
      ctrlKey: true, bubbles: true, cancelable: true, clientX: 5, clientY: 5,
    }))
    const menu = document.querySelector<HTMLElement>('menu.context')!
    await vi.waitFor(() => (
      expect([...menu.querySelectorAll('button')].map(({ textContent }) => textContent?.trim()))
      .toContain('Rename “listed”…')
    ))
  })

  it('heads a file’s page with its choices', async () => {
    listed({ layers: [1], contents: [content('bafyHat', 'image/svg+xml')], children: [] })
    await render(FileBrowser, { props: { path: ['a', 'hat'] } })
    const table = await toTable()
    await vi.waitFor(() => expect(table.querySelector('.alternatives')).not.toBeNull())
    expect(table.querySelector('table.entries')).toBeNull()
  })
})

describe('where dropped files go (FR-017, FR-018)', () => {
  const content = { id: 'c', uuid: 'c', cid: 'bafyC', type: 'image/png', size: 1, spot: 2 }
  const placements = async (listed: Listing) => {
    listing.mockImplementation(() => Object.assign(Promise.resolve(listed), { refresh }))
    await render(FileBrowser, { props: { path: ['a'] } })
    await vi.waitFor(() => expect(drops.length).toBeGreaterThan(1))
    return Object.fromEntries(await Promise.all(drops.map(async ({ path, placement }) => (
      [path().join('/'), await placement?.()]
    ))))
  }

  afterEach(() => {
    listing.mockReset()
    listing.mockImplementation(() => Object.assign(
      Promise.resolve<Listing>({
        layers: [1],
        contents: [],
        children: [{ name: 'listed', ids: [2], parents: [1], contents: [], container: true }],
      }),
      { refresh },
    ))
  })

  it('versions a file’s tile, & nests into a folder’s & a folder’s page', async () => {
    expect(await placements({
      layers: [1],
      contents: [content],
      children: [
        { name: 'hat', ids: [3], parents: [1], contents: [content], container: false },
        { name: 'docs', ids: [4], parents: [1], contents: [content], container: true },
      ],
    })).toEqual({ a: 'nest', 'a/hat': 'version', 'a/docs': 'nest' })
  })

  it('takes files dropped on a file’s page as alternatives', async () => {
    listing.mockImplementation(() => Object.assign(
      Promise.resolve<Listing>({ layers: [1], contents: [content], children: [] }),
      { refresh },
    ))
    await render(FileBrowser, { props: { path: ['a', 'hat'] } })
    await vi.waitFor(() => expect(document.querySelector('#media')).not.toBeNull())
    const [page] = drops
    expect(await page.placement?.()).toBe('alternative')
  })
})
