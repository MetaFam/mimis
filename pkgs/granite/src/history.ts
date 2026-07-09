import { asUpdate, decode, isAddress, CID, type Address } from './codec.ts'
import type { Blockstore } from './store.ts'

export type HistoryEntry = {
  update: CID,
  publisher: Address,
  prev?: CID,
  at: number,
}

export type HistoryPorts = {
  store: Blockstore,
  latest(publisher: Address): Promise<CID | undefined>,
}

// Walks prev links newest → oldest. A never-published address yields
// nothing (absence is not an error); a broken link yields everything
// reached, then throws UnreachableNodeError naming the missing CID.
export async function* walkHistory(
  { store, latest }: HistoryPorts,
  from: Address | CID,
): AsyncGenerator<HistoryEntry> {
  let next = isAddress(from) ? await latest(from) : CID.asCID(from) ?? undefined
  while(next) {
    const bytes = await store.get(next)
    const update = asUpdate(next, decode(bytes))
    yield {
      update: next,
      publisher: update.publisher,
      ...(update.prev ? { prev: update.prev } : {}),
      at: update.at,
    }
    next = update.prev
  }
}
