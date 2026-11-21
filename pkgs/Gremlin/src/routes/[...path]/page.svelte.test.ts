import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { userEvent } from 'vitest/browser'
import { flushSync } from 'svelte'
import { error } from '@sveltejs/kit'

const { listing, searchSpots, receiveUpdate } = vi.hoisted(() => ({
  receiveUpdate: vi.fn(),
  listing: vi.fn(() => Object.assign(
    Promise.resolve({ layers: [1], contents: [], children: [] }),
    { refresh: vi.fn() },
  )),
  searchSpots: vi.fn(() => Promise.resolve({
    results: [
      { id: 2, names: ['b', 'emma'], thumb: null, types: [] },
      { id: 3, names: ['b', 'c', 'gemma'], thumb: null, types: [] },
    ],
    more: false,
  })),
}))

vi.mock('#lib/components/SIWE.svelte', () => import('./SIWE.stub.svelte'))
vi.mock('#lib/remotes/listing.remote.js', () => ({ listing }))
vi.mock('#lib/remotes/searchSpots.remote.js', () => ({ searchSpots }))
vi.mock('#lib/remotes/receiveUpdate.remote.js', () => ({ receiveUpdate }))
vi.mock('#lib/components/PublishDialog.svelte', () => import('./PublishDialog.stub.svelte'))
vi.mock('#lib/janus2CSV.js', () => ({ graphToCSV: vi.fn() }))
vi.mock('#lib/ipfs.js', () => ({ addFiles: vi.fn(), kuboUpload: vi.fn() }))
vi.mock('$app/navigation', () => ({ goto: vi.fn(), afterNavigate: vi.fn() }))
vi.mock('$app/state', () => ({
  page: { params: { path: 'a' }, url: new URL('http://localhost/a/') },
}))

const Page = (await import('./+page.svelte')).default
const { session } = await import('./SIWE.stub.svelte')

const field = () => (
  document.querySelector<HTMLInputElement>('#actions input[type="search"]')!
)
const panes = () => [...document.querySelectorAll<HTMLElement>('section#browse')]
const crumbs = (pane: HTMLElement) => pane.querySelectorAll('#crumbs ol > li').length
const results = () => document.querySelector('#search-results')
const dualPanes = () => [...document.querySelectorAll<HTMLInputElement>(
  '#actions input[type="checkbox"]',
)].find((box) => box.parentElement?.textContent?.includes('Dual Panes'))!

const type = (text: string) => {
  field().value = text
  field().dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}

const toggleDualPanes = () => {
  dualPanes().click()
  flushSync()
}

/** Moves the second pane to the root through its own breadcrumbs. */
const moveSecondPaneToRoot = async () => {
  panes()[1].querySelector<HTMLAnchorElement>('#crumbs ol > li a')!.click()
  flushSync()
  await vi.waitFor(() => expect(crumbs(panes()[1])).toBe(1))
}

