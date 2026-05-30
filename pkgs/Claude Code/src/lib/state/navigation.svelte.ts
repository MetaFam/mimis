/** Current directory plus Back/Forward/Up history, mirroring Dolphin. */

import { dirname, HOME, normalize, ROOT } from '$lib/fs'
import { selection } from './selection.svelte'

class NavigationStore {
  /** Visited paths; `index` points at the current entry. */
  private history = $state<string[]>([HOME])
  private index = $state(0)

  get path(): string {
    return this.history[this.index]
  }

  get canBack(): boolean {
    return this.index > 0
  }

  get canForward(): boolean {
    return this.index < this.history.length - 1
  }

  get canUp(): boolean {
    return this.path !== ROOT
  }

  /** Navigate to `path`, truncating any forward history (a fresh branch). */
  go(path: string) {
    const target = normalize(path)
    if (target === this.path) return
    this.history = [...this.history.slice(0, this.index + 1), target]
    this.index = this.history.length - 1
    selection.clear()
  }

  back() {
    if (!this.canBack) return
    this.index--
    selection.clear()
  }

  forward() {
    if (!this.canForward) return
    this.index++
    selection.clear()
  }

  up() {
    if (this.canUp) this.go(dirname(this.path))
  }
}

export const navigation = new NavigationStore()
