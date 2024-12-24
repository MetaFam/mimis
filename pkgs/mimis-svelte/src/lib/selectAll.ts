import type { Node, DirNode } from '../types'

/** Add a `selected = true` attribute to every node in a tree. */
export function selectAll(roots: Array<Node>) {
  const select = (node: Node) => {
    node.selected = true
    for(const child of (node as DirNode).children ?? []) {
      select(child)
    }
    return node
  }
  return roots.map((root) => select(root))
}