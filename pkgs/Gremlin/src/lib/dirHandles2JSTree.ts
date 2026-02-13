import ignore from 'ignore'
import type {
  Logger, DirNode, GitIgnore, Node,
} from '../types'

// const ignore = ignoreModule.default

let gitignores: Array<GitIgnore> = []

type Handle = FileSystemDirectoryHandle

/**
 * Walk a directory tree using a file handle from the browser,
 * and generate a structure appropriate for generating a
 * Wunderbaum tree.
 */
export const spiderDirHandles = ({
  log, dir, gitignores: ignores = true,
}: {
  log?: Logger
  dir?: Handle
  gitignores?: boolean
}) => {
  if(!dir) return dir
  return read(dir)

  async function read(
    dir: FileSystemDirectoryHandle,
    path: string = '',
  ) {
    const current = `${path}${dir.name}/`
    log?.(`Traversing: ${current}`)

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
      } catch(error) {
        console.error({ error })
      }
    }

    const here: DirNode = {
      type: 'directory',
      title: dir.name,
      children: [],
      size: 0,
      childCount: 0,
      get selected() {
        const selecteds = this.children?.some((c) => c.selected)
        const unselecteds = this.children?.some((c) => c.selected === false)

        if(selecteds && unselecteds) return null
        return selecteds
      },
      set selected(value: boolean | null) {
        if(value != null) {
          this.children?.forEach((c) => { c.selected = value })
        }
      },
    }

    type Handle = (
      FileSystemDirectoryHandle | FileSystemFileHandle
    )

    for await (const handle of (
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
            log?.(`Ignoring: ${next}`)
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
          log?.(`Leaf: ${next}`)

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