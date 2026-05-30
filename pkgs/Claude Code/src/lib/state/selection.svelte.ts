/** Tracks which entries (by absolute path) are currently selected. */

import { SvelteSet } from 'svelte/reactivity'

class SelectionStore {
  private set = new SvelteSet<string>()
  /** Anchor for shift-range selection: the last singly-clicked path. */
  private anchor: string | null = null

  has(path: string): boolean {
    return this.set.has(path)
  }

  get size(): number {
    return this.set.size
  }

  get paths(): string[] {
    return [...this.set]
  }

  /** The sole selected path, or `null` when zero or many are selected. */
  get only(): string | null {
    return this.set.size === 1 ? this.paths[0] : null
  }

  clear() {
    this.set.clear()
    this.anchor = null
  }

  /** Replace the selection with a single path (a plain click). */
  select(path: string) {
    this.set.clear()
    this.set.add(path)
    this.anchor = path
  }

  /** Toggle one path without disturbing the rest (Ctrl-click). */
  toggle(path: string) {
    if (this.set.has(path)) {
      this.set.delete(path)
    } else {
      this.set.add(path)
    }
    this.anchor = path
  }

  /** Select an inclusive range within `ordered` from the anchor (Shift-click). */
  range(path: string, ordered: string[]) {
    const anchor = this.anchor ?? path
    const from = ordered.indexOf(anchor)
    const to = ordered.indexOf(path)
    if (from === -1 || to === -1) return this.select(path)
    const [lo, hi] = from <= to ? [from, to] : [to, from]
    this.set.clear()
    for (let i = lo; i <= hi; i++) this.set.add(ordered[i])
  }

  /** Replace the entire selection with the given paths (Select All). */
  replaceAll(paths: string[]) {
    this.set.clear()
    for (const p of paths) this.set.add(p)
  }
}

export const selection = new SelectionStore()
