import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import type { DirNode, FileNode, Node } from '../types'

const { addFilesRemote, kuboUpload } = vi.hoisted(() => ({
  addFilesRemote: vi.fn(async () => []),
  kuboUpload: vi.fn(),
}))

vi.mock('#lib/remotes/addFiles.remote.js', () => ({ addFiles: addFilesRemote }))
vi.mock('#lib/remotes/moveSpot.remote.js', () => ({ moveSpot: vi.fn() }))
vi.mock('#lib/remotes/moveContent.remote.js', () => ({ moveContent: vi.fn() }))
vi.mock('#lib/remotes/listing.remote.js', () => ({ listing: vi.fn() }))
vi.mock('#lib/remotes/spotId.remote.js', () => ({ spotId: vi.fn() }))
vi.mock('#lib/ipfs.js', () => ({ addFiles: vi.fn(), kuboUpload }))

const { walk, filter } = await import('#lib')
const { fileTreeToCIDTree } = await import('#lib/fileTree2CIDTree.js')
const { cidTreeToJanus } = await import('#lib/cidTree2Janus.js')

const cidOf = async (file: File) => (
  CID.create(
    1,
    raw.code,
    await sha256.digest(new Uint8Array(await file.arrayBuffer())),
  )
)

const fileNode = (
  title: string, content: string, extra: Partial<FileNode> = {},
): FileNode => ({
  type: 'file',
  title,
  size: content.length,
  childCount: 0,
  file: new File([content], title, { type: 'text/plain' }),
  ...extra,
})

const dirNode = (
  title: string, children: Array<Node>, extra: Partial<DirNode> = {},
): DirNode => ({
  type: 'directory',
  title,
  size: 0,
  childCount: children.length,
  children,
  ...extra,
})

beforeEach(() => {
  addFilesRemote.mockClear()
  kuboUpload.mockReset()
  kuboUpload.mockImplementation(async ({ files }: { files: Array<File> }) => (
    Promise.all(files.map(async (file) => ({ cid: await cidOf(file) })))
  ))
})

describe('walk', () => {
  type T = { name: string, children?: Array<T> }
  const tree: T = {
    name: 'a',
    children: [
      { name: 'b', children: [{ name: 'c' }] },
      { name: 'd' },
    ],
  }

  it('descends pre-order, ascends post-order, & steps between each pair', async () => {
    const events: Array<string> = []
    await walk<T>({
      tree,
      walker: {
        descendingTo: ({ root }) => { events.push(`↓${root.name}`) },
        descendingFrom: ({ from, to }) => { events.push(`${from.name}→${to.name}`) },
        ascendingTo: ({ to, from }) => { events.push(`${from.name}⇢${to.name}`) },
        ascendingFrom: ({ root }) => { events.push(`↑${root.name}`) },
      },
    })
    expect(events).toEqual([
      '↓a', 'a→b', '↓b', 'b→c', '↓c', '↑c', 'c⇢b', '↑b', 'b⇢a',
      'a→d', '↓d', '↑d', 'd⇢a', '↑a',
    ])
  })

  it('hands each parent its latest child’s `descendingTo` result', async () => {
    const seen: Array<[string, string | undefined]> = []
    const out = await walk<T, string>({
      tree,
      walker: {
        descendingTo: ({ root }) => root.name.toUpperCase(),
        ascendingTo: ({ to, out }) => {
          seen.push([to.name, out.walk?.descendingTo])
        },
      },
    })
    expect(out.descendingTo).toBe('A')
    expect(seen).toEqual([['b', 'C'], ['a', 'B'], ['a', 'D']])
  })

  it('visits a lone leaf once', async () => {
    const visit = vi.fn()
    await walk<T>({ tree: { name: 'x' }, walker: { descendingTo: visit } })
    expect(visit).toHaveBeenCalledOnce()
  })
})

describe('filter', () => {
  it('drops failing nodes at every depth & keeps leaves as they are', () => {
    const tree = dirNode('root', [
      dirNode('keep', [
        fileNode('in.txt', 'in'),
        fileNode('out.txt', 'out', { selected: false }),
      ]),
      dirNode('drop', [fileNode('x.txt', 'x')], { selected: false }),
    ])
    const kept = filter<Node>({
      tree,
      fn: (node) => node.selected !== false,
    }) as DirNode
    expect(kept.children.map(({ title }) => title)).toEqual(['keep'])
    const [keep] = kept.children as Array<DirNode>
    expect(keep.children.map(({ title }) => title)).toEqual(['in.txt'])
    expect(tree.children).toHaveLength(2)
  })

  it('returns a leaf unchanged', () => {
    const leaf = fileNode('a.txt', 'a')
    expect(filter<Node>({ tree: leaf, fn: () => false })).toBe(leaf)
  })
})

describe('fileTreeToCIDTree', () => {
  it('uploads selected files & nests them under their directories', async () => {
    const one = fileNode('one.txt', 'one')
    const two = fileNode('ŧwø ✨.txt', 'two')
    const cidTree = await fileTreeToCIDTree(
      dirNode('root', [one, dirNode('sub', [two])])
    )
    expect(cidTree).toEqual({
      type: 'directory',
      title: 'root',
      children: [
        {
          type: 'file',
          title: 'one.txt',
          size: 3,
          cid: (await cidOf(one.file!)).toString(),
          mimetype: 'text/plain',
        },
        {
          type: 'directory',
          title: 'sub',
          children: [{
            type: 'file',
            title: 'ŧwø ✨.txt',
            size: 3,
            cid: (await cidOf(two.file!)).toString(),
            mimetype: 'text/plain',
          }],
        },
      ],
    })
  })

  it('leaves out deselected files & directories', async () => {
    const cidTree = await fileTreeToCIDTree(dirNode('root', [
      fileNode('no.txt', 'no', { selected: false }),
      dirNode('gone', [fileNode('in-gone.txt', 'g')], { selected: false }),
      fileNode('yes.txt', 'yes'),
    ]))
    expect(cidTree?.type).toBe('directory')
    expect(
      cidTree?.type === 'directory' && cidTree.children.map(({ title }) => title)
    ).toEqual(['yes.txt'])
  })

  it('returns nothing when the root is deselected', async () => {
    expect(
      await fileTreeToCIDTree(dirNode('root', [], { selected: false }))
    ).toBeUndefined()
  })

  it('reads a file from its handle when it has one', async () => {
    const file = new File(['handled'], 'h.txt', { type: 'text/plain' })
    const handle = { getFile: async () => file } as FileSystemFileHandle
    const cidTree = await fileTreeToCIDTree(dirNode('root', [
      fileNode('h.txt', 'handled', { file: undefined, handle }),
    ]))
    expect(cidTree?.type === 'directory' && cidTree.children[0]).toMatchObject(
      { cid: (await cidOf(file)).toString() }
    )
  })

  it('throws on a file with neither a handle nor a file', async () => {
    await expect(fileTreeToCIDTree(dirNode('root', [
      fileNode('ghost.txt', '', { file: undefined }),
    ]))).rejects.toThrow('“ghost.txt” has neither a handle nor a file.')
  })
})

describe('cidTreeToJanus', () => {
  it('adds each file below the base path, through its directories', async () => {
    const log = vi.fn()
    await cidTreeToJanus({
      path: ['media', 'böoks'],
      log,
      tree: {
        type: 'directory',
        title: 'import',
        children: [
          { type: 'file', title: 'a.txt', size: 1, cid: 'bafyA', mimetype: 'text/plain' },
          {
            type: 'directory',
            title: 'sub dir',
            children: [
              { type: 'file', title: 'b.png', size: 2, cid: 'bafyB', mimetype: '' },
            ],
          },
          { type: 'file', title: 'c.txt', size: 3, cid: 'bafyC', mimetype: 'text/plain' },
        ],
      },
    })
    expect(addFilesRemote.mock.calls).toEqual([
      [{
        path: ['media', 'böoks', 'import'],
        files: [{ cid: 'bafyA', name: 'a.txt', type: 'text/plain', size: 1 }],
      }],
      [{
        path: ['media', 'böoks', 'import', 'sub dir'],
        files: [{ cid: 'bafyB', name: 'b.png', type: '', size: 2 }],
      }],
      [{
        path: ['media', 'böoks', 'import'],
        files: [{ cid: 'bafyC', name: 'c.txt', type: 'text/plain', size: 3 }],
      }],
    ])
    expect(log).toHaveBeenLastCalledWith('Done Adding.')
    expect(log.mock.calls[1][0]).toMatch(/^Adding #0002 media\/böoks\/import\/sub dir\//)
  })

  it('adds nothing for an empty directory', async () => {
    await cidTreeToJanus({
      path: [],
      tree: { type: 'directory', title: 'empty', children: [] },
    })
    expect(addFilesRemote).not.toHaveBeenCalled()
  })
})
