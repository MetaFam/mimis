import type { MaybePromise } from 'viem'
import { kuboUpload } from '$lib/ipfs'
import settings from '$lib/settings.svelte.ts'
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
        async descendingTo({ root, walker, out }) {
          if(settings.debugging) {
            console.debug({ DescendingTo: root.title, out: { ...out } })
          }
          walker.count ??= 0
          walker.count++
          const { handle, file, children, ...rest } = root
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
            return (
              { ...rest, cid: cid.toString() }
            )
          } else if(isDirNode(root)) {
            if(out.descendingTo) {
              console.warn('`descendingTo` already set.')
            }
            return { ...rest, children: [] }
          } else {
            console.warn(
              `¿What are you? Well: ${typeof handle} / ${typeof file}`
            )
          }
        },
        async ascendingTo({ to, from, out }) {
          if(settings.debugging) {
            console.debug({
              AscendingTo: to.title, from: from.title, out: { ...out },
            })
          }
          if(Array.isArray(out.descendingTo?.children)) {
            out.descendingTo.children.push(out.walk.descendingTo)
          } else {
            console.warn('`out.descendingTo.children` is not an array.')
          }
        },
      }
    })
  )
}
