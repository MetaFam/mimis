import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { error } from '@sveltejs/kit'
import { userEvent } from 'vitest/browser'
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
  [...document.querySelectorAll(`section[aria-label="${section}"] li > .row`)]
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
    expect(rows('Unstaged')).toEqual(['icon/', 'hat/ +2 −1'])
    const [staged] = document.querySelectorAll<HTMLInputElement>('section[aria-label="Staged"] li input[type="checkbox"]')
    const [unstaged] = document.querySelectorAll<HTMLInputElement>('section[aria-label="Unstaged"] li input[type="checkbox"]')
    expect(staged.checked).toBe(true)
    expect(unstaged.checked).toBe(false)
  })

  it('asks for a wallet without a session, & won’t publish', async () => {
    await open(null)
    await vi.waitFor(() => expect(status()).toBe('Connect a wallet to publish.'))
    expect(button('Publish')).toBeUndefined()
    expect(pending).not.toHaveBeenCalled()
  })

  it('asks for a wallet when none is connected', async () => {
    getConnection.mockReturnValue({ address: undefined })
    await open()
    await vi.waitFor(() => expect(status()).toBe('Connect a wallet to publish.'))
    expect(button('Publish')).toBeUndefined()
  })

  it('stages & unstages a Spot by its checkbox', async () => {
    await open()
    await vi.waitFor(() => expect(rows('Unstaged')).toHaveLength(2))
    document.querySelector<HTMLInputElement>('section[aria-label="Unstaged"] li input')!.click()
    await vi.waitFor(() => expect(stage).toHaveBeenCalledWith({ ids: [2], staged: true }))
    document.querySelector<HTMLInputElement>('section[aria-label="Staged"] li input')!.click()
    await vi.waitFor(() => expect(stage).toHaveBeenCalledWith({ ids: [1], staged: false }))
  })

  it('stages every unstaged Spot with “Stage Everything”, while none are staged', async () => {
    pending.mockImplementation(() => Object.assign(
      Promise.resolve({ staged: [], unstaged: [...lists.unstaged, spot(3, ['b'])] }),
      { refresh: vi.fn() },
    ))
    await open()
    await vi.waitFor(() => expect(rows('Unstaged')).toHaveLength(3))
    expect(document.querySelector('#mass-select')!.textContent).toContain('Stage Everything')
    document.querySelector<HTMLInputElement>('#check-all')!.click()
    await vi.waitFor(() => expect(stage).toHaveBeenCalledWith({ ids: [2, 3], staged: true }))
  })

  it('unstages every staged Spot with “Unstage Everything”', async () => {
    await open()
    await vi.waitFor(() => expect(rows('Staged')).toHaveLength(1))
    expect(document.querySelector('#mass-select')!.textContent).toContain('Unstage Everything')
    document.querySelector<HTMLInputElement>('#check-all')!.click()
    await vi.waitFor(() => expect(stage).toHaveBeenCalledWith({ ids: [1], staged: false }))
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
  it('moves an unchecked row to “Unstaged” after the refresh', async () => {
    await open()
    await vi.waitFor(() => expect(rows('Staged')).toEqual(['/ new']))
    pending.mockImplementation(() => Object.assign(
      Promise.resolve({ staged: [], unstaged: [{ ...lists.staged[0], staged: false }, ...lists.unstaged] }),
      { refresh: vi.fn() },
    ))
    document.querySelector<HTMLInputElement>('section[aria-label="Staged"] li input')!.click()
    await vi.waitFor(() => expect(rows('Staged')).toEqual([]))
    expect(stage).toHaveBeenCalledWith({ ids: [1], staged: false })
    expect(rows('Unstaged')).toEqual(['/ new', 'icon/', 'hat/ +2 −1'])
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

describe('PublishDialog, reopened', () => {
  it('lists Spots changed while it was closed', async () => {
    // Like a remote query’s, every call’s answer is the one cached,
    // which only `refresh` replaces.
    const cache = { lists, answer: Promise.resolve(lists) }
    pending.mockImplementation(() => ({
      then: (
        resolve: (value: typeof lists) => unknown,
        reject: (err: unknown) => unknown,
      ) => (
        cache.answer.then(resolve, reject)
      ),
      refresh: () => (cache.answer = Promise.resolve(cache.lists)),
    }))
    const listed = () => (
      [...document.querySelectorAll('dialog#publish section li > .row')]
      .map((row) => row.textContent?.replace(/\s+/g, ' ').trim())
    )
    await open()
    await vi.waitFor(() => expect(listed()).toEqual(['/ new', 'icon/', 'hat/ +2 −1']))
    const dialog = document.querySelector<HTMLDialogElement>('dialog#publish')!
    dialog.close()
    cache.lists = {
      ...lists,
      unstaged: [...lists.unstaged, spot(3, ['icon', 'cap'], { isNew: true })],
    }
    dialog.showModal()
    await vi.waitFor(() => expect(listed()).toEqual(['/ new', 'icon/', 'hat/ +2 −1', 'cap/ new']))
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

describe('PublishDialog, nesting by path (US1)', () => {
  const showing = (staged: Array<ReturnType<typeof spot>>, unstaged: Array<ReturnType<typeof spot>>) => {
    pending.mockImplementation(() => Object.assign(Promise.resolve({ staged, unstaged }), { refresh: vi.fn() }))
    return open()
  }
  const section = (name: string) => document.querySelector(`section[aria-label="${name}"]`)!
  /** The section’s top-level rows, each with what’s nested in it. */
  type Tree = Array<string | [string, Tree]>
  const tree = (list: Element | null): Tree => (
    [...(list?.children ?? [])].map((li) => {
      const line = li.querySelector(':scope > .row')!.textContent!.replace(/\s+/g, ' ').trim()
      const nested = li.querySelector(':scope > ul')
      return nested ? [line, tree(nested)] : line
    })
  )
  const listOf = (name: string) => section(name).querySelector(':scope > ul:last-of-type')

  it('nests rows under their parents, named by their own names (US1-1)', async () => {
    await showing([], [spot(2, ['icon']), spot(3, ['icon', 'hat']), spot(4, ['icon', 'cap'])])
    await vi.waitFor(() => expect(rows('Unstaged')).toHaveLength(3))
    expect(tree(listOf('Unstaged'))).toEqual([['icon/ +1 −0', ['hat/ +1 −0', 'cap/ +1 −0']]])
  })

  it('shows parents that aren’t pending as context, without a checkbox (US1-2)', async () => {
    await showing([], [spot(5, ['icon', 'hat', 'top'], { isNew: true })])
    await vi.waitFor(() => expect(rows('Unstaged')).toEqual(['icon/', 'hat/', 'top/ new']))
    const lines = [...section('Unstaged').querySelectorAll('li > .row')]
    expect(lines.map((line) => line.querySelector('input') != null)).toEqual([false, false, true])
    expect(lines.map((line) => line.querySelector('.context') != null)).toEqual([true, true, false])
  })

  it('shows a staged parent in Staged & its unstaged child under it in Unstaged (US1-3)', async () => {
    await showing([spot(2, ['icon'], { staged: true })], [spot(3, ['icon', 'hat'])])
    await vi.waitFor(() => expect(rows('Staged')).toEqual(['icon/ +1 −0']))
    expect(section('Staged').querySelector<HTMLInputElement>('li input')!.checked).toBe(true)
    expect(tree(listOf('Unstaged'))).toEqual([['icon/', ['hat/ +1 −0']]])
  })

  it('stages only the Spot whose checkbox is clicked (US1-4, FR-004)', async () => {
    await showing([spot(2, ['icon'], { staged: true })], [spot(3, ['icon', 'hat'])])
    await vi.waitFor(() => expect(rows('Unstaged')).toHaveLength(2))
    section('Unstaged').querySelector<HTMLInputElement>('li input')!.click()
    await vi.waitFor(() => expect(stage).toHaveBeenCalled())
    expect(stage.mock.calls).toEqual([[{ ids: [3], staged: true }]])
  })

  it('heads a section with the root, labelled “/” (US1-5)', async () => {
    await showing([spot(1, [], { staged: true, isNew: true }), spot(2, ['docs'], { staged: true })], [])
    await vi.waitFor(() => expect(rows('Staged')).toHaveLength(2))
    expect(tree(listOf('Staged'))).toEqual([['/ new', ['docs/ +1 −0']]])
  })

  it('keeps siblings in the order they came (US1-6)', async () => {
    await showing([], [spot(2, ['docs']), spot(3, ['Icon']), spot(4, ['art'])])
    await vi.waitFor(() => expect(rows('Unstaged')).toEqual(['docs/ +1 −0', 'Icon/ +1 −0', 'art/ +1 −0']))
  })
})

describe('PublishDialog, folding (US2)', () => {
  const showing = (staged: Array<ReturnType<typeof spot>>, unstaged: Array<ReturnType<typeof spot>>) => {
    pending.mockImplementation(() => Object.assign(Promise.resolve({ staged, unstaged }), { refresh: vi.fn() }))
  }
  const rowOf = (section: string, label: string) => (
    [...document.querySelectorAll(`section[aria-label="${section}"] li`)]
    .find((li) => li.querySelector(':scope > .row')!.textContent!.trim().startsWith(label))!
  )
  const foldOf = (section: string, label: string) => (
    rowOf(section, label).querySelector<HTMLButtonElement>(':scope > .row button.fold')
  )
  const nestedOf = (section: string, label: string) => rowOf(section, label).querySelector(':scope > ul')
  const imported = [
    spot(2, ['import']), spot(3, ['import', 'a']), spot(4, ['import', 'b', 'c']), spot(5, ['import', 'd']),
  ]

  it('folds a row, hiding what’s in it & showing how many (US2-1, FR-007)', async () => {
    showing([], imported)
    await open()
    await vi.waitFor(() => expect(foldOf('Unstaged', 'import/')).not.toBeNull())
    foldOf('Unstaged', 'import/')!.click()
    await vi.waitFor(() => expect(nestedOf('Unstaged', 'import/')).toBeNull())
    expect(rows('Unstaged')).toEqual(['import/ (3) +1 −0'])
  })

  it('unfolds it as it was, nested folds & all (US2-2)', async () => {
    showing([], imported)
    await open()
    await vi.waitFor(() => expect(foldOf('Unstaged', 'b/')).not.toBeNull())
    foldOf('Unstaged', 'b/')!.click()
    foldOf('Unstaged', 'import/')!.click()
    await vi.waitFor(() => expect(nestedOf('Unstaged', 'import/')).toBeNull())
    foldOf('Unstaged', 'import/')!.click()
    await vi.waitFor(() => expect(nestedOf('Unstaged', 'import/')).not.toBeNull())
    expect(rows('Unstaged')).toEqual(['import/ +1 −0', 'a/ +1 −0', 'b/ (1)', 'd/ +1 −0'])
  })

  it('offers no fold on a row with nothing in it (US2-3, FR-006)', async () => {
    showing([], imported)
    await open()
    await vi.waitFor(() => expect(rows('Unstaged')).toHaveLength(5))
    expect(foldOf('Unstaged', 'a/')).toBeNull()
    expect(foldOf('Unstaged', 'c/')).toBeNull()
  })

  it('keeps a fold through staging another row (US2-4, FR-008)', async () => {
    showing([], [...imported, spot(6, ['docs'])])
    await open()
    await vi.waitFor(() => expect(foldOf('Unstaged', 'import/')).not.toBeNull())
    foldOf('Unstaged', 'import/')!.click()
    await vi.waitFor(() => expect(nestedOf('Unstaged', 'import/')).toBeNull())
    showing([spot(6, ['docs'], { staged: true })], imported)
    rowOf('Unstaged', 'docs/').querySelector('input')!.click()
    await vi.waitFor(() => expect(rows('Staged')).toEqual(['docs/ +1 −0']))
    expect(nestedOf('Unstaged', 'import/')).toBeNull()
  })

  it('folds each section on its own (US2-5)', async () => {
    showing(
      [spot(2, ['import'], { staged: true }), spot(7, ['import', 'x'], { staged: true })],
      imported.slice(1),
    )
    await open()
    await vi.waitFor(() => expect(foldOf('Unstaged', 'import/')).not.toBeNull())
    foldOf('Unstaged', 'import/')!.click()
    await vi.waitFor(() => expect(nestedOf('Unstaged', 'import/')).toBeNull())
    expect(nestedOf('Staged', 'import/')).not.toBeNull()
  })

  it('folds from the keyboard, & says whether it’s expanded (US2-6, FR-010)', async () => {
    showing([], imported)
    await open()
    await vi.waitFor(() => expect(foldOf('Unstaged', 'import/')).not.toBeNull())
    const fold = foldOf('Unstaged', 'import/')!
    expect(fold.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById(fold.getAttribute('aria-controls')!)).toBe(nestedOf('Unstaged', 'import/'))
    fold.focus()
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(fold.getAttribute('aria-expanded')).toBe('false'))
    await userEvent.keyboard(' ')
    await vi.waitFor(() => expect(fold.getAttribute('aria-expanded')).toBe('true'))
    expect(fold.getAttribute('aria-label')).toBe('import/')
  })

  it('opens again with nothing folded (R4)', async () => {
    showing([], imported)
    await open()
    await vi.waitFor(() => expect(foldOf('Unstaged', 'import/')).not.toBeNull())
    foldOf('Unstaged', 'import/')!.click()
    await vi.waitFor(() => expect(nestedOf('Unstaged', 'import/')).toBeNull())
    const dialog = document.querySelector<HTMLDialogElement>('dialog#publish')!
    dialog.close()
    dialog.showModal()
    await vi.waitFor(() => expect(nestedOf('Unstaged', 'import/')).not.toBeNull())
  })
})

describe('PublishDialog, large imports (US3)', () => {
  const under = (count: number, first = 100) => [
    spot(first, ['import']),
    ...Array.from({ length: count }, (_, idx) => spot(first + 1 + idx, ['import', `f${idx}`])),
  ]
  const showing = (staged: Array<ReturnType<typeof spot>>, unstaged: Array<ReturnType<typeof spot>>) => {
    pending.mockImplementation(() => Object.assign(Promise.resolve({ staged, unstaged }), { refresh: vi.fn() }))
  }
  const top = () => rows('Unstaged')[0]

  it('opens a row with more than 50 inside folded (US3-1, FR-009)', async () => {
    showing([], under(51))
    await open()
    await vi.waitFor(() => expect(top()).toBe('import/ (51) +1 −0'))
    expect(rows('Unstaged')).toHaveLength(1)
  })

  it('opens a row with 50 inside unfolded (US3-2)', async () => {
    showing([], under(50))
    await open()
    await vi.waitFor(() => expect(rows('Unstaged')).toHaveLength(51))
    expect(top()).toBe('import/ +1 −0')
  })

  it('keeps a row unfolded by hand unfolded through a restage (US3-3)', async () => {
    showing([], [...under(51), spot(9, ['docs'])])
    await open()
    await vi.waitFor(() => expect(top()).toBe('import/ (51) +1 −0'))
    document.querySelector<HTMLButtonElement>('section[aria-label="Unstaged"] button.fold')!.click()
    await vi.waitFor(() => expect(rows('Unstaged')).toHaveLength(53))
    showing([spot(9, ['docs'], { staged: true })], under(51))
    ;[...document.querySelectorAll('section[aria-label="Unstaged"] li')]
    .find((li) => li.textContent?.includes('docs/'))!
    .querySelector('input')!.click()
    await vi.waitFor(() => expect(rows('Staged')).toEqual(['docs/ +1 −0']))
    expect(rows('Unstaged')).toHaveLength(52)
  })

  it('opens 10,000 pending Spots in one folder as one folded row, quickly (SC-002)', async () => {
    showing([], under(10_000))
    const start = performance.now()
    await open()
    await vi.waitFor(() => expect(top()).toBe('import/ (10000) +1 −0'))
    expect(performance.now() - start).toBeLessThan(2000)
    expect(document.querySelectorAll('section[aria-label="Unstaged"] li').length).toBeLessThan(5)
  })
})
