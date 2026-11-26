import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-svelte'
import RenameDialog from './RenameDialog.svelte'

const { renameSpot, refresh } = vi.hoisted(() => ({
  renameSpot: vi.fn(async ({ path, to }: { path: Array<string>, to: string }) => (
    { path: [...path, to.trim()] }
  )),
  refresh: vi.fn(),
}))

vi.mock('#lib/remotes/renameSpot.remote.js', () => ({ renameSpot }))
vi.mock('#lib/remotes/listing.remote.js', () => ({
  listing: vi.fn(() => ({ refresh })),
}))

afterEach(() => {
  document.body.innerHTML = ''
  renameSpot.mockClear()
  refresh.mockClear()
})

const opened = async (name = 'hatz') => {
  const onrenamed = vi.fn()
  const onerror = vi.fn()
  const onclose = vi.fn()
  await render(RenameDialog, {
    props: { path: ['image'], name, onrenamed, onerror, onclose },
  })
  const dialog = await vi.waitFor(() => {
    const found = document.querySelector('dialog')
    expect(found?.open).toBe(true)
    return found!
  })
  const input = dialog.querySelector('input')!
  const button = (text: string) => (
    [...dialog.querySelectorAll('button')].find((each) => each.textContent === text)!
  )
  const type = (value: string) => {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
  return { dialog, input, button, type, onrenamed, onerror, onclose }
}

describe('RenameDialog', () => {
  it('opens with the name filled in & selected', async () => {
    const { input } = await opened()
    expect(input.value).toBe('hatz')
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 4])
  })

  it('renames, refreshes the parent’s listing, & gives the new path', async () => {
    const { dialog, type, button, onrenamed, onerror } = await opened()
    type('hats')
    button('Rename').click()
    await vi.waitFor(() => expect(onrenamed).toHaveBeenCalledWith(['image', 'hats']))
    expect(renameSpot).toHaveBeenCalledWith({ path: ['image'], from: 'hatz', to: 'hats' })
    expect(refresh).toHaveBeenCalled()
    expect(dialog.open).toBe(false)
    expect(onerror).not.toHaveBeenCalled()
  })

  it.each([
    ['Cancel', ({ button }: Awaited<ReturnType<typeof opened>>) => button('Cancel').click()],
    ['Escape', () => userEvent.keyboard('{Escape}')],
  ])('closes on %s without renaming (FR-008)', async (_, close) => {
    const shown = await opened()
    shown.type('hats')
    await close(shown)
    await vi.waitFor(() => expect(shown.onclose).toHaveBeenCalled())
    expect(renameSpot).not.toHaveBeenCalled()
  })

  it.each([
    ['', '“” isn’t a name: it’s empty.'],
    ['  ', '“  ” isn’t a name: it’s empty.'],
    ['..', '“..” isn’t a name: it’s reserved.'],
    ['a/b', '“a/b” isn’t a name: it contains “/”.'],
  ])('can’t rename to %j, & says why (FR-007)', async (value, reason) => {
    const { dialog, input, type, button } = await opened()
    type(value)
    await vi.waitFor(() => expect(button('Rename').disabled).toBe(true))
    expect(dialog.textContent).toContain(reason)
    expect(input.validationMessage).toBe(reason)
    type('hats')
    await vi.waitFor(() => expect(button('Rename').disabled).toBe(false))
    expect(dialog.textContent).not.toContain('isn’t a name')
  })

  it('reports a refusal & keeps the name as typed (FR-010)', async () => {
    renameSpot.mockRejectedValueOnce(Object.assign(new Error('/image/ already contains “cap”'), {
      status: 409, body: { message: '/image/ already contains “cap”' },
    }))
    const { dialog, input, type, button, onerror, onrenamed } = await opened()
    type('cap')
    button('Rename').click()
    await vi.waitFor(() => expect(onerror).toHaveBeenCalledWith('/image/ already contains “cap”'))
    expect(dialog.open).toBe(true)
    expect(input.value).toBe('cap')
    expect(onrenamed).not.toHaveBeenCalled()
  })

  it.each(['hatz', '  hatz '])('closes without renaming for the unchanged name %j (FR-008)', async (value) => {
    const { type, button, onclose, onrenamed } = await opened()
    type(value)
    button('Rename').click()
    await vi.waitFor(() => expect(onclose).toHaveBeenCalled())
    expect(renameSpot).not.toHaveBeenCalled()
    expect(onrenamed).not.toHaveBeenCalled()
  })
})
