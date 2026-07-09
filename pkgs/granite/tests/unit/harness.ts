// A tiny in-memory network: shared blockstore, registry hub, and
// announcement bus, from which per-publisher Granite instances are built —
// the production createGranite wired to fakes.
import { createGranite, type Granite } from '../../src/index.ts'
import { addressOf, generateKey } from '../../src/keys.ts'
import type { Address } from '../../src/codec.ts'
import {
  memoryAnnouncer,
  memoryCache,
  memoryRegistry,
  memoryStore,
  type MemoryCache,
  type MemoryStore,
} from '../fakes.ts'

export type Network = {
  store: MemoryStore,
  registry: ReturnType<typeof memoryRegistry>,
  announcer: ReturnType<typeof memoryAnnouncer>,
  publisher(key?: `0x${string}`): { granite: Granite, key: `0x${string}`, address: Address },
  reader(options?: { cache?: MemoryCache }): Granite,
}

export const network = (): Network => {
  const store = memoryStore()
  const registry = memoryRegistry()
  const announcer = memoryAnnouncer()
  return {
    store,
    registry,
    announcer,
    publisher: (key = generateKey()) => {
      const address = addressOf(key)
      return {
        granite: createGranite({
          store,
          registry: registry.for(address),
          announcer: announcer.for(),
          key,
          log: () => {},
        }),
        key,
        address,
      }
    },
    reader: (options = {}) => (
      createGranite({
        store,
        registry: registry.for(),
        announcer: announcer.for(),
        ...(options.cache ? { cache: options.cache } : {}),
        log: () => {},
      })
    ),
  }
}

export const tick = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

export { memoryCache }