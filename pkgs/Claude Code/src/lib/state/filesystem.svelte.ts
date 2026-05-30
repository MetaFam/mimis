/** Reactive wrapper around {@link VirtualFs}.
 *
 * Holds the filesystem tree as deep `$state`, so any mutation made through the
 * `VirtualFs` methods is automatically observed by the UI. Also exposes a
 * sorted/filtered directory listing derived from the current view settings. */

import { VirtualFs, createSeedTree, extensionOf, type FsNode, type SortDirection, type SortKey } from '$lib/fs'
import { view } from './view.svelte'

class FileSystemStore {
  /** The whole tree, proxied for deep reactivity. */
  private tree = $state<FsNode>(createSeedTree())
  /** Operations run against the proxied tree, so writes stay reactive. */
  readonly fs = new VirtualFs(this.tree)

  /** Restore the demo filesystem to its seeded state, in place. */
  reset() {
    this.fs.root.children = createSeedTree().children
  }

  /** Children of `path`, filtered for hidden files and sorted per settings. */
  listing(path: string): FsNode[] {
    const entries = this.fs.list(path).filter((node) => view.showHidden || !node.hidden)
    return [...entries].sort(comparator(view.sortKey, view.sortDir, view.foldersFirst))
  }
}

/** Build a comparator honouring the sort key, direction, and folders-first. */
function comparator(key: SortKey, dir: SortDirection, foldersFirst: boolean) {
  const sign = dir === 'asc' ? 1 : -1
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  return (a: FsNode, b: FsNode): number => {
    if (foldersFirst && a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
    switch (key) {
      case 'size':
        return sign * (a.size - b.size || collator.compare(a.name, b.name))
      case 'modified':
        return sign * (a.modified - b.modified || collator.compare(a.name, b.name))
      case 'kind':
        return sign * (collator.compare(extensionOf(a.name), extensionOf(b.name)) || collator.compare(a.name, b.name))
      default:
        return sign * collator.compare(a.name, b.name)
    }
  }
}

export const filesystem = new FileSystemStore()
