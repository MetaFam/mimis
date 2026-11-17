import { CID } from 'multiformats'
import { settings } from '#lib/settings.svelte.js'
import { moveSpot } from '#lib/remotes/moveSpot.remote.js'
import { moveContent } from '#lib/remotes/moveContent.remote.js'
import { listing } from '#lib/remotes/listing.remote.js'
import { spotId } from '#lib/remotes/spotId.remote.js'
import { addFiles } from '#lib/ipfs.js'
import type { Node, DirNode } from '../types'

export function toHTTP({ url, cid }: {
  url?: string | null; cid?: string | CID | null;
}) {
  if((!url && !cid) || (url && cid)) {
    throw new Error('Must provide either `url` xor `cid`.')
  }
  let path: Array<string> = []
  if(url != null) {
    [,cid, ...path] = Array.from(
      /^(?:ipfs:\/\/)?([^/]+)(\/.*)?$/.exec(url) ?? []
    )
  } else if(cid != null) {
    if(cid instanceof CID) {
      cid = cid.toString()
    }
    [cid, ...path] = cid.split('/')
  }
  if(cid == null) {
    throw new Error('Could not determine `cid`.')
  }
  return (
    settings.ipfsURLPattern
    .replace('{cid}', cid)
    .replace('{path}', `/${path.join('/')}`)
  )
}

export function logHeader(str = 'Mïmis', style: string | null = null) {
  style ??= (
    'background-color: light-dark(lightblue, darkblue);'
    + 'color: light-dark(darkblue, lightblue);'
    + 'font-size: 15pt;'
    + 'font-family: script, Helvetica, sans-serif;'
    + 'padding: 0.5rem;'
  )
  console.log(`%c${str}`, style)
}

export function throwError<T>(test: T) {
  if(isError(test)) {
    throw new Error(test.error || '¡Unknown Error!')
  }
  return test as Exclude<T, { error: string }>
}

export function isError(
  maybe: unknown
): maybe is { error: string } {
  return (
    typeof(maybe) === 'object'
    && maybe != null
    && Object.keys(maybe).length === 1
    && Object.keys(maybe).at(0) === 'error'
    && typeof(Object.values(maybe).at(0)) === 'string'
  )
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConnectionError'
  }
}

/** Add a `selected = true` attribute to every node in a tree. */
export function selectAll(roots: Array<Node> | Node) {
  const select = (node: Node) => {
    node.selected = true
    for(const child of (node as DirNode).children ?? []) {
      select(child)
    }
    return node
  }
  if(Array.isArray(roots)) {
    return roots.map((root) => select(root))
  }
  return select(roots)
}

export function metricize(size: number, options = { precision: 3 }) {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  let adjustedSize = size
  let unitIndex = 0
  while(adjustedSize >= 1024 && unitIndex++ < units.length - 1) {
    adjustedSize /= 1024
  }
  return `${adjustedSize.toLocaleString(
    undefined, { maximumFractionDigits: options.precision }
  )}${units[unitIndex]}`
}

export function expandLevels(
  { tree, levels }: { tree: Node, levels: number }
) {
  const expand = (node: Node, level: number) => {
    if(level > 0) {
      node.expanded = true
      for(const child of (node as DirNode).children ?? []) {
        expand(child, level - 1)
      }
    }
  }
  expand(tree, levels)
}

type MaybePromise<T> = T | Promise<T>

/** `R` is what `descendingTo` makes of each node. */
export interface WalkOut<R = unknown> {
  descendingTo: R | undefined
  descendingFrom: unknown
  ascendingFrom: unknown
  ascendingTo: unknown
  walk: WalkOut<R> | null
}

type AtNode<T, R> = {
  root: T
  walker: Walker<T, R>
  out: WalkOut<R>
}
type BetweenNodes<T, R> = {
  from: T
  to: T
  walker: Walker<T, R>
  out: WalkOut<R>
}

export interface Walker<T, R = unknown> {
  descendingTo?: (at: AtNode<T, R>) => MaybePromise<R | undefined>
  descendingFrom?: (between: BetweenNodes<T, R>) => unknown
  ascendingTo?: (between: BetweenNodes<T, R>) => unknown
  ascendingFrom?: (at: AtNode<T, R>) => unknown
  count?: number
}

