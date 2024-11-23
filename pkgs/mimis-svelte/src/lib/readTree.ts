import ignore from 'ignore'
import type { GitIgnore, Node } from "../types"

let gitignores: Array<GitIgnore> = []

type Handles = (
  Array<FileSystemDirectoryHandle>
  | FileSystemDirectoryHandle
)

export const readTree = ({
  onStatusUpdate, dirs,
}: {
  onStatusUpdate: (msg: string) => void, dirs: Handles,
}) => {
  if(Array.isArray(dirs)) {
    return Promise.all(
      dirs.map(async (dir) => await read(dir))
    )
  } else if(dirs instanceof FileSystemDirectoryHandle) {
    return read(dirs)
  } else {
    throw new Error('Invalid Input: `dirs`')
  }

  async function read(
    dir: FileSystemDirectoryHandle,
    path: string = '',
  ) {
    try {
      const gitignore = await (
        dir.getFileHandle('.gitignore')
      )
      if(gitignore) {
        const ig = ignore()
        const file = await gitignore.getFile()
        ig.add((await file.text()).split('\n'))
        gitignores.push({ ig, path })
      }
    } catch(e) {}

    const current = `${path}${dir.name}/`
    onStatusUpdate?.(`Traversing: ${current}`)

    const here: Node = {
      type: 'directory',
      title: dir.name,
      children: [],
    }

    for await (const handle of dir.values()) {
      const next = `${current}${handle.name}`
      if(gitignores.some(gi => gi.ig.ignores(next))) {
        onStatusUpdate?.(`Ignoring: ${next}`)
        continue
      }
      if(handle.kind === 'directory') {
        const node = (
          await read(handle, current)
        )
        here.children?.push(node)
      } else {
        onStatusUpdate?.(`Leaf: ${next}`)

        const node: Node = {
          type: 'file',
          title: handle.name,
          handle,
        }
        here.children?.push(node)
      }
    }

    gitignores = gitignores.filter((gi) => (gi.path.length > path.length))

    return here
  }
}