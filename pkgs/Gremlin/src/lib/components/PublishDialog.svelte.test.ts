import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { error } from '@sveltejs/kit'
import PublishDialog from './PublishDialog.svelte'

const ME = '0xB0B0000000000000000000000000000000000001'

const {
  pending, stage, preparePublish, commitPublish, signTypedData, getConnection,
} = vi.hoisted(() => ({
  pending: vi.fn(),
  stage: vi.fn(),
  preparePublish: vi.fn(),
  commitPublish: vi.fn(),
  signTypedData: vi.fn(),
  getConnection: vi.fn(),
}))

vi.mock('#lib/remotes/pending.remote.js', () => ({ pending }))
vi.mock('#lib/remotes/stage.remote.js', () => ({ stage }))
vi.mock('#lib/remotes/preparePublish.remote.js', () => ({ preparePublish }))
vi.mock('#lib/remotes/commitPublish.remote.js', () => ({ commitPublish }))
vi.mock('@wagmi/core', () => ({ signTypedData, getConnection }))
vi.mock('#lib/appkit.js', () => ({ getWagmiAdapter: () => ({ wagmiConfig: {} }) }))

const spot = (id: number, path: Array<string>, extra = {}) => ({
  id, uuid: `u${id}`, path, isNew: false, staged: false, added: 1, removed: 0, ...extra,
})
const lists = {
  staged: [spot(1, [], { isNew: true, staged: true })],
  unstaged: [spot(2, ['icon', 'hat'], { added: 2, removed: 1 })],
}
const typedData = {
  domain: { name: 'Mïmis Graph', version: '1' },
  primaryType: 'Update',
  types: { Update: [] },
  message: { device: 'd1', sequence: '1', spots: 'bafyS', contents: 'bafyC', previous: '' },
}
const ready = {
  nothing: false,
  typedData,
  plan: 'sealed',
  included: [{ path: ['icon'], reason: 'connect' }],
  counts: { spots: 2, contents: 0 },
}
const never = () => new Promise(() => {})
const httpError = (status: number, message: string) => {
  try {
    error(status, message)
  } catch(err) {
    return err
  }
}

beforeEach(() => {
  pending.mockImplementation(() => Object.assign(Promise.resolve(lists), { refresh: vi.fn() }))
  stage.mockResolvedValue({ staged: 1 })
  preparePublish.mockResolvedValue(ready)
  commitPublish.mockResolvedValue({ cid: 'bafyupdate', sequence: 1 })
  signTypedData.mockResolvedValue('0xsigned')
  getConnection.mockReturnValue({ address: ME })
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

const open = async (me: string | null = ME) => {
  await render(PublishDialog, { props: { me } })
  document.querySelector<HTMLDialogElement>('dialog#publish')!.showModal()
}
const button = (name: string) => (
  [...document.querySelectorAll<HTMLButtonElement>('dialog#publish button')]
  .find((element) => element.textContent?.trim() === name)!
)
const status = () => (
  (document.querySelector('dialog#publish output')!.textContent ?? '').replace(/\s+/g, ' ').trim()
)
const rows = (section: string) => (
  [...document.querySelectorAll(`section[aria-label="${section}"] li`)]
  .map((row) => row.textContent?.replace(/\s+/g, ' ').trim())
)

describe('PublishDialog', () => {
  it('shows a spinner while the pending Spots load', async () => {
    pending.mockImplementation(() => Object.assign(never(), { refresh: vi.fn() }))
    await open()
    await vi.waitFor(() => expect(document.querySelector('dialog#publish img[alt="Loading…"]')).not.toBeNull())
  })

  it('lists staged & unstaged Spots by path, with a summary', async () => {
    await open()
    await vi.waitFor(() => expect(rows('Staged')).toEqual(['/ new']))
    expect(rows('Not staged')).toEqual(['icon/hat/ +2 −1'])
    const [staged] = document.querySelectorAll<HTMLInputElement>('section[aria-label="Staged"] input[type="checkbox"]')
    const [unstaged] = document.querySelectorAll<HTMLInputElement>('section[aria-label="Not staged"] input[type="checkbox"]')
    expect(staged.checked).toBe(true)
    expect(unstaged.checked).toBe(false)
  })

  it('asks for a wallet without a session, & won’t publish', async () => {
    await open(null)
    await vi.waitFor(() => expect(status()).toBe('Connect a wallet to publish.'))
    expect(button('Publish').disabled).toBe(true)
    expect(pending).not.toHaveBeenCalled()
  })

  it('asks for a wallet when none is connected', async () => {
    getConnection.mockReturnValue({ address: undefined })
    await open()
    await vi.waitFor(() => expect(status()).toBe('Connect a wallet to publish.'))
    expect(button('Publish').disabled).toBe(true)
  })

  it('stages & unstages a Spot by its checkbox', async () => {
    await open()
    await vi.waitFor(() => expect(rows('Not staged')).toHaveLength(1))
    document.querySelector<HTMLInputElement>('section[aria-label="Not staged"] input')!.click()
    await vi.waitFor(() => expect(stage).toHaveBeenCalledWith({ ids: [2], staged: true }))
    document.querySelector<HTMLInputElement>('section[aria-label="Staged"] input')!.click()
    await vi.waitFor(() => expect(stage).toHaveBeenCalledWith({ ids: [1], staged: false }))
  })

  it('stages everything with “Stage all”', async () => {
    await open()
    await vi.waitFor(() => expect(rows('Staged')).toHaveLength(1))
    button('Stage all').click()
    await vi.waitFor(() => expect(stage).toHaveBeenCalledWith({ all: true }))
  })

  it('says when nothing is staged, without asking the wallet', async () => {
    preparePublish.mockResolvedValue({ nothing: true })
    await open()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(false))
    button('Publish').click()
    await vi.waitFor(() => expect(status()).toBe('Nothing is staged to publish.'))
    expect(signTypedData).not.toHaveBeenCalled()
  })

  it('shows what was included, then waits for the wallet', async () => {
    signTypedData.mockImplementation(never)
    await open()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(false))
    button('Publish').click()
    await vi.waitFor(() => expect(status()).toContain('Waiting for your wallet…'))
    expect(status()).toContain('Also included so the staged Spots stay connected:')
    expect(status()).toContain('icon/')
    expect(signTypedData).toHaveBeenCalledWith({}, {
      ...typedData, message: { ...typedData.message, sequence: 1n },
    })
  })

  it('keeps Publish disabled while publishing', async () => {
    preparePublish.mockImplementation(never)
    await open()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(false))
    button('Publish').click()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(true))
  })

  it('says a declined signature changed nothing, & doesn’t commit', async () => {
    signTypedData.mockRejectedValue(new Error('User rejected the request.'))
    await open()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(false))
    button('Publish').click()
    await vi.waitFor(() => expect(status()).toBe('Publish cancelled. Your changes are still pending.'))
    expect(commitPublish).not.toHaveBeenCalled()
    expect(button('Publish').disabled).toBe(false)
  })

  it('shows the published Update’s address & the comment, as unsigned', async () => {
    await open()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(false))
    const comment = document.querySelector<HTMLInputElement>('dialog#publish input[name="comment"]')!
    comment.value = 'hats'
    comment.dispatchEvent(new Event('input', { bubbles: true }))
    button('Publish').click()
    await vi.waitFor(() => expect(status()).toContain('Published Update 1:'))
    expect(preparePublish).toHaveBeenCalledWith({ comment: 'hats' })
    expect(commitPublish).toHaveBeenCalledWith({ plan: 'sealed', signature: '0xsigned' })
    const link = document.querySelector<HTMLAnchorElement>('dialog#publish output a')!
    expect(link.textContent).toBe('bafyupdate')
    expect(link.href).toContain('bafyupdate')
    expect(status()).toContain('Comment: hats (yours, unsigned)')
    expect(pending.mock.calls.length).toBeGreaterThan(1)
  })

  it('shows a failure’s message, & lets you try again', async () => {
    commitPublish.mockRejectedValue(httpError(409, 'Another publish finished first; publish again.'))
    await open()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(false))
    button('Publish').click()
    await vi.waitFor(() => expect(status()).toBe('Another publish finished first; publish again.'))
    expect(button('Publish').disabled).toBe(false)
  })
})

