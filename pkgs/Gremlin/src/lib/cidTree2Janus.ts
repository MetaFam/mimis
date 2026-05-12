import { upsertSpot } from './remotes/upsertSpot.remote.ts'
import { addFiles } from '$lib/remotes/addFiles.remote.ts'
import { walk, metricize, toHTTP } from '$lib'
import type { TreeNode } from '$lib/fileTree2CIDTree.ts'

export async function cidTreeToJanus(
  { tree, containerId: rootId, log }:
  { tree: TreeNode, containerId: number, log?: (msg: unknown) => void | null }
) {
  const out = await walk({
    tree,
    walker: {
      async descendingTo({ root, walker }) {
        walker.path ??= []
        walker.index ??= 0
        walker.index++
        if(root.type === 'file') {
          (await upsertSpot(
            { path: walker.path, containerId: rootId }
          )).next()
          await addFiles({ traversal, files: [{
            cid: root.cid,
            name: root.title,
            type: root.mimetype,
            size: root.size,
          }] })
          console.debug({ Postadd: root })
          const msg = (
          `Adding #${String(walker.index).padStart(4, '0')} ${walker.path.join('/')}/`
            + `<a href="${toHTTP({ cid: root.cid })}" target="_blank>`
            + root.title
            + `</a> (${metricize(root.size)}).`
          )
          console.debug({ msg })
          log?.(msg)
        }
        walker.path.push(root.title)
      },
      async ascendingFrom({ walker }) {
        walker.path?.pop()
      },
    }
  })
  log?.('Done Adding.')
  return out
}