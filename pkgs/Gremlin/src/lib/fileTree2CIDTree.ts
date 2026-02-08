import type { MaybePromise } from 'viem'
import { kuboUpload } from '$lib/ipfs'
import { isDirNode, walk, type WalkOut } from '$lib'
import type { Node } from '../types.ts'

export type OneTimeWalkFunction = (
  ({ root, walker, out }:
    { root: Node, walker: Walker, out: WalkOut }) => (
    MaybePromise<unknown>
  )
)
export type LoopedWalkFunction = (
  (
    { from, to, walker, out }:
    { from: Node, to: Node, walker: Walker, out: WalkOut }
  ) => MaybePromise<unknown>
)

export interface Walker {
  descendingTo?: OneTimeWalkFunction
  descendingFrom?: LoopedWalkFunction
  ascendingTo?: LoopedWalkFunction
  ascendingFrom?: OneTimeWalkFunction
  count?: number
}

export interface FileWalker extends Walker {
  rootAt: Record<string, Node>
  path?: string
}

export async function fileTreeToCIDTree(tree: Node) {
  return (
    await walk({
      tree,
      walker: {
        rootAt: {},
        async descendingFrom(
          { from, to }
        ) {
          console.debug({ DescendingFrom: from.title, to: to.title })
        },
        async descendingTo(
          { root, walker }
        ) {
          console.debug({ Visiting: root.title })
          walker.count ??= 0
          walker.path ??= ''
          walker.count++
          const { path } = walker
          const { handle, file, children, ...rest } = root
          const newPath = `${path ? path : ''}/${root.title}`
          const out = { ...rest, path: newPath }
          if(
            handle instanceof FileSystemFileHandle
            || file instanceof File
          ) {
            if(!(handle ?? file)) {
              throw new Error('No handle found to leverage.')
            }
            const [{ cid }] = await kuboUpload(
              { files: [(handle ? (
                await (handle as FileSystemFileHandle).getFile()
              ) : file)] }
            )
            out.cid = cid.toString()
          } else if(handle == null && isDirNode(root)) {
            // Do nothing
          } else {
            console.warn(
              `¿What are you? Well: ${typeof handle} / ${typeof file}`
            )
          }
          if((walker as FileWalker).rootAt[newPath]) {
            throw new Error(`Path collision at ${newPath}.`)
          }
          walker.rootAt[newPath] = out
          console.debug({ Leaving: root.title, out })
          return out
        },
      },
    })
  )
}
