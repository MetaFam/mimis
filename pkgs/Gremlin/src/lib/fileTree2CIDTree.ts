import { kuboUpload } from '#lib/ipfs.js'
import settings from '#lib/settings.svelte.js'
import { isDirNode, walk } from '#lib'
import type { Node } from '../types'

export type CIDNode = (
  | {
    type: 'file'
    title: string
    size: number
    cid: string
    mimetype: string
  }
  | {
    type: 'directory'
    title: string
    children: Array<CIDNode>
  }
)

/**
 * Uploads every selected file to IPFS. The selected tree with each
 * file’s CID, or nothing if the root isn’t selected.
 */
export async function fileTreeToCIDTree(
  tree: Node, { log }: { log?: (msg: unknown) => void } = {},
) {
  const { descendingTo: cidTree } = await walk<Node, CIDNode>({
    tree,
    walker: {
      async descendingTo({ root, walker }) {
        if(settings.debugging) {
          log?.(`DescendingTo: ${root.title}`)
        }
        walker.count ??= 0
        walker.count++
        if(root.selected === false) return
        if(isDirNode(root)) {
          return { type: 'directory', title: root.title, children: [] }
        }
        const input = await root.handle?.getFile() ?? root.file
        if(!input) {
          throw new Error(`“${root.title}” has neither a handle nor a file.`)
        }
        const [{ cid }] = await kuboUpload({ files: [input] })
        return {
          type: 'file',
          title: root.title,
          size: root.size,
          cid: cid.toString(),
          mimetype: input.type,
        }
      },
      async ascendingTo({ to, from, out }) {
        if(settings.debugging) {
          log?.(`AscendingTo: ${to.title}, from: ${from.title}`)
        }
        const parent = out.descendingTo
        const child = out.walk?.descendingTo
        if(parent?.type === 'directory' && child != null) {
          parent.children.push(child)
        }
      },
    },
  })
  return cidTree
}
