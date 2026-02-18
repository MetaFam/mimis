import { createSpot } from '$lib/createSpot.remote.ts'
import { addFiles } from '$lib/addFiles.remote.ts'
import { walk, metricize, toHTTP } from '$lib'
import type { TreeNode } from '$lib/fileTree2CIDTree.ts'

export async function cidTreeToJanus(
  { tree, containerId: rootId, log }:
  { tree: TreeNode, containerId: number, log?: (msg: unknown) => void | null }
) {
   return (
    await walk({
      tree,
      walker: {
        async descendingTo({ root, walker }) {
          walker.path ??= []
          if(root.type === 'file') {
            const containerId = await createSpot(
              { path: walker.path, containerId: rootId }
            )
            await addFiles({ containerId, files: [{
              cid: root.cid,
              name: root.title,
              type: root.mimetype,
              size: root.size,
            }] })
            log?.(
              `Adding @ ${walker.path.join('/')}`
              + ` <a href="${toHTTP({ cid: root.cid })}" target="_blank>${root.title}</a> (${metricize(root.size)}).`
            )
          }
          walker.path.push(root.title)
        },
        async ascendingFrom({ walker }) {
          walker.path?.pop()
        },
      }
    })
  )
}