// Leaves carry no `children` at all, so `T` can’t be constrained to
// `{ children?: Array<T> }` without TypeScript rejecting them.
const childrenOf = <T>(node: T) => (
  (node as { children?: Array<T> }).children
)

export async function walk<T extends object, R = unknown>(
  { tree, walker }: { tree: T, walker: Walker<T, R> }
) {
  const out: WalkOut<R> = {
    descendingTo: undefined,
    descendingFrom: null,
    ascendingFrom: null,
    ascendingTo: null,
    walk: null,
  }

  out.descendingTo = await walker.descendingTo?.({ root: tree, walker, out })
  for(const child of childrenOf(tree) ?? []) {
    out.descendingFrom = await walker.descendingFrom?.(
      { from: tree, to: child, walker, out }
    )

    out.walk = await walk({ tree: child, walker })

    out.ascendingTo = await walker.ascendingTo?.(
      { to: tree, from: child, walker, out }
    )
  }
  out.ascendingFrom = await walker.ascendingFrom?.({ root: tree, walker, out })

  return out
}

export function filter<T extends object>(
  { tree, fn }: { tree: T, fn: (node: T) => boolean }
): T {
  const children = childrenOf(tree)
  if(children == null) return tree
  return {
    ...tree,
    children: (
      children
      .filter(fn)
      .map((child) => filter({ tree: child, fn }))
    ),
  }
}

export function isDirNode(node?: Node | null): node is DirNode {
  if(node == null) return false
  return node.type === 'directory'
}

export function map2Obj(
  input: unknown
): Record<string, unknown> | Array<unknown> | unknown {
  if (Array.isArray(input)) {
    return input.map(map2Obj)
  }

  if (input instanceof Map || (typeof input === 'object')) {
    const obj: Record<string, unknown> = {}
    const entries = (
      input instanceof Map ? input.entries() : Object.entries(input ?? {})
    )
    for (const [key, value] of entries) {
      const stringKey = (
        typeof key === 'object'
      ) ? (
        key.label as string ?? JSON.stringify(key)
      ) : (
        String(key)
      )
      obj[stringKey] = map2Obj(value)
    }
    return obj
  }

  return input ?? null
}

/**
 * Turns a click into a local `path` update instead of a full navigation,
 * while leaving modified clicks (new tab, etc.) to the browser.
 */
export function navigateOnClick(
  { target, set }: {
    target: Array<string>
    set: (path: Array<string>) => void
  }
) {
  return (evt: MouseEvent) => {
    if(evt.defaultPrevented) return
    if(evt.button !== 0) return
    if(evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return
    evt.preventDefault()
    set(target)
  }
}

export function within(elem: HTMLElement, evt: MouseEvent) {
  const rect = elem.getBoundingClientRect()
  return (
    evt.clientX >= rect.left
    && evt.clientX <= rect.right
    && evt.clientY >= rect.top
    && evt.clientY <= rect.bottom
  )
}

export const fileOf = (entry: FileSystemFileEntry) => (
  new Promise<File>((res, rej) => entry.file(res, rej))
)
export const entriesOf = (reader: FileSystemDirectoryReader) => (
  new Promise<Array<FileSystemEntry>>((res, rej) => (
    reader.readEntries(res, rej)
  ))
)

type DroppableElement = HTMLElement & { dropSource?: Array<string> }
type FileSystemIntrospection = (
  FileSystemEntry | FileSystemHandle
)
type NewDataTransferItem = (
  DataTransferItem & {
    getAsEntry?: () => FileSystemEntry
    getAsFileSystemHandle?: () => Promise<FileSystemHandle>
  }
)

let drug: DroppableElement | null = null
let dropSource: Array<string> | null = null

export function dropGenerator(
  { path: currentPath }: { path: () => Array<string> }
) {
  async function process(
    entries: Array<FileSystemIntrospection> | null = null,
    destination: Array<string> = [],
  ) {
    const dispatch = (
      async (
        entry: FileSystemIntrospection | null,
        path: Array<string>,
      ) => {
        if(!entry) return

        const newPath = [...path, entry.name]
        // ToDo: Replace with filter functions that certify type
        if((entry as FileSystemEntry).isDirectory) {
          await readDirEntry(entry as FileSystemDirectoryEntry, newPath)
        } else if((entry as FileSystemHandle).kind === 'directory') {
          await readDirHandle(entry as FileSystemDirectoryHandle, newPath)
        } else {
          const file = await fileOf(entry as FileSystemFileEntry)
          if(settings.debugging) {
            console.debug({ Adding: { file, path } })
          }
          await addFiles({ files: [file], path })
        }
      }
    )

    async function readDirEntry(
      dir: FileSystemDirectoryEntry,
      path: Array<string>,
    ) {
      const reader = dir.createReader()

      const readBatch = async () => {
        const entries = await entriesOf(reader)
        if(entries.length === 0) return
        for(const entry of entries) {
          await dispatch(entry, path)
        }
        await readBatch()
      }
      await readBatch()
    }

    async function readDirHandle(
      dir: FileSystemDirectoryHandle,
      path: Array<string>,
    ) {
      console.warn({ 'Unimplmented readDirHandle': { dir, path } })
    }

    for(const entry of entries ?? []) {
      await dispatch(entry, destination)
    }
  }

  function target(node: HTMLElement) {
    const onDragOver = (
      (evt: MouseEvent) => {
        evt.preventDefault() // required for drop to a file
        ;(evt.target as HTMLElement)?.classList.add(
          'dragover', evt.ctrlKey ? 'cp' : 'mv',
        )
      }
    )
    const onDragLeave = (
      (evt: MouseEvent) => {
        (evt.target as HTMLElement)?.classList.remove(
          'dragover', 'cp', 'mv',
        )
      }
    )
    const onDrop = async (evt: DragEvent) => {
      evt.preventDefault()
      evt.stopPropagation()
      const items = (
        Array.from(evt.dataTransfer?.items ?? []) as Array<NewDataTransferItem>
      )
      const drop = {
        source: dropSource ? Array.from(dropSource) : null,
        destination: currentPath(),
        entries: await Promise.all(
          items
          .filter(({ kind }) => kind === 'file')
          .map(async (item) => (
            item.getAsEntry?.()
            ?? item.webkitGetAsEntry?.()
            ?? item.getAsFileSystemHandle?.()
            ?? null
          ))
          .filter(Boolean)
        ) as Array<FileSystemIntrospection>
,
      }

      if(drop.entries.length > 0) {
        await process(drop.entries, drop.destination)
        listing({ path: drop.destination }).refresh()
      } else {
        // Drag sources carry what they are, its id, & the Spot it
        // hangs from, as `data-kind`, `data-id`, & `data-from`.
        const { kind, id, from: parent } = drug?.dataset ?? {}
        const what = Number(id)
        const from = Number(parent)
        if(
          !['content', 'spot'].includes(kind ?? '')
          || Number.isNaN(what) || Number.isNaN(from)
        ) {
          throw new Error(
            `The dragged ${kind ?? 'item'} doesn’t say what it is`
            + ' or where it’s from.'
          )
        }
        if(!drop.source) {
          throw new Error('No source path for drop.')
        }
        const to = await spotId({ path: drop.destination })
        if(to == null) {
          throw new Error(
            `No Spot at /${drop.destination.join('/')} to drop into.`
          )
        }
        console.debug({ moving: { kind, what, from, to, drop } })
        const move = kind === 'content' ? moveContent : moveSpot
        await move({ what, from, to })
        listing({ path: drop.source }).refresh()
      }
      console.debug({ refreshing: drop.destination })
      listing({ path: drop.destination }).refresh()
    }

    node.addEventListener('dragover', onDragOver)
    node.addEventListener('dragleave', onDragLeave)
    node.addEventListener('drop', onDrop)
    return {
      destroy() {
        node.removeEventListener('dragover', onDragOver)
        node.removeEventListener('dragleave', onDragLeave)
        node.removeEventListener('drop', onDrop)
      },
    }
  }

  function source(node: HTMLElement) {
    const onDragStart = (evt: Event) => {
      drug = evt.target as DroppableElement
      dropSource = currentPath()
    }
    const onDragEnd = () => {
      dropSource = null
      drug = null
    }

    node.addEventListener('dragstart', onDragStart)
    node.addEventListener('dragend', onDragEnd)

    return {
      destroy() {
        node.removeEventListener('dragstart', onDragStart)
        node.removeEventListener('dragend', onDragEnd)
      },
    }
  }

  return { target, source }
}
