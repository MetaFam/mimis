/** In-memory filesystem operations over a tree of {@link FsNode}s.
 *
 * The class deliberately operates on whatever root node it is handed, so the
 * reactive store can pass in a `$state`-proxied tree and have mutations tracked
 * automatically. Lookups that may legitimately miss return `null`; structurally
 * impossible situations (e.g. a child collection on a file) throw. */

import type { FsNode } from './types'
import { iconFor } from './icons'
import { basename, dirname, isAncestor, join, normalize, segments, ROOT } from './path'

export class VirtualFs {
  constructor(public root: FsNode) {}

  /** Resolve an absolute path to its node, or `null` when it does not exist. */
  resolve(path: string): FsNode | null {
    let node: FsNode = this.root
    for (const seg of segments(path)) {
      if (node.kind !== 'folder' || !node.children) return null
      const next = node.children.find((c) => c.name === seg)
      if (!next) return null
      node = next
    }
    return node
  }

  /** Resolve a path that must be an existing folder, throwing otherwise. */
  private folder(path: string): FsNode {
    const node = this.resolve(path)
    if (!node) throw new Error(`No such path: ${path}`)
    if (node.kind !== 'folder') throw new Error(`Not a folder: ${path}`)
    node.children ??= []
    return node
  }

  exists(path: string): boolean {
    return this.resolve(path) !== null
  }

  isFolder(path: string): boolean {
    return this.resolve(path)?.kind === 'folder'
  }

  /** Direct children of a folder. Returns `[]` for a missing path or a file. */
  list(path: string): FsNode[] {
    const node = this.resolve(path)
    return node?.kind === 'folder' ? (node.children ?? []) : []
  }

  /** Recursive byte size of a node (its own size, or the sum of descendants). */
  sizeOf(node: FsNode): number {
    if (node.kind === 'file') return node.size
    return (node.children ?? []).reduce((sum, child) => sum + this.sizeOf(child), 0)
  }

  /** Recursive count of contained files and folders. */
  countOf(node: FsNode): { files: number, folders: number } {
    let files = 0
    let folders = 0
    for (const child of node.children ?? []) {
      if (child.kind === 'folder') {
        folders++
        const inner = this.countOf(child)
        files += inner.files
        folders += inner.folders
      } else {
        files++
      }
    }
    return { files, folders }
  }

  /** Pick a name in `dir` that does not collide, appending ` (n)` as needed. */
  uniqueName(dir: string, desired: string): string {
    const taken = new Set(this.list(dir).map((c) => c.name))
    if (!taken.has(desired)) return desired
    const dot = desired.lastIndexOf('.')
    const stem = dot > 0 ? desired.slice(0, dot) : desired
    const ext = dot > 0 ? desired.slice(dot) : ''
    for (let n = 1; ; n++) {
      const candidate = `${stem} (${n})${ext}`
      if (!taken.has(candidate)) return candidate
    }
  }

  /** Create a folder under `parent`; returns the new folder's absolute path. */
  mkdir(parent: string, name = 'New Folder'): string {
    const dir = this.folder(parent)
    const unique = this.uniqueName(parent, name)
    dir.children!.push({ name: unique, kind: 'folder', size: 0, modified: Date.now(), children: [] })
    return join(normalize(parent), unique)
  }

  /** Create an empty file under `parent`; returns the new file's path. */
  createFile(parent: string, name = 'New File.txt', size = 0): string {
    const dir = this.folder(parent)
    const unique = this.uniqueName(parent, name)
    const node: FsNode = { name: unique, kind: 'file', size, modified: Date.now() }
    node.mime = iconFor(node).mime
    dir.children!.push(node)
    return join(normalize(parent), unique)
  }

  /** Rename the entry at `path`; returns its new path, or `null` if missing. */
  rename(path: string, newName: string): string | null {
    const node = this.resolve(path)
    if (!node || path === ROOT) return null
    const parent = dirname(path)
    const trimmed = newName.trim()
    if (!trimmed || trimmed === node.name) return path
    node.name = this.uniqueName(parent, trimmed)
    node.modified = Date.now()
    return join(parent, node.name)
  }

  /** Delete the given paths. Silently skips entries that no longer exist. */
  remove(paths: string[]): void {
    for (const path of paths) {
      if (path === ROOT) continue
      const parent = this.resolve(dirname(path))
      if (parent?.kind !== 'folder' || !parent.children) continue
      const name = basename(path)
      parent.children = parent.children.filter((c) => c.name !== name)
    }
  }

  /** Move entries into `destDir`. A no-op for a move into self or a child. */
  move(paths: string[], destDir: string): void {
    const dest = this.folder(destDir)
    for (const path of paths) {
      if (isAncestor(path, destDir) || dirname(path) === normalize(destDir)) continue
      const node = this.resolve(path)
      const parent = this.resolve(dirname(path))
      if (!node || parent?.kind !== 'folder' || !parent.children) continue
      parent.children = parent.children.filter((c) => c !== node)
      node.name = this.uniqueName(destDir, node.name)
      dest.children!.push(node)
    }
  }

  /** Copy entries into `destDir`, deep-cloning folders. */
  copy(paths: string[], destDir: string): void {
    const dest = this.folder(destDir)
    for (const path of paths) {
      const node = this.resolve(path)
      if (!node) continue
      const clone = cloneNode(node)
      clone.name = this.uniqueName(destDir, clone.name)
      dest.children!.push(clone)
    }
  }
}

/** Deep clone a node into plain objects, reading through any reactive proxy. */
function cloneNode(node: FsNode): FsNode {
  const copy: FsNode = {
    name: node.name,
    kind: node.kind,
    size: node.size,
    modified: node.modified,
  }
  if (node.hidden) copy.hidden = node.hidden
  if (node.mime) copy.mime = node.mime
  if (node.children) copy.children = node.children.map(cloneNode)
  return copy
}
