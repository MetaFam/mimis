import { access, lstat, readdir, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import ignore, { type Ignore } from 'ignore'

// The in-memory tree of data-model.md — never persisted; nothing of it
// survives into the DAG except what selection admits.
export type SpiderEntry = {
  name: string,
  path: string,
  kind: 'file' | 'dir',
  size: number,
  children?: SpiderEntry[],
  defaultExcluded: boolean,
  unreadable?: string,
  selected: boolean,
}

export const assertEdgeName = (name: string): string => {
  if(name === '') {
    throw new Error('edge names must be non-empty')
  }
  if(name.includes('/')) {
    throw new Error(`entry name ${JSON.stringify(name)} must not contain "/"`)
  }
  return name
}

type IgnoreScope = {
  prefix: string,
  matcher: Ignore,
}

const isIgnored = (scopes: IgnoreScope[], path: string, isDir: boolean): boolean => {
  for(const { prefix, matcher } of scopes) {
    const relative = path.slice(prefix.length)
    if(matcher.ignores(relative) || (isDir && matcher.ignores(`${relative}/`))) {
      return true
    }
  }
  return false
}

const reasonOf = (cause: unknown): string => (
  cause instanceof Error ? cause.message : String(cause)
)

const walkDir = async (
  absolute: string,
  path: string,
  scopes: IgnoreScope[],
  excluded: boolean,
): Promise<SpiderEntry[]> => {
  const prefix = path === '' ? '' : `${path}/`
  try {
    const rules = await readFile(join(absolute, '.gitignore'), 'utf8')
    scopes = [...scopes, { prefix, matcher: ignore().add(rules) }]
  } catch {}
  const entries: SpiderEntry[] = []
  for(const dirent of await readdir(absolute, { withFileTypes: true })) {
    // Symlinks are recorded as absent — never followed (FR-011); other
    // non-file kinds (sockets, fifos) have no archive representation.
    if(dirent.isSymbolicLink() || !(dirent.isFile() || dirent.isDirectory())) {
      continue
    }
    const name = assertEdgeName(dirent.name)
    const childAbsolute = join(absolute, name)
    const childPath = `${prefix}${name}`
    const kind = dirent.isDirectory() ? 'dir' : 'file'
    const defaultExcluded = excluded
      || name.startsWith('.')
      || isIgnored(scopes, childPath, kind === 'dir')
    const entry: SpiderEntry = {
      name,
      path: childPath,
      kind,
      size: 0,
      defaultExcluded,
      selected: false,
    }
    if(kind === 'dir') {
      try {
        entry.children = await walkDir(childAbsolute, childPath, scopes, defaultExcluded)
        entry.size = entry.children.reduce((total, child) => total + child.size, 0)
      } catch(cause) {
        entry.children = []
        entry.unreadable = reasonOf(cause)
      }
    } else {
      entry.size = (await lstat(childAbsolute)).size
      try {
        await access(childAbsolute, constants.R_OK)
      } catch(cause) {
        entry.unreadable = reasonOf(cause)
      }
    }
    entry.selected = !entry.defaultExcluded && !entry.unreadable
    entries.push(entry)
  }
  return entries.sort((a, b) => (
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  ))
}

export const walk = async (dir: string): Promise<SpiderEntry> => {
  const absolute = resolve(dir)
  const root: SpiderEntry = {
    name: basename(absolute),
    path: '',
    kind: 'dir',
    size: 0,
    defaultExcluded: false,
    selected: true,
  }
  root.children = await walkDir(absolute, '', [], false)
  root.size = root.children.reduce((total, child) => total + child.size, 0)
  return root
}

const setSubtree = (entry: SpiderEntry, selected: boolean) => {
  if(entry.unreadable) {
    return
  }
  entry.selected = selected
  for(const child of entry.children ?? []) {
    setSubtree(child, selected)
  }
}

// The single mutable bit of the selection model: the UI toggles it,
// patterns compute it — one model for both (SC-005).
export const toggle = (entry: SpiderEntry): void => {
  setSubtree(entry, !entry.selected)
}

export type Patterns = {
  include?: string[],
  exclude?: string[],
}

// gitignore-syntax patterns via the same matcher the walker uses
// (research.md R4). An include match opts an entry in even past its
// default exclusion (explicit beats default); an exclude match always
// wins (contracts/cli.md); unreadable entries stay unselectable.
export const applyPatterns = (
  root: SpiderEntry,
  { include = [], exclude = [] }: Patterns,
): void => {
  if(include.length === 0 && exclude.length === 0) {
    return
  }
  const includes = include.length > 0 ? ignore().add(include) : undefined
  const excludes = exclude.length > 0 ? ignore().add(exclude) : undefined
  const matches = (matcher: Ignore, entry: SpiderEntry) => (
    matcher.ignores(entry.path)
    || (entry.kind === 'dir' && matcher.ignores(`${entry.path}/`))
  )
  const apply = (entry: SpiderEntry, chosen: boolean, dropped: boolean) => {
    const excluded = dropped || (excludes ? matches(excludes, entry) : false)
    const included = chosen || (includes ? matches(includes, entry) : false)
    const base = includes ? included : !entry.defaultExcluded
    entry.selected = !entry.unreadable && !excluded && base
    for(const child of entry.children ?? []) {
      apply(child, included, excluded)
    }
  }
  for(const child of root.children ?? []) {
    apply(child, false, false)
  }
  root.selected = (root.children ?? []).some(({ selected }) => selected)
}

export type SelectedFile = {
  path: string,
  size: number,
  entry: SpiderEntry,
}

export const selectedFiles = (root: SpiderEntry): SelectedFile[] => {
  const files: SelectedFile[] = []
  const collect = (entry: SpiderEntry) => {
    if(entry.kind === 'file' && entry.selected) {
      files.push({ path: entry.path, size: entry.size, entry })
    }
    for(const child of entry.children ?? []) {
      collect(child)
    }
  }
  collect(root)
  return files
}

export const selectedStats = (root: SpiderEntry): { files: number, bytes: number } => {
  const files = selectedFiles(root)
  return {
    files: files.length,
    bytes: files.reduce((total, { size }) => total + size, 0),
  }
}
