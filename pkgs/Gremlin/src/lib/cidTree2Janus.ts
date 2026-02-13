import { createSpot } from '$lib/createSpot.remote.ts'
import { addFiles } from '$lib/addFiles.remote.ts'
import { walk } from '$lib'
import type { TreeNode } from '$lib/fileTree2CIDTree.ts'

export async function cidTreeToJanus(
  { tree, containerId: rootId }: { tree: TreeNode, containerId: number }
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
            console.debug({ Adding: walker.path, rootId, containerId })
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