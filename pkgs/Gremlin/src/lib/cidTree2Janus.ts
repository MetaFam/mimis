import { addFiles } from '#lib/remotes/addFiles.remote.js'
import { walk, metricize, toHTTP } from '#lib'
import type { CIDNode } from '#lib/fileTree2CIDTree.js'

/**
 * Adds each file in `tree` below the Spot at `path`, creating the
 * Spots along the way.
 */
export async function cidTreeToJanus(
  { tree, path: base, log }:
  { tree: CIDNode, path: Array<string>, log?: (msg: unknown) => void }
) {
  const path = [...base]
  let count = 0
  await walk({
    tree,
    walker: {
      async descendingTo({ root }) {
        if(root.type === 'file') {
          await addFiles({ path: [...path], files: [{
            cid: root.cid,
            name: root.title,
            type: root.mimetype,
            size: root.size,
          }] })
          count++
          log?.(
            `Adding #${String(count).padStart(4, '0')} ${path.join('/')}/`
            + `<a href="${toHTTP({ cid: root.cid })}" target="_blank">`
            + root.title
            + `</a> (${metricize(root.size)}).`
          )
        }
        path.push(root.title)
      },
      ascendingFrom() {
        path.pop()
      },
    },
  })
  log?.('Done Adding.')
}
