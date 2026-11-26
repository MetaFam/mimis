import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import NoticesDialog from './NoticesDialog.svelte'
import relocations from '#lib/relocations.svelte.js'
import type { Notice } from '#lib/remotes/notices.remote.js'

const {
  notices, refreshNotices, listing, removeMount, followMount, keepMount, shown,
} = vi.hoisted(() => {
  const shown: { notices: Array<Notice> } = { notices: [] }
  const refreshNotices = vi.fn()
  const refreshListing = vi.fn()
  return {
    shown,
    refreshNotices,
    refreshListing,
    notices: vi.fn(() => Object.assign(Promise.resolve(shown.notices), { refresh: refreshNotices })),
    listing: vi.fn(() => ({ refresh: refreshListing })),
    removeMount: vi.fn(async () => ({ from: ['image', 'hats'], to: ['old', 'hatz'] })),
    followMount: vi.fn(async () => ({ from: ['image', 'hats'], to: ['old', 'hats'] })),
    keepMount: vi.fn(async () => ({ from: ['image', 'hats'], to: ['image', 'hats'] })),
  }
})

vi.mock('#lib/remotes/notices.remote.js', () => ({ notices }))
vi.mock('#lib/remotes/listing.remote.js', () => ({ listing }))
vi.mock('#lib/remotes/resolveMount.remote.js', () => ({ removeMount, followMount, keepMount }))

const notice = (overrides: Partial<Notice> = {}): Notice => ({
  mount: 'm1',
  uuid: 'u1',
  name: 'hats',
  from: ['image'],
  to: ['old'],
  ownerPath: ['old'],
  owner: '0xs',
  ...overrides,
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

const opened = async (
  listed: Array<Notice>, props: { focus?: string } = {},
) => {
  shown.notices = listed
  const onerror = vi.fn()
  const onclose = vi.fn()
  await render(NoticesDialog, { props: { ...props, onerror, onclose } })
  const dialog = await vi.waitFor(() => {
    const found = document.querySelector('dialog')
    expect(found?.open).toBe(true)
    expect(found!.querySelector('li')).not.toBeNull()
    return found!
  })
  const items = () => [...dialog.querySelectorAll('li.notice')]
  const button = (item: Element, text: string) => (
    [...item.querySelectorAll('button')].find((each) => each.textContent?.startsWith(text))!
  )
  return { dialog, items, button, onerror, onclose }
}

describe('NoticesDialog (FR-022, FR-023)', () => {
  it('tells what each owner moved, from where, to where', async () => {
    const { items } = await opened([
      notice(),
      notice({ mount: 'm2', name: 'caps', to: null, ownerPath: ['attic', 'x'] }),
    ])
    expect(items().map((item) => item.querySelector('p')!.textContent)).toEqual([
      '0xs moved “hats” from /image/ to /old/',
      '0xs moved “caps” from /image/ to /attic/x/ in their tree',
    ])
  })

  it('offers Follow only where the user can see the link', async () => {
    const { items, button } = await opened([notice(), notice({ mount: 'm2', to: null })])
    const [seen, unseen] = items()
    expect(button(seen, 'Follow').disabled).toBe(false)
    expect(button(seen, 'Follow').textContent).toBe('Follow to /old/')
    expect(button(unseen, 'Follow').disabled).toBe(true)
    expect(button(unseen, 'Follow').title).toBe('They moved it where you can’t see it.')
  })

  it('shows only the focused notice', async () => {
    const { items } = await opened([notice(), notice({ mount: 'm2', name: 'caps' })], { focus: 'm2' })
    expect(items()).toHaveLength(1)
    expect(items()[0].textContent).toContain('“caps”')
  })

  it.each([
    ['Remove my rename', removeMount, { from: ['image', 'hats'], to: ['old', 'hatz'] }],
    ['Follow', followMount, { from: ['image', 'hats'], to: ['old', 'hats'] }],
    ['Keep here as mine', keepMount, { from: ['image', 'hats'], to: ['image', 'hats'] }],
  ] as const)('resolves with “%s”, refreshing & relocating', async (text, command, moved) => {
    const { items, button, onerror } = await opened([notice()])
    button(items()[0], text).click()
    await vi.waitFor(() => expect(refreshNotices).toHaveBeenCalled())
    expect(command).toHaveBeenCalledWith({ mount: 'm1' })
    expect(listing).toHaveBeenCalledWith({ path: moved.from.slice(0, -1) })
    expect(listing).toHaveBeenCalledWith({ path: moved.to.slice(0, -1) })
    expect(relocations.latest).toEqual(moved)
    expect(onerror).not.toHaveBeenCalled()
  })

  it('reports a refusal', async () => {
    followMount.mockRejectedValueOnce(Object.assign(new Error('/old/ already contains “hats”'), {
      status: 409, body: { message: '/old/ already contains “hats”' },
    }))
    const { items, button, onerror } = await opened([notice()])
    button(items()[0], 'Follow').click()
    await vi.waitFor(() => expect(onerror).toHaveBeenCalledWith('/old/ already contains “hats”'))
    expect(refreshNotices).not.toHaveBeenCalled()
  })
})
