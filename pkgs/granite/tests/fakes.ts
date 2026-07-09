// In-memory fakes behind the ports, letting unit tests run with no
// daemons. Shapes mirror src/store.ts, src/registry.ts, src/announce.ts,
// and src/resolve.ts exactly — one production code path, swapped edges.
import { cidOf, CID, type Address, type NodeDoc, type UpdateDoc } from '#lib/codec.ts'
import { MissingKeyError, UnreachableNodeError } from '#lib/errors.ts'
import type { Blockstore } from '#lib/store.ts'
import type { Registry } from '#lib/registry.ts'
import type { Announcer } from '#lib/announce.ts'
import type { Mount, TraversalNode } from '#lib/mount.ts'
import type { CacheView } from '#lib/resolve.ts'

export type MemoryStore = Blockstore & {
  gets: number,
  blocks: Map<string, Uint8Array>,
  delete(cid: CID): void,
}

export const memoryStore = (): MemoryStore => {
  const blocks = new Map<string, Uint8Array>()
  const store: MemoryStore = {
    gets: 0,
    blocks,
    put: async (bytes) => {
      const cid = await cidOf(bytes)
      blocks.set(cid.toString(), bytes)
      return cid
    },
    get: async (cid) => {
      store.gets += 1
      const bytes = blocks.get(cid.toString())
      if(!bytes) {
        throw new UnreachableNodeError(cid.toString())
      }
      return bytes
    },
    delete: (cid) => {
      blocks.delete(cid.toString())
    },
  }
  return store
}

// One shared hub per test network; `for(address)` binds a publisher-side
// Registry the way a key binds the Ethereum implementation.
export type RegistryHub = {
  entries: Map<Address, CID>,
  for(publisher?: Address): Registry,
}

export const memoryRegistry = (): RegistryHub => {
  const entries = new Map<Address, CID>()
  return {
    entries,
    for: (publisher) => ({
      latest: async (address) => (
        entries.get(address)
      ),
      publish: async (root) => {
        if(!publisher) {
          throw new MissingKeyError('registry publish')
        }
        entries.set(publisher, root)
      },
    }),
  }
}

export type AnnouncerHub = {
  for(): Announcer,
}

export const memoryAnnouncer = (): AnnouncerHub => {
  const handlers = new Set<(bytes: Uint8Array) => void>()
  return {
    for: () => ({
      publish: async (bytes) => {
        for(const handler of [...handlers]) {
          await Promise.resolve(handler(bytes))
        }
      },
      subscribe: async (handler) => {
        handlers.add(handler)
        return async () => {
          handlers.delete(handler)
        }
      },
    }),
  }
}

export type MemoryCache = CacheView & {
  nodes: Map<string, TraversalNode>,
  updates: Map<string, UpdateDoc>,
  stacks: Map<string, { mounts: Mount[], alias?: string, stale: boolean }>,
  latests: Map<Address, string>,
  clear(): void,
}

export const memoryCache = (): MemoryCache => {
  const nodes = new Map<string, TraversalNode>()
  const updates = new Map<string, UpdateDoc>()
  const stacks = new Map<string, { mounts: Mount[], alias?: string, stale: boolean }>()
  const latests = new Map<Address, string>()
  return {
    nodes,
    updates,
    stacks,
    latests,
    getNode: async (cid) => (
      nodes.get(cid.toString())
    ),
    putNode: async (cid, doc: NodeDoc) => {
      nodes.set(cid.toString(), {
        edges: Object.fromEntries(
          Object.entries(doc.edges).map(([name, edge]) => [name, edge.child]),
        ),
        mounts: doc.mounts,
      })
    },
    putUpdate: async (cid, update) => {
      updates.set(cid.toString(), update)
    },
    registerStack: async (key, mounts, alias) => {
      stacks.set(key, {
        mounts,
        ...(alias ? { alias } : {}),
        stale: false,
      })
    },
    markStale: async (key) => {
      const stack = stacks.get(key)
      if(stack) {
        stack.stale = true
      }
    },
    notePublished: async (publisher, update) => {
      latests.set(publisher, update.toString())
      for(const stack of stacks.values()) {
        const mounted = stack.mounts.some(({ source }) => (
          typeof source === 'string' && source === publisher
        ))
        // Node-level mounts: any cached node mounting this publisher
        const nodeMounted = [...nodes.values()].some(({ mounts }) => (
          mounts.some(({ source }) => source === publisher)
        ))
        if(mounted || nodeMounted) {
          stack.stale = true
        }
      }
    },
    close: async () => {},
    clear: () => {
      nodes.clear()
      updates.clear()
    },
  }
}
