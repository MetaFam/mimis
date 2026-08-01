import { CID } from 'multiformats'
import { settings } from '$lib/settings.svelte'
import type { TreeNode, Walker } from '$lib/fileTree2CIDTree'
import { moveSpot } from '$lib/remotes/moveSpot.remote'
import { searchFor } from '$lib/remotes/searchFor.remote'
import { spotId } from '$lib/remotes/spotId.remote'
import type { Node, DirNode } from '../types.ts'
import { addFiles } from './ipfs.ts'

export function viewable(extension?: string) {
  return (
    ['svg', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'mp4']
    .includes(extension ?? '')
  )
}

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

export function throwError(test: unknown) {
  if(isError(test)) {
    throw new Error(test.error || '¡Unknown Error!')
  }
  return test
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

export interface WalkOut {
  descendingTo: unknown
  descendingFrom: unknown
  ascendingFrom: unknown
  ascendingTo: unknown
  walk: unknown
}

export async function walk(
  { tree, walker }: { tree: TreeNode, walker: Walker }
) {
  const out: WalkOut = {
    descendingTo: null,
    descendingFrom: null,
    ascendingFrom: null,
    ascendingTo: null,
    walk: null,
  }

  out.descendingTo = await walker.descendingTo?.({ root: tree, walker, out })
  for(const child of tree.children ?? []) {
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

export function filter(
  { tree, fn }: { tree: TreeNode, fn: (node: TreeNode) => boolean }
): TreeNode {
  if(tree.children != null) {
    return ({
      ...tree,
      children: (
        tree.children
        .filter(fn)
        .map((child: TreeNode) => filter({ tree: child, fn }))
      )
    })
  }
  return tree
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

export function within(elem: HTMLElement, evt: MouseEvent) {
  const rect = elem.getBoundingClientRect()
  return (
    evt.clientX >= rect.left
    && evt.clientX <= rect.right
    && evt.clientY >= rect.top
    && evt.clientY <= rect.bottom
  )
}

let dragging: HTMLElement | null = null
export function dropTargetGenerator(
  { path }: { path: Array<string> }
) {
  return function dropTarget(node: HTMLElement) {
    const onDragOver = (
      // required for drop to fire
      (evt: DragEvent) => evt.preventDefault()
    )
    const onDrop = async (evt: DragEvent) => {
      evt.preventDefault()
      const [what, to] = [dragging, node].map((n) => n?.dataset.id)
      if(evt.dataTransfer?.files && evt.dataTransfer.files.length > 0) {
        const dispatch = (
          async (entry: FileSystemEntry | null, path: Array<string>) => {
            if(!entry) return

            if(entry.isDirectory) {
              await readDir(
                entry as FileSystemDirectoryEntry,
                [...path, entry.name],
              )
            } else {
              await (entry as FileSystemFileEntry).file(
                async (file) => {
                  if(settings.debugging) {
                    console.debug({ Adding: { file, path } })
                  }
                  await addFiles({ files: [file], path })
                }
              )
            }
          }
        )

        async function readDir(
          dir: FileSystemDirectoryEntry,
          path: Array<string>,
        ) {
          const reader = dir.createReader()

          const readBatch = async () => await reader.readEntries(
            async (entries) => {
              if(entries.length === 0) return
              for(const entry of entries) {
                await dispatch(entry, [...path, entry.name])
              }
              await readBatch()
            }
          )
          await readBatch()
        }

        for (const item of evt.dataTransfer.items) {
          await dispatch(item.webkitGetAsEntry(), path)
        }
      } else {
        await moveSpot({
          what: Number(what),
          from: await spotId({ path }),
          to: Number(to),
        })
      }
      await searchFor({ path }).refresh()
    }

    const onDragStart = (evt: DragEvent) => {
      dragging = evt.target as HTMLElement
    }

    node.addEventListener('dragover', onDragOver)
    node.addEventListener('drop', onDrop)
    node.addEventListener('dragstart', onDragStart)
    return {
      destroy() {
        node.removeEventListener('dragover', onDragOver)
        node.removeEventListener('drop', onDrop)
        node.removeEventListener('dragstart', onDragStart)
      },
    }
  }
}