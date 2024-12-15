import { CarBlockIterator } from '@ipld/car'
import type { Node, DirNode } from '../types'
import { stream2AsyncIterator } from './stream2AsyncIterator'
import { decode } from '@ipld/dag-pb'

export async function car2Tree(file: File) {
  const reader = await CarBlockIterator.fromIterable(
    stream2AsyncIterator(file.stream())
  )

  const blocks: Array<string> = []
  const files: Array<string> = []
  const nodes: Record<string, Array<Node>> = {}
  let last: string | null = null

  for await (const { cid, bytes } of reader) {
    last = cid.toString()
    const decoded = await decode(bytes)
    const { Links: raw } = decoded
    if(raw.length === 0) {
      blocks.push(cid.toString())
      continue
    }
    if(raw.every(({ Name }) => Name === '')) {
      files.push(cid.toString())
      continue
    }
    const formatted = raw.map(({ Name, Tsize, Hash }) => ({
      name: Name, size: Tsize, cid: Hash.toString()
    }))
    nodes[cid.toString()] = formatted.map((link) => {
      const type = (
        files.includes(link.cid) || blocks.includes(link.cid)
        ? 'file' : 'directory'
      )
      const next = ({
        type,
        title: link.name ?? `Unknown ${type}`,
        size: link.size ?? 0,
        cid: link.cid,
      })
      if(type === 'directory') {
        const childs = (
          (next as DirNode).children = nodes[link.cid]
        )

        const counts = childs.map(
          ({ childCount = 0 }) => childCount
        )
        ;(next as DirNode).childCount = counts.reduce(
          (a, b) => a + b, childs.length,
        )
      }
      return next as Node
    })
  }
  if(!last) throw new Error('No nodes found.')
  return nodes[last]
}