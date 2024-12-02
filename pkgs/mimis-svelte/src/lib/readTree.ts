import ignore from 'ignore'
import type { DirNode, GitIgnore, Node } from "../types"

let gitignores: Array<GitIgnore> = []

type Handles = (
  Array<FileSystemDirectoryHandle>
  | FileSystemDirectoryHandle
)

export const readTree = ({
  onStatusUpdate, dirs, gitignores: ignores = true,
}: {
  onStatusUpdate: (msg: string) => void
  dirs: Handles
  gitignores?: boolean
}) => {
  if(!Array.isArray(dirs)) {
    dirs = [dirs]
  }
  return Promise.all(
    dirs.map(async (dir) => (await read(dir)))
  )

  async function read(
    dir: FileSystemDirectoryHandle,
    path: string = '',
  ) {
    const current = `${path}${dir.name}/`
    onStatusUpdate?.(`Traversing: ${current}`)

    if(ignores) {
      try {
        if(gitignores.length === 0) {
          const defaults = ignore()
          defaults.add(['**/.git'])
          gitignores.push({ ig: defaults, path: current })
        }

        const gitignore = await (
          dir.getFileHandle('.gitignore')
        )
        if(gitignore) {
          const ig = ignore()
          const file = await gitignore.getFile()
          const patterns = (
            (await file.text()).split(/\s*\n\s*/m)
          )
          ig.add(patterns)
          gitignores.push({ ig, path: current })
        }
      } catch(e) {}
    }

    const here: DirNode = {
      type: 'directory',
      title: dir.name,
      children: [],
      size: 0,
      childCount: 0,
    }

    type Handle = (
      FileSystemDirectoryHandle
      | FileSystemFileHandle
    )

    handles: for await (const handle of (
      dir as unknown as { values: () => Array<Handle> }
    ).values()) {
      const next = `${current}${handle.name}`
      const ignored = gitignores.some((gi) => {
        if(!next.startsWith(gi.path)) {
          throw new Error(
            `Invalid Path: "${next}", doesn't start with "${gi.path}".`
          )
        }
        const short = next.substring(gi.path.length)
        if(short !== '') {
          if(
            gi.ig.ignores(short)
            || gi.ig.ignores(short.replace(/^\/+/, ''))
            || (
              handle.kind === 'directory'
              && gi.ig.ignores(`${short}/`)
            )
           ) {
            onStatusUpdate?.(`Ignoring: ${next}`)
            return true
          }
        }
      })

      if(!ignored) {
        let node
        if(handle.kind === 'directory') {
          node = (
            await read(handle, current)
          )
          here.childCount += node.childCount
        } else {
          onStatusUpdate?.(`Leaf: ${next}`)

          const file = await handle.getFile()
          node = {
            type: 'file',
            title: handle.name,
            size: file.size,
            handle,
          }
          here.childCount += 1
        }
        if(node) {
          here.size += node.size
          here.children?.push(node as Node)
        }
      }

    }

    gitignores = gitignores.filter(
      (gi) => (gi.path.length < current.length)
    )

    return here
  }
}