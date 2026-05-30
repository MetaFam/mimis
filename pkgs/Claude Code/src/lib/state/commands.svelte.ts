/** High-level actions that coordinate the individual stores.
 *
 * Components dispatch intent here ("open this", "paste", "rename") rather than
 * poking at several stores directly, which keeps the UI layer declarative. */

import { join } from '$lib/fs'
import { filesystem } from './filesystem.svelte'
import { navigation } from './navigation.svelte'
import { selection } from './selection.svelte'
import { clipboard } from './clipboard.svelte'

class Commands {
  /** Path of the entry currently being inline-renamed, if any. */
  renaming = $state<string | null>(null)

  private get fs() {
    return filesystem.fs
  }

  /** Absolute paths of the current directory's visible entries, in order. */
  private get orderedPaths(): string[] {
    return filesystem.listing(navigation.path).map((n) => join(navigation.path, n.name))
  }

  /** Activate an entry: enter folders, otherwise it is a no-op placeholder. */
  open(path: string) {
    if (this.fs.isFolder(path)) navigation.go(path)
  }

  newFolder() {
    const path = this.fs.mkdir(navigation.path)
    selection.select(path)
    this.renaming = path
  }

  newFile() {
    const path = this.fs.createFile(navigation.path)
    selection.select(path)
    this.renaming = path
  }

  beginRename(path: string) {
    this.renaming = path
  }

  cancelRename() {
    this.renaming = null
  }

  commitRename(path: string, name: string) {
    const next = this.fs.rename(path, name)
    if (next) selection.select(next)
    this.renaming = null
  }

  remove(paths: string[]) {
    this.fs.remove(paths)
    selection.clear()
    if (paths.some((p) => clipboard.paths.includes(p))) clipboard.clear()
  }

  copy(paths: string[]) {
    if (paths.length) clipboard.copy(paths)
  }

  cut(paths: string[]) {
    if (paths.length) clipboard.cut(paths)
  }

  paste() {
    if (!clipboard.active) return
    const dest = navigation.path
    if (clipboard.mode === 'cut') {
      this.fs.move(clipboard.paths, dest)
      clipboard.clear()
    } else {
      this.fs.copy(clipboard.paths, dest)
    }
  }

  selectAll() {
    selection.replaceAll(this.orderedPaths)
  }
}

export const commands = new Commands()
