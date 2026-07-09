import {
  asNode,
  asUpdate,
  decode,
  CID,
  type Address,
  type EdgeDoc,
  type NodeDoc,
  type UpdateDoc,
} from './codec.ts'
import {
  resolveStack,
  stackKey,
  type Mount,
  type ResolverDeps,
  type TraversalNode,
} from './mount.ts'
import type { Blockstore } from './store.ts'

// The cache is derived and disposable (Constitution IV): structure only,
// keyed by content, rebuildable from the DAG at any time. `getNode`
// returning undefined means "not yet fetched", never "not present" — the
// expanded marker below is what makes that distinction.
export type CacheView = {
  getNode(cid: CID): Promise<TraversalNode | undefined>,
  putNode(cid: CID, node: NodeDoc): Promise<void>,
  putUpdate(cid: CID, update: UpdateDoc): Promise<void>,
  registerStack(key: string, mounts: Mount[], alias?: string): Promise<void>,
  markStale(key: string): Promise<void>,
  notePublished(publisher: Address, update: CID): Promise<void>,
  close(): Promise<void>,
}

export type Resolved = {
  node: CID,
  data?: Record<string, unknown>,
  edges: Record<string, EdgeDoc>,
  via: CID,
}

export type ResolvePorts = {
  store: Blockstore,
  cache?: CacheView,
  latest(publisher: Address): Promise<CID | undefined>,
  maxMountDepth: number,
  log?: (message: string) => void,
}

const toTraversal = (doc: NodeDoc): TraversalNode => ({
  edges: Object.fromEntries(
    Object.entries(doc.edges).map(([name, edge]) => [name, edge.child]),
  ),
  mounts: doc.mounts,
})

// Wires the resolver to fetch incrementally (FR-015): cached structure is
// walked while it exists; a missing/unexpanded node pulls exactly that
// document from the store and writes it back. An unreachable cache demotes
// to direct DAG walking for the rest of the session — never an error.
export const makeDeps = (ports: ResolvePorts): ResolverDeps => {
  const log = ports.log ?? (() => {})
  let cacheUp = ports.cache !== undefined
  const cacheDown = (cause: unknown) => {
    if(cacheUp) {
      cacheUp = false
      log(`cache unreachable, falling back to DAG walks: ${cause}`)
    }
    return undefined
  }
  const fetchNode = async (cid: CID): Promise<NodeDoc> => {
    const bytes = await ports.store.get(cid)
    return asNode(cid, decode(bytes))
  }
  return {
    node: async (cid) => {
      if(cacheUp && ports.cache) {
        const hit = await ports.cache.getNode(cid).catch(cacheDown)
        if(hit) {
          return hit
        }
      }
      const doc = await fetchNode(cid)
      if(cacheUp && ports.cache) {
        await ports.cache.putNode(cid, doc).catch(cacheDown)
      }
      return toTraversal(doc)
    },
    update: async (cid) => {
      const bytes = await ports.store.get(cid)
      const update = asUpdate(cid, decode(bytes))
      if(cacheUp && ports.cache) {
        await ports.cache.putUpdate(cid, update).catch(cacheDown)
      }
      return update
    },
    latest: ports.latest,
    maxMountDepth: ports.maxMountDepth,
  }
}

export const resolvePath = async (
  ports: ResolvePorts, mounts: Mount[], path: string,
): Promise<Resolved | undefined> => {
  const deps = makeDeps(ports)
  const hit = await resolveStack(deps, mounts, path)
  if(!hit) {
    return undefined
  }
  const bytes = await ports.store.get(hit.node)
  const doc = asNode(hit.node, decode(bytes))
  return {
    node: hit.node,
    ...(doc.data ? { data: doc.data } : {}),
    edges: doc.edges,
    via: hit.via,
  }
}

// Optional eager warm-up: walk every mounted tree so traversal-style
// queries find the whole view resident. Idempotent; `resolve` never
// requires it.
export const hydrateStack = async (
  ports: ResolvePorts, mounts: Mount[], alias?: string,
): Promise<void> => {
  if(!ports.cache) {
    throw new Error('hydrate requires a gremlin cache endpoint')
  }
  const deps = makeDeps(ports)
  await ports.cache.registerStack(stackKey(mounts), mounts, alias)
  const seenNodes = new Set<string>()
  const seenPublishers = new Set<string>()
  const walkNode = async (cid: CID, depth: number): Promise<void> => {
    if(seenNodes.has(cid.toString())) {
      return
    }
    seenNodes.add(cid.toString())
    const node = await deps.node(cid)
    for(const child of Object.values(node.edges)) {
      await walkNode(child, depth)
    }
    if(depth <= 0) {
      return
    }
    for(const mount of node.mounts) {
      const source = CID.asCID(mount.source)
      if(source) {
        await walkNode(source, depth - 1)
      } else {
        await walkPublisher(mount.source as Address, depth - 1)
      }
    }
  }
  const walkPublisher = async (publisher: Address, depth: number): Promise<void> => {
    if(seenPublishers.has(publisher)) {
      return
    }
    seenPublishers.add(publisher)
    let next = await deps.latest(publisher)
    if(next && ports.cache) {
      await ports.cache.notePublished(publisher, next)
    }
    while(next) {
      const update = await deps.update(next)
      await walkNode(update.root, depth)
      next = update.prev
    }
  }
  for(const mount of mounts) {
    const source = CID.asCID(mount.source)
    if(source) {
      const update = await deps.update(source)
      await walkNode(update.root, deps.maxMountDepth)
    } else {
      await walkPublisher(mount.source as Address, deps.maxMountDepth)
    }
  }
}
