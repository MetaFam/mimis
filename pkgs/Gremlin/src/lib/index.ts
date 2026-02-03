import { settings } from '$lib/settings.svelte.ts'
import type { Node, DirNode } from '../types'
import type { Walker } from "./fileTree2CIDTree.ts";

export function toHTTP({
  url, cid,
}: {
  url?: string | null; cid?: string | null;
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

export function throwError(test: unknown) {
  if(isError(test)) {
    throw new Error(test.error || '¡Unknown Error!')
  }
  return test
}

export function isError(maybe: unknown): maybe is { error: string } {
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

export function metricise(size: number) {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  let adjustedSize = size
  let unitIndex = 0
  while(adjustedSize >= 1024 && unitIndex++ < units.length - 1) {
    adjustedSize /= 1024
  }
  return `${adjustedSize.toLocaleString()}${units[unitIndex]}`
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

export function walk(
  { tree, walker }: { tree: Node, walker: Walker }
) {
  const out: {
    descendingTo: unknown
    descendingFrom: unknown
    ascendingFrom: unknown
    ascendingTo: unknown
  } = {
    descendingTo: null,
    descendingFrom: null,
    ascendingFrom: null,
    ascendingTo: null,
  }
  out.descendingTo = walker.descendingTo?.({ root: tree, walker })
  for(const child of (tree as DirNode).children ?? []) {
    out.descendingFrom = walker.descendingFrom?.(
      { from: tree, to: child, walker }
    )
    walk({ tree: child, walker })
    out.ascendingTo = walker.ascendingTo?.(
      { to: tree, from: child, walker }
    )
  }
  out.ascendingFrom = walker.ascendingFrom?.({ root: tree, walker })
  return out
}

export function filter(
  { tree, fn }: { tree: Node, fn: (node: Node) => boolean }
): Node | null {
  if(!fn(tree)) return null
  if(isDirNode(tree)) {
    const newNode = { ...tree }
    newNode.children = tree.children.filter(fn)
    return newNode
  }
  return tree
}

export function isDirNode(node?: Node | null): node is DirNode {
  if(node == null) return false
  return node.type === 'directory'
}