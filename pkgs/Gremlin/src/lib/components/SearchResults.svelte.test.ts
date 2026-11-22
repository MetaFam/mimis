import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { userEvent } from 'vitest/browser'
import { flushSync } from 'svelte'
import { toHTTP } from '#lib'
import Folder from '#assets/folder.svg'
import SearchResults from './SearchResults.svelte'

const CID_A = 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy'
const CID_B = 'bafkreidwf2gbnrygoyrpdpeqrdcmyrwh66rvqkcr3qmf7lc5lnvwjbvktm'

type Page = {
  results: Array<{
    id: number
    names: Array<string>
    thumb?: { type: string, cid: string } | null
    types?: Array<string>
  }>
  more: boolean
}
type Call = {
  args: { path: Array<string>, parts: Array<string>, offset: number }
  resolve: (page: Page) => void
  reject: (err: unknown) => void
}

const { calls, searchSpots } = vi.hoisted(() => {
  const calls: Array<Call> = []
  const searchSpots = vi.fn((args: Call['args']) => {
    let resolve!: Call['resolve']
    let reject!: Call['reject']
    const promise = new Promise<Page>((res, rej) => {
      resolve = res
      reject = rej
    })
    calls.push({ args, resolve, reject })
    return promise
  })
  return { calls, searchSpots }
})

vi.mock('#lib/remotes/searchSpots.remote.js', () => ({ searchSpots }))

const page = (
  paths: Array<string>, { more = false, from = 1 } = {},
): Page => ({
  results: paths.map((path, idx) => (
    { id: from + idx, names: path.split('/'), thumb: null, types: [] }
  )),
  more,
})

const settle = () => new Promise((res) => setTimeout(res, 200))

const el = <T extends Element = HTMLElement>(selector: string) => (
  document.querySelector<T>(selector)
)
const all = (selector: string) => (
  [...document.querySelectorAll<HTMLElement>(selector)]
)
const links = () => (
  all('#search-results ol > li > a').map((a) => a.textContent?.trim())
)

let props: { path: Array<string>, query: string }

beforeEach(async () => {
  calls.length = 0
  searchSpots.mockClear()
  const state = $state({ path: ['a'], query: 'emm' })
  props = state
  await render(SearchResults, { props })
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('SearchResults', () => {
  it('labels the region & shows the active query', () => {
    expect(el('section#search-results')?.getAttribute('aria-label'))
    .toBe('Search results')
    expect(el('#search-results output')?.textContent).toContain('emm')
  })

  it('waits for typing to pause, then asks once for the first page', async () => {
    props.query = 'e'
    flushSync()
    props.query = 'em'
    flushSync()
    props.query = 'emma'
    flushSync()
    await settle()
    expect(searchSpots).toHaveBeenCalledTimes(1)
    expect(calls[0].args).toMatchObject(
      { path: ['a'], parts: ['emma'], offset: 0 }
    )
  })

  it('says it’s searching until the first page arrives', async () => {
    await settle()
    expect(el('#search-results [role="status"]')?.textContent)
    .toContain('Searching…')
  })

  it('lists each result’s path below the current position', async () => {
    await settle()
    calls[0].resolve(page(['b/emma', 'b/c/gemma']))
    await vi.waitFor(() => (
      expect(links()).toEqual(['b/emma/', 'b/c/gemma/'])
    ))
    expect(el<HTMLAnchorElement>('#search-results a')?.getAttribute('href'))
    .toBe('/a/b/emma/')
  })

  it('starts a line with a preview of its displayable content', async () => {
    await settle()
    calls[0].resolve({
      results: [
        {
          id: 1,
          names: ['pic'],
          thumb: { type: 'image/png', cid: CID_A },
          types: ['image/png'],
        },
        {
          id: 2,
          names: ['clip'],
          thumb: { type: 'video/mp4', cid: CID_B },
          types: ['video/mp4'],
        },
        { id: 3, names: ['plain'], thumb: null, types: ['text/plain'] },
        { id: 4, names: ['empty'], thumb: null, types: [] },
      ],
      more: false,
    })
    await vi.waitFor(() => (
      expect(links()).toEqual(['pic/', 'clip/', 'plain/', 'empty/'])
    ))
    const [pic, clip, plain, empty] = all('#search-results ol > li > a')
    const img = pic.firstElementChild as HTMLImageElement
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toBe(toHTTP({ cid: CID_A }))
    expect(img.alt).toBe('')
    const video = clip.firstElementChild as HTMLVideoElement
    expect(video.tagName).toBe('VIDEO')
    expect(video.getAttribute('src')).toBe(toHTTP({ cid: CID_B }))
    expect(video.muted).toBe(true)
    expect(plain.querySelector('img, video')).toBeNull()
    const folder = empty.firstElementChild as HTMLImageElement
    expect(folder.tagName).toBe('IMG')
    expect(folder.getAttribute('src')).toBe(Folder)
    expect(folder.classList.contains('folder')).toBe(true)
    expect(folder.alt).toBe('')
  })

  it('says when nothing matched', async () => {
    await settle()
    calls[0].resolve(page([]))
    await vi.waitFor(() => (
      expect(el('#search-results [role="status"]')?.textContent)
      .toContain('Nothing matched')
    ))
  })

  it('shows why a search failed', async () => {
    await settle()
    calls[0].reject(new Error('Search: "boom"'))
    await vi.waitFor(() => (
      expect(el('#search-results [role="alert"]')?.textContent)
      .toContain('Search: "boom"')
    ))
  })

  it('never shows a stale query’s results', async () => {
    await settle()
    props.query = 'emma'
    flushSync()
    await settle()
    expect(calls.map(({ args }) => args.parts)).toEqual([['emm'], ['emma']])
    calls[1].resolve(page(['b/emma']))
    await vi.waitFor(() => expect(links()).toEqual(['b/emma/']))
    calls[0].resolve(page(['b/emma', 'b/c/gemma']))
    await settle()
    expect(links()).toEqual(['b/emma/'])
  })

  it('shows more until there’s no more', async () => {
    await settle()
    const first = Array.from({ length: 100 }, (_, i) => `n${i}`)
    calls[0].resolve(page(first, { more: true }))
    await vi.waitFor(() => expect(links()).toHaveLength(100))
    el<HTMLButtonElement>('#search-results button.more')?.click()
    await vi.waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1].args).toMatchObject({ parts: ['emm'], offset: 100 })
    calls[1].resolve(page(['m0', 'm1'], { from: 101 }))
    await vi.waitFor(() => expect(links()).toHaveLength(102))
    expect(links().slice(-2)).toEqual(['m0/', 'm1/'])
    expect(el('#search-results button.more')).toBeNull()
  })

  it('starts again from the first page when the query changes', async () => {
    await settle()
    calls[0].resolve(page(['x'], { more: true }))
    await vi.waitFor(() => expect(links()).toEqual(['x/']))
    el<HTMLButtonElement>('#search-results button.more')?.click()
    await vi.waitFor(() => expect(calls).toHaveLength(2))
    props.query = 'emma'
    flushSync()
    await settle()
    expect(calls.at(-1)?.args).toMatchObject({ parts: ['emma'], offset: 0 })
    expect(calls.filter(({ args }) => args.parts[0] === 'emma')).toHaveLength(1)
  })

  it('starts again from the first page when the position changes', async () => {
    await settle()
    props.path = ['q']
    flushSync()
    await vi.waitFor(() => (
      expect(calls.at(-1)?.args).toMatchObject({ path: ['q'], offset: 0 })
    ))
  })

  it('clears the query', async () => {
    el<HTMLButtonElement>('#search-results button.clear')?.click()
    flushSync()
    expect(props.query).toBe('')
  })
})

describe('choosing a result', () => {
  let hidden: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    const actions = document.createElement('menu')
    actions.id = 'actions'
    actions.setAttribute('popover', '')
    document.body.appendChild(actions)
    hidden = vi.spyOn(actions, 'hidePopover')
    await settle()
    calls[0].resolve(page(['b/emma', 'b/c/gemma', 'd'], { more: true }))
    await vi.waitFor(() => expect(links()).toHaveLength(3))
  })

  const link = (idx: number) => all('#search-results ol > li > a')[idx]

  it('goes there, clears the query, & closes the actions menu', () => {
    link(1).click()
    flushSync()
    expect(props.path).toEqual(['a', 'b', 'c', 'gemma'])
    expect(props.query).toBe('')
    expect(hidden).toHaveBeenCalledOnce()
  })

  it('moves between results with the arrow keys, stopping at the ends', async () => {
    link(0).focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(link(0))
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(document.activeElement).toBe(link(2))
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(link(2))
    await userEvent.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(link(1))
  })

  it('crosses from one page into the next', async () => {
    el<HTMLButtonElement>('#search-results button.more')?.click()
    await vi.waitFor(() => expect(calls).toHaveLength(2))
    calls[1].resolve(page(['e'], { from: 4 }))
    await vi.waitFor(() => expect(links()).toHaveLength(4))
    link(2).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(link(3))
  })

  it('goes there on Enter, the same as a click', async () => {
    link(0).focus()
    await userEvent.keyboard('{Enter}')
    flushSync()
    expect(props.path).toEqual(['a', 'b', 'emma'])
    expect(props.query).toBe('')
    expect(hidden).toHaveBeenCalledOnce()
  })
})
