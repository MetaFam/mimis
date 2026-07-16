import { emitKeypressEvents, type Key } from 'node:readline'
import { toggle, selectedStats, type SpiderEntry } from './spider.ts'

// Hand-rolled per research.md R5: node:readline keypresses + ANSI
// escapes; the UI only mutates the pure selection model in spider.ts,
// so scripted and interactive runs share one code path (SC-005).

const dim = (text: string) => `\x1b[2m${text}\x1b[22m`
const inverse = (text: string) => `\x1b[7m${text}\x1b[27m`

export const humanSize = (bytes: number): string => {
  if(bytes < 1024) {
    return `${bytes} B`
  }
  const units = ['KiB', 'MiB', 'GiB', 'TiB']
  let value = bytes
  let unit = -1
  while(value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

type Row = {
  entry: SpiderEntry,
  depth: number,
}

type Terminal = {
  input: NodeJS.ReadStream,
  output: NodeJS.WriteStream,
}

export const select = (
  root: SpiderEntry,
  { input, output }: Terminal = { input: process.stdin, output: process.stdout },
): Promise<boolean> => {
  const expanded = new Set<SpiderEntry>()
  const expandDefaults = (entry: SpiderEntry) => {
    if(entry.kind === 'dir' && !entry.defaultExcluded && !entry.unreadable) {
      expanded.add(entry)
      entry.children?.forEach(expandDefaults)
    }
  }
  expandDefaults(root)
  let showExcluded = true
  let cursor = 0
  let notice = ''

  const rows = (): Row[] => {
    const flat: Row[] = []
    const push = (entry: SpiderEntry, depth: number) => {
      if(entry.defaultExcluded && !showExcluded) {
        return
      }
      flat.push({ entry, depth })
      if(entry.kind === 'dir' && expanded.has(entry)) {
        entry.children?.forEach((child) => push(child, depth + 1))
      }
    }
    push(root, 0)
    return flat
  }

  const line = ({ entry, depth }: Row, active: boolean): string => {
    const arrow = entry.kind === 'dir' ? (expanded.has(entry) ? '▾ ' : '▸ ') : '  '
    const box = entry.unreadable ? '[⊘]' : entry.selected ? '[x]' : '[ ]'
    const size = entry.kind === 'file' || !expanded.has(entry) ? (
      `  ${humanSize(entry.size)}`
    ) : (
      ''
    )
    const reason = entry.unreadable ? dim(`  (${entry.unreadable})`) : ''
    const name = entry.kind === 'dir' ? `${entry.name}/` : entry.name
    let text = `${'  '.repeat(depth)}${arrow}${box} ${name}${size}${reason}`
    if(entry.defaultExcluded || entry.unreadable) {
      text = dim(text)
    }
    return active ? inverse(text) : text
  }

  const render = () => {
    const flat = rows()
    cursor = Math.min(cursor, flat.length - 1)
    const height = Math.max((output.rows ?? 24) - 4, 3)
    const top = Math.min(
      Math.max(cursor - Math.floor(height / 2), 0),
      Math.max(flat.length - height, 0),
    )
    const stats = selectedStats(root)
    const header = `spider: ${root.name}/ — ${stats.files} files, ${humanSize(stats.bytes)} selected`
    const hints = '↑/↓ move · →/← expand/collapse · space toggle · h hidden · enter confirm · q abort'
    const body = flat.slice(top, top + height)
    .map((row, index) => line(row, top + index === cursor))
    output.write(`\x1b[2J\x1b[H${[
      header,
      '',
      ...body,
      '',
      notice === '' ? dim(hints) : notice,
    ].join('\r\n')}`)
  }

  return new Promise((done) => {
    emitKeypressEvents(input)
    const wasRaw = input.isRaw
    input.setRawMode?.(true)
    input.resume()
    output.write('\x1b[?1049h\x1b[?25l')

    const finish = (confirmed: boolean) => {
      input.off('keypress', onKey)
      input.setRawMode?.(wasRaw ?? false)
      input.pause()
      output.write('\x1b[?1049l\x1b[?25h')
      done(confirmed)
    }

    const onKey = (_input: string, key: Key) => {
      notice = ''
      const flat = rows()
      const current = flat[cursor]?.entry
      switch(key.ctrl && key.name === 'c' ? 'q' : key.name) {
        case 'up':
          cursor = Math.max(cursor - 1, 0)
          break
        case 'down':
          cursor = Math.min(cursor + 1, flat.length - 1)
          break
        case 'right':
          if(current?.kind === 'dir' && !current.unreadable) {
            expanded.add(current)
          }
          break
        case 'left':
          if(current?.kind === 'dir') {
            expanded.delete(current)
          }
          break
        case 'space':
          if(current && !current.unreadable) {
            toggle(current)
          }
          break
        case 'h':
          showExcluded = !showExcluded
          break
        case 'return':
        case 'enter':
          if(selectedStats(root).files === 0) {
            notice = 'nothing selected — select at least one file (or q to abort)'
            break
          }
          return finish(true)
        case 'q':
          return finish(false)
      }
      render()
    }

    input.on('keypress', onKey)
    render()
  })
}