beforeEach(async () => {
  await render(Page)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('searching from the actions menu', () => {
  it('shows results in the first pane as you type, without submitting', async () => {
    type('emm')
    await vi.waitFor(() => expect(panes()[0].querySelector('#search-results')).not.toBeNull())
  })

  it('keeps the results when the actions menu closes', async () => {
    const actions = document.getElementById('actions')!
    actions.showPopover()
    type('emm')
    actions.hidePopover()
    flushSync()
    await vi.waitFor(() => expect(results()).not.toBeNull())
  })

  it('suspends the split while searching, then restores both panes', async () => {
    toggleDualPanes()
    await vi.waitFor(() => expect(panes()).toHaveLength(2))
    await moveSecondPaneToRoot()
    type('emm')
    expect(panes()[1].hidden).toBe(true)
    expect(getComputedStyle(panes()[1]).display).toBe('none')
    type('')
    expect(panes()[1].hidden).toBe(false)
    expect(crumbs(panes()[1])).toBe(1)
    expect(crumbs(panes()[0])).toBe(2)
  })

  it('applies a Dual Panes change made while searching once the search ends', async () => {
    toggleDualPanes()
    await vi.waitFor(() => expect(panes()).toHaveLength(2))
    type('emm')
    toggleDualPanes()
    type('')
    expect(panes()).toHaveLength(1)
  })
})

describe('going to a result from the keyboard', () => {
  it('reaches the results from the search field & opens one with Enter', async () => {
    toggleDualPanes()
    await vi.waitFor(() => expect(panes()).toHaveLength(2))
    await moveSecondPaneToRoot()
    const actions = document.getElementById('actions')!
    actions.showPopover()
    field().focus()
    type('emm')
    await vi.waitFor(() => (
      expect(document.querySelector('#search-results a')).not.toBeNull()
    ))
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement)
    .toBe(document.querySelector('#search-results a'))
    await userEvent.keyboard('{Enter}')
    flushSync()
    expect(actions.matches(':popover-open')).toBe(false)
    expect(field().value).toBe('')
    await vi.waitFor(() => expect(crumbs(panes()[0])).toBe(4))
    expect(panes()[1].hidden).toBe(false)
    expect(crumbs(panes()[1])).toBe(1)
  })
})

describe('the actions menu', () => {
  const item = (name: string) => (
    [...document.querySelectorAll<HTMLButtonElement>('#actions button')]
    .find((button) => button.textContent?.trim() === name)
  )

  it('opens the publish dialog from “Publish…”', () => {
    const publish = item('Publish…')!
    expect(publish.getAttribute('commandfor')).toBe('publish')
    expect(publish.getAttribute('command')).toBe('show-modal')
    expect(publish.disabled).toBe(false)
    expect(document.querySelector('dialog#publish')).not.toBeNull()
  })

  it('no longer exports to CAR or CBOR-DAG', () => {
    expect(item('Export to CAR')).toBeUndefined()
    expect(item('Export to CBOR-DAG')).toBeUndefined()
    expect(item('Export to CSV')).toBeDefined()
  })

  it('disables “Publish…” without a session', async () => {
    document.body.innerHTML = ''
    session.me = null
    try {
      await render(Page)
      expect(item('Publish…')!.disabled).toBe(true)
    } finally {
      session.me = '0xabc'
    }
  })
})

describe('recording an Update', () => {
  const submit = (cid: string) => {
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Update address"]')!
    input.value = cid
    input.form!.requestSubmit()
  }
  const logged = () => (
    [...document.querySelectorAll('dialog#logs li')].map((li) => li.textContent)
  )

  it('records it & logs who it’s from', async () => {
    receiveUpdate.mockResolvedValue({ recorded: true, author: '0xa11', device: 'd7', sequence: 4 })
    submit('bafyupdate')
    await vi.waitFor(() => expect(logged()).toEqual(['Recorded Update 4 from 0xa11 (device d7).']))
    expect(receiveUpdate).toHaveBeenCalledWith({ cid: 'bafyupdate' })
  })

  it('says when it was already recorded', async () => {
    receiveUpdate.mockResolvedValue({ recorded: false, author: '0xa11', device: 'd7', sequence: 4 })
    submit('bafyupdate')
    await vi.waitFor(() => expect(logged()).toEqual(['Already recorded.']))
  })

  it('shows a received device as text, never as markup', async () => {
    const device = '<img src="x" onerror="globalThis.pwned = true">'
    receiveUpdate.mockResolvedValue({ recorded: true, author: '0xa11', device, sequence: 1 })
    submit('bafyupdate')
    await vi.waitFor(() => expect(logged()).toEqual([`Recorded Update 1 from 0xa11 (device ${device}).`]))
    expect(document.querySelector('dialog#logs img')).toBeNull()
  })

  it('sends a failure to the error dialog', async () => {
    receiveUpdate.mockImplementation(async () => error(400, '“x” isn’t a CID.'))
    submit('x')
    await vi.waitFor(() => expect(
      [...document.querySelectorAll('dialog p')].map((p) => p.textContent)
    ).toContain('“x” isn’t a CID.'))
  })
})
