import type { Node, DirNode } from '../types'

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