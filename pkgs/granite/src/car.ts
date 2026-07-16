import { createReadStream, createWriteStream } from 'node:fs'
import { rename, rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import {
  asNode,
  asUpdate,
  decode,
  CID,
  type NodeDoc,
  type UpdateDoc,
} from './codec.ts'
import { MalformedDocumentError, UnreachableNodeError } from './errors.ts'
import { addressOf } from './keys.ts'
import { fileLeaf, importFiles, type Kubo } from './files.ts'
import { writeTree, writeUpdate, type Tree } from './publish.ts'
import { selectedFiles, selectedStats, type SpiderEntry } from './spider.ts'
import type { Blockstore } from './store.ts'
import type { Registry } from './registry.ts'
import type { CacheView } from './resolve.ts'

// ————— Assembly: selection → tree → update → CAR (US1) —————

// A directory materializes when it holds any selected file (paths to
// selections always exist) or was itself explicitly selected (a chosen
// empty directory is kept, not silently dropped).
const materializes = (entry: SpiderEntry): boolean => (
  entry.selected
  || (entry.children ?? []).some((child) => (
    child.kind === 'file' ? child.selected : materializes(child)
  ))
)

const buildTree = (contents: Map<string, CID>, entry: SpiderEntry): Tree => {
  const edges: NonNullable<Tree['edges']> = {}
  for(const child of entry.children ?? []) {
    if(child.kind === 'file' && child.selected) {
      const content = contents.get(child.path)
      if(!content) {
        throw new Error(`import returned no content CID for ${child.path}`)
      }
      edges[child.name] = {
        child: { data: fileLeaf(content, child.size, child.name) },
      }
    } else if(child.kind === 'dir' && materializes(child)) {
      edges[child.name] = {
        child: buildTree(contents, child),
      }
    }
  }
  return { edges }
}

export type SpiderPorts = {
  kubo: Kubo,
  store: Blockstore,
  registry?: Registry,
  key: `0x${string}`,
  warn?: (message: string) => void,
}

export type Archived = {
  car: string,
  update: CID,
  root: CID,
  prev?: CID,
  files: number,
  bytes: number,
}

export const archiveSelection = async (
  { kubo, store, registry, key, warn }: SpiderPorts,
  dir: string,
  root: SpiderEntry,
  out?: string,
): Promise<Archived> => {
  const { files, bytes } = selectedStats(root)
  if(files === 0) {
    throw new Error('selection is empty — refusing to write an empty archive')
  }
  const selection = selectedFiles(root)
  const imported = await importFiles(kubo, selection.map(({ path }) => `${dir}/${path}`))
  const contents = new Map(selection.map(({ path }) => {
    const content = imported.get(`${dir}/${path}`)
    if(!content) {
      throw new Error(`import returned no content CID for ${path}`)
    }
    return [path, content] as const
  }))
  const tree = buildTree(contents, root)
  const rootCid = await writeTree(store, tree)
  const publisher = addressOf(key)
  // Chaining degrades gracefully (research.md R6): unreachable registry
  // ⇒ chainless update plus a warning, never a failed spider.
  let prev: CID | undefined
  if(registry) {
    try {
      prev = await registry.latest(publisher)
    } catch(cause) {
      warn?.(`registry unreachable — generating a chainless update (${cause})`)
    }
  } else {
    warn?.('no registry configured — generating a chainless update')
  }
  const update = await writeUpdate(store, {
    publisher,
    root: rootCid,
    ...(prev ? { prev } : {}),
    at: Math.floor(Date.now() / 1000),
  })
  // One recursive pin protects the update's whole closure (tree nodes
  // and file content were written unpinned for speed, SC-001).
  await kubo.pin.add(update, { recursive: true })
  const car = out ?? `${root.name}-${update.toString().slice(0, 9)}.car`
  const partial = `${car}.partial`
  try {
    await pipeline(
      Readable.from(kubo.dag.export(update)),
      createWriteStream(partial),
    )
    await rename(partial, car)
  } catch(cause) {
    await rm(partial, { force: true })
    throw cause
  }
  return {
    car,
    update,
    root: rootCid,
    ...(prev ? { prev } : {}),
    files,
    bytes,
  }
}

// ————— Validation & load (US2) —————

// Offline block access (research.md R3): "missing from the archive" must
// surface as an immediate, nameable failure — never a network search.
export type LoadPorts = {
  getBlock(cid: CID): Promise<Uint8Array>,
  hasContent(cid: CID): Promise<number>,
}

export type Validated = {
  update: UpdateDoc,
  blocks: number,
  nodes: Map<string, NodeDoc>,
}

const decodeBlock = (cid: CID, bytes: Uint8Array): unknown => {
  try {
    return decode(bytes)
  } catch {
    throw new MalformedDocumentError(cid.toString(), '(document)', 'not decodable as dag-cbor')
  }
}

export const validateArchive = async (ports: LoadPorts, root: CID): Promise<Validated> => {
  const update = asUpdate(root, decodeBlock(root, await ports.getBlock(root)))
  const nodes = new Map<string, NodeDoc>()
  let blocks = 1
  const walkNode = async (cid: CID): Promise<void> => {
    if(nodes.has(cid.toString())) {
      return
    }
    const node = asNode(cid, decodeBlock(cid, await ports.getBlock(cid)))
    nodes.set(cid.toString(), node)
    blocks += 1
    const content = CID.asCID(node.data?.content)
    if(content) {
      blocks += await ports.hasContent(content)
    }
    for(const edge of Object.values(node.edges)) {
      await walkNode(edge.child)
    }
    for(const mount of node.mounts) {
      const source = CID.asCID(mount.source)
      if(source) {
        await walkNode(source)
      }
    }
  }
  await walkNode(update.root)
  return { update, blocks, nodes }
}

export const kuboLoadPorts = (kubo: Kubo): LoadPorts => ({
  getBlock: async (cid) => {
    try {
      return await kubo.block.get(cid, { offline: true } as Parameters<typeof kubo.block.get>[1])
    } catch(cause) {
      throw new UnreachableNodeError(cid.toString(), cause)
    }
  },
  hasContent: async (cid) => {
    let count = 1
    try {
      await kubo.block.get(cid, { offline: true } as Parameters<typeof kubo.block.get>[1])
      const options = {
        recursive: true,
        unique: true,
        offline: true,
      } as Parameters<typeof kubo.refs>[1]
      for await(const result of kubo.refs(cid, options)) {
        if(result.err) {
          throw result.err
        }
        count += 1
      }
    } catch(cause) {
      throw new UnreachableNodeError(cid.toString(), cause)
    }
    return count
  },
})

export type LoadResult = {
  update: CID,
  root: CID,
  publisher: `0x${string}`,
  prev?: CID,
  blocks: number,
}

export const loadArchive = async (
  { kubo, cache }: { kubo: Kubo, cache?: CacheView },
  path: string,
): Promise<LoadResult> => {
  const roots: CID[] = []
  try {
    for await(const { root } of kubo.dag.import([createReadStream(path)])) {
      roots.push(root.cid)
    }
  } catch(cause) {
    throw new MalformedDocumentError(path, '(archive)', `not an importable CAR: ${cause}`)
  }
  if(roots.length !== 1) {
    throw new MalformedDocumentError(
      path, '(archive)', `archives carry exactly one root; found ${roots.length}`,
    )
  }
  const [update] = roots
  const { update: doc, blocks, nodes } = await validateArchive(kuboLoadPorts(kubo), update)
  // Only after the walk succeeds does anything get reported or noted —
  // partial is never presented as success (FR-008); the cache is a
  // derived view, so noting is best-effort structure, not truth.
  if(cache) {
    await cache.putUpdate(update, doc)
    for(const [cid, node] of nodes) {
      await cache.putNode(CID.parse(cid), node)
    }
  }
  return {
    update,
    root: doc.root,
    publisher: doc.publisher,
    ...(doc.prev ? { prev: doc.prev } : {}),
    blocks,
  }
}