describe('PublishDialog, publishing part of the changes', () => {
  it('moves an unchecked row to “Not staged” after the refresh', async () => {
    await open()
    await vi.waitFor(() => expect(rows('Staged')).toEqual(['/ new']))
    pending.mockImplementation(() => Object.assign(
      Promise.resolve({ staged: [], unstaged: [{ ...lists.staged[0], staged: false }, ...lists.unstaged] }),
      { refresh: vi.fn() },
    ))
    document.querySelector<HTMLInputElement>('section[aria-label="Staged"] input')!.click()
    await vi.waitFor(() => expect(rows('Staged')).toEqual([]))
    expect(stage).toHaveBeenCalledWith({ ids: [1], staged: false })
    expect(rows('Not staged')).toEqual(['/ new', 'icon/hat/ +2 −1'])
  })

  it('labels what was included by why, before asking the wallet', async () => {
    preparePublish.mockResolvedValue({
      ...ready,
      included: [
        { path: ['a'], reason: 'connect' },
        { path: ['a', 'new'], reason: 'new' },
        { path: ['b'], reason: 'move' },
      ],
    })
    signTypedData.mockImplementation(never)
    await open()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(false))
    button('Publish').click()
    await vi.waitFor(() => expect(status()).toContain('Waiting for your wallet…'))
    expect([...document.querySelectorAll('dialog#publish output li')].map((li) => li.textContent?.replace(/\s+/g, ' ').trim()))
    .toEqual(['a/ to connect', 'a/new/ new', 'b/ moved'])
  })
})

describe('PublishDialog, checking the account (US4-3)', () => {
  it('refuses a wallet on another account before anything is stored', async () => {
    const other = '0xA11CE00000000000000000000000000000000002'
    await open()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(false))
    getConnection.mockReturnValue({ address: other })
    button('Publish').click()
    await vi.waitFor(() => expect(status()).toBe(
      `Your wallet is connected as ${other}, but you’re signed in as ${ME}.`
    ))
    expect(preparePublish).not.toHaveBeenCalled()
    expect(signTypedData).not.toHaveBeenCalled()
  })

  it('accepts the same account however it’s cased', async () => {
    getConnection.mockReturnValue({ address: ME.toLowerCase() })
    await open()
    await vi.waitFor(() => expect(button('Publish').disabled).toBe(false))
    button('Publish').click()
    await vi.waitFor(() => expect(preparePublish).toHaveBeenCalled())
  })
})
