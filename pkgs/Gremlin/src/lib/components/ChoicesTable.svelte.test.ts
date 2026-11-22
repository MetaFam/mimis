import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import ChoicesTable from './ChoicesTable.svelte'

const { ranking, place, addFiles, refresh, row } = vi.hoisted(() => {
  const refresh = vi.fn()
  const row = (id: number, cid: string, type: string) => (
    { id, uuid: cid, cid, type, size: 2048, spot: 9 }
  )
  return {
    row,
    refresh,
    ranking: vi.fn(() => Object.assign(
      Promise.resolve([
        { ...row(1, 'bafyA', 'image/svg+xml'), own: true },
        { ...row(2, 'bafyB', 'text/plain'), own: false },
        { ...row(3, 'bafyC', 'image/png'), own: false },
      ]),
      { refresh },
    )),
    place: vi.fn(async () => {}),
    addFiles: vi.fn(async () => []),
  }
})

vi.mock('#lib/remotes/ranking.remote.js', () => ({ ranking, place }))
vi.mock('#lib/remotes/listing.remote.js', () => ({
  listing: vi.fn(() => ({ refresh })),
}))
vi.mock('#lib/ipfs.js', () => ({ addFiles }))

afterEach(() => {
  document.body.innerHTML = ''
  place.mockClear()
  addFiles.mockClear()
  refresh.mockClear()
})

const contents = [row(1, 'bafyA', 'image/svg+xml'), row(2, 'bafyB', 'text/plain')]

const shown = async (onerror = vi.fn()) => {
  await render(ChoicesTable, { props: { path: ['image', 'hat'], contents, onerror } })
  const rows = await vi.waitFor(() => {
    const found = [...document.querySelectorAll<HTMLTableRowElement>('.alternatives tbody tr')]
    expect(found).toHaveLength(3)
    return found
  })
  const button = (row: number, title: string) => (
    rows[row].querySelector<HTMLButtonElement>(`button[title="${title}"]`)!
  )
  return { rows, button, onerror }
}

/** Drags row `from` & drops it on row `to`, as a browser would. */
const drag = (rows: Array<HTMLElement>, from: number, to: number) => {
  const data = new DataTransfer()
  rows[from].dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: data }))
  const over = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data })
  rows[to].dispatchEvent(over)
  const drop = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data })
  rows[to].dispatchEvent(drop)
  return { over, drop }
}

describe('ChoicesTable', () => {
  it('lists every Content best first, with its type, size, & layer (FR-016)', async () => {
    const { rows } = await shown()
    const cells = (selector: string) => rows.map((row) => row.querySelector(selector)!.textContent)
    expect(cells('.rank')).toEqual(['1', '2', '3'])
    expect(cells('.type')).toEqual(['image/svg+xml', 'text/plain', 'image/png'])
    expect(cells('.size')).toEqual(['2.0 KiB', '2.0 KiB', '2.0 KiB'])
    expect(cells('.owner')).toEqual(['yours', 'mounted', 'mounted'])
    expect(rows[0].querySelector('img')!.getAttribute('src')).toContain('bafyA')
    expect(rows[1].querySelector('img')).toBeNull()
  })

  it('can’t move the first up or the last down', async () => {
    const { button } = await shown()
    expect(button(0, 'Move up').disabled).toBe(true)
    expect(button(0, 'Move down').disabled).toBe(false)
    expect(button(2, 'Move down').disabled).toBe(true)
  })

  it.each([
    { row: 1, title: 'Move up', index: 0 },
    { row: 1, title: 'Move down', index: 2 },
  ])('moves Content $row to $index with “$title”', async ({ row, title, index }) => {
    const { button } = await shown()
    button(row, title).click()
    await vi.waitFor(() => (
      expect(place).toHaveBeenCalledWith({ path: ['image', 'hat'], content: 2, index })
    ))
  })

  it.each([
    { from: 2, to: 0 },
    { from: 0, to: 1 },
  ])('moves the row dragged from $from to $to into its place', async ({ from, to }) => {
    const { rows } = await shown()
    const { over, drop } = drag(rows, from, to)
    expect(over.defaultPrevented).toBe(true)
    expect(drop.defaultPrevented).toBe(true)
    await vi.waitFor(() => (
      expect(place).toHaveBeenCalledWith({ path: ['image', 'hat'], content: from + 1, index: to })
    ))
  })

  it('moves nothing for a row dropped on itself', async () => {
    const { rows } = await shown()
    drag(rows, 1, 1)
    expect(place).not.toHaveBeenCalled()
  })

  it('lets dropped files through to the page', async () => {
    const { rows } = await shown()
    const page = vi.fn()
    document.body.addEventListener('drop', page)
    const data = new DataTransfer()
    data.items.add(new File(['<svg/>'], 'hat.svg', { type: 'image/svg+xml' }))
    rows[0].dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    expect(page).toHaveBeenCalled()
    expect(place).not.toHaveBeenCalled()
    document.body.removeEventListener('drop', page)
  })

  it('shows the listing’s order, unmovable, when ranking fails', async () => {
    ranking.mockImplementationOnce(() => Object.assign(
      Promise.reject(new Error('Sign in to rank.')),
      { refresh },
    ))
    await render(ChoicesTable, { props: { path: ['image', 'hat'], contents } })
    await vi.waitFor(() => (
      expect(document.querySelector('.alternatives .note')?.textContent).toBe('Sign in to rank.')
    ))
    const rows = [...document.querySelectorAll('.alternatives tbody tr')]
    expect(rows.map((row) => row.querySelector('.type')!.textContent))
    .toEqual(['image/svg+xml', 'text/plain'])
    expect(rows.every((row) => row.getAttribute('draggable') === 'false')).toBe(true)
    expect(document.querySelector('.alternatives button')).toBeNull()
  })

  it('reports a failed move', async () => {
    place.mockRejectedValueOnce(new Error('Nope.'))
    const { button, onerror } = await shown()
    button(1, 'Move up').click()
    await vi.waitFor(() => expect(onerror).toHaveBeenCalledWith('Nope.'))
  })

  it('adds chosen files as alternatives on this Spot itself (FR-017)', async () => {
    await shown()
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!
    const data = new DataTransfer()
    data.items.add(new File(['<svg/>'], 'my hat.svg', { type: 'image/svg+xml' }))
    input.files = data.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await vi.waitFor(() => expect(addFiles).toHaveBeenCalled())
    const [[{ files, ...rest }]] = addFiles.mock.calls as unknown as (
      Array<[{ files: Array<File> }]>
    )
    expect(rest).toEqual({ path: ['image', 'hat'], alternative: true, onto: true })
    expect(files.map(({ name }) => name)).toEqual(['my hat.svg'])
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
  })
})
