import {
  CID,
  isAddress,
  type Address,
} from './codec.ts'
import { MissingKeyError } from './errors.ts'
import { generateKey, addressOf } from './keys.ts'
import { kuboStore, type Blockstore } from './store.ts'
import { ethereumRegistry, type Registry } from './registry.ts'
import {
  decodeAndVerify,
  kuboAnnouncer,
  type Announcement,
  type Announcer,
} from './announce.ts'
import { publishTree, type Published, type Tree } from './publish.ts'
import { walkHistory, type HistoryEntry } from './history.ts'
import { stackKey, type Mount } from './mount.ts'
import {
  hydrateStack,
  resolvePath,
  type CacheView,
  type Resolved,
} from './resolve.ts'

export type GraniteConfig = {
  kubo: string,
  gremlin?: string,
  chain: {
    rpcUrl: string,
    registry: Address,
  },
  key?: `0x${string}`,
  maxMountDepth?: number,
}

export type Ports = {
  store: Blockstore,
  registry: Registry,
  announcer: Announcer,
  cache?: CacheView,
  key?: `0x${string}`,
  maxMountDepth?: number,
  log?: (message: string) => void,
}

export type Stack = {
  key: string,
  resolve(path: string): Promise<Resolved | undefined>,
  hydrate(): Promise<void>,
  invalidate(): Promise<void>,
}

export type Granite = {
  publish(tree: Tree): Promise<Published>,
  stack(mounts: Mount[], alias?: string): Promise<Stack>,
  latest(publisher: Address): Promise<CID | undefined>,
  history(from: Address | CID): AsyncGenerator<HistoryEntry>,
  follow(handler: (announcement: Announcement) => void): () => void,
  close(): Promise<void>,
}

export const createGranite = (ports: Ports): Granite => {
  const log = ports.log ?? ((message: string) => console.error(message))
  const maxMountDepth = ports.maxMountDepth ?? 8
  // Verified announcements seen this session; fresher than the registry
  // while its transaction is still in flight (both converge).
  const announced = new Map<Address, CID>()
  const unsubscribers = new Set<() => void>()
  const latest = async (publisher: Address) => (
    announced.get(publisher) ?? await ports.registry.latest(publisher)
  )
  const resolvePorts = {
    store: ports.store,
    ...(ports.cache ? { cache: ports.cache } : {}),
    latest,
    maxMountDepth,
    log,
  }
  return {
    publish: async (tree) => {
      if(!ports.key) {
        throw new MissingKeyError('publish')
      }
      const published = await publishTree(
        {
          store: ports.store,
          registry: ports.registry,
          announcer: ports.announcer,
          key: ports.key,
        },
        tree,
      )
      announced.set(addressOf(ports.key), published.update)
      return published
    },

    stack: async (mounts, alias) => {
      const key = stackKey(mounts)
      if(ports.cache) {
        await ports.cache.registerStack(key, mounts, alias)
      }
      return {
        key,
        resolve: (path) => (
          resolvePath(resolvePorts, mounts, path)
        ),
        hydrate: () => (
          hydrateStack(resolvePorts, mounts, alias)
        ),
        invalidate: async () => {
          await ports.cache?.markStale(key)
        },
      }
    },

    latest: (publisher) => (
      ports.registry.latest(publisher)
    ),

    history: (from) => (
      walkHistory({ store: ports.store, latest }, from)
    ),

    follow: (handler) => {
      const subscription = ports.announcer.subscribe(async (bytes) => {
        const verified = await decodeAndVerify(bytes)
        if(!verified.ok) {
          log(`dropped announcement: ${verified.reason}`)
          return
        }
        const { announcement } = verified
        announced.set(announcement.publisher, announcement.root)
        if(ports.cache) {
          await ports.cache.notePublished(announcement.publisher, announcement.root)
          .catch((cause) => {
            log(`cache unreachable while noting announcement: ${cause}`)
          })
        }
        handler(announcement)
      })
      const unsubscribe = () => {
        unsubscribers.delete(unsubscribe)
        subscription.then((stop) => stop()).catch((cause) => {
          log(`unsubscribe failed: ${cause}`)
        })
      }
      unsubscribers.add(unsubscribe)
      return unsubscribe
    },

    close: async () => {
      for(const unsubscribe of [...unsubscribers]) {
        unsubscribe()
      }
      await ports.cache?.close()
    },
  }
}

export const connect = async (config: GraniteConfig): Promise<Granite> => {
  const cache = config.gremlin ? (
    (await import('./cache.ts')).gremlinCache(config.gremlin)
  ) : (
    undefined
  )
  return createGranite({
    store: kuboStore(config.kubo),
    registry: ethereumRegistry({
      rpcUrl: config.chain.rpcUrl,
      registry: config.chain.registry,
      ...(config.key ? { key: config.key } : {}),
    }),
    announcer: kuboAnnouncer(config.kubo),
    ...(cache ? { cache } : {}),
    ...(config.key ? { key: config.key } : {}),
    ...(config.maxMountDepth === undefined ? {} : { maxMountDepth: config.maxMountDepth }),
  })
}

export { CID, isAddress, generateKey, addressOf, stackKey }
export {
  MissingKeyError,
  MalformedDocumentError,
  UnreachableNodeError,
  RegistryError,
} from './errors.ts'
export type { Address, Tree, Published, Mount, Resolved, Announcement, HistoryEntry }
