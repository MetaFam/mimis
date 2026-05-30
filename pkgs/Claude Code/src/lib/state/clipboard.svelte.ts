/** Holds the cut/copied paths awaiting a paste, à la a desktop clipboard. */

type Mode = 'copy' | 'cut' | null

class ClipboardStore {
  paths = $state<string[]>([])
  mode = $state<Mode>(null)

  get active(): boolean {
    return this.mode !== null && this.paths.length > 0
  }

  /** True while `path` is a pending cut, so the view can dim it. */
  isCut(path: string): boolean {
    return this.mode === 'cut' && this.paths.includes(path)
  }

  copy(paths: string[]) {
    this.paths = [...paths]
    this.mode = 'copy'
  }

  cut(paths: string[]) {
    this.paths = [...paths]
    this.mode = 'cut'
  }

  clear() {
    this.paths = []
    this.mode = null
  }
}

export const clipboard = new ClipboardStore()
