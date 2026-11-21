import type { CID } from 'multiformats/cid'
import settings from '#lib/settings.svelte.js'
import { cidFor } from '#lib/updates.js'
import { getIPFS } from '#lib/server/ipfs.js'

export interface Blocks {
  put(bytes: Uint8Array): Promise<CID>
  get(cid: CID): Promise<Uint8Array>
  pin(cid: CID, previous?: CID): Promise<void>
  unpin(cid: CID): Promise<void>
}

const CONCURRENCY = 16

export function kuboBlocks({ format = 'dag-cbor' } = {}): Blocks {
  const ipfs = getIPFS()
  return {
    async put(bytes) {
      const [cid, expected] = await Promise.all([
        ipfs.block.put(bytes, { format, mhtype: 'sha2-256', pin: false }),
        cidFor(bytes),
      ])
      if(!cid.equals(expected)) {
        throw new Error(`CID mismatch: expected ${expected}, got ${cid}.`)
      }
      return expected
    },
    get: (cid) => ipfs.block.get(cid, { timeout: settings.ipfsTimeout }),
    async pin(cid, previous) {
      // `previous` stays pinned until the commit that supersedes it has
      // landed, so a lost race or a failed commit can’t leave the
      // published history unpinned. The timeout is for file data that
      // isn’t on this node, which Kubo would otherwise seek forever.
      const timeout = settings.ipfsTimeout
      if(previous) {
        await ipfs.pin.update(previous, cid, { unpin: false, timeout })
      } else {
        await ipfs.pin.add(cid, { recursive: true, timeout })
      }
    },
    async unpin(cid) {
      await ipfs.pin.rm(cid)
    },
  }
}

export async function putAll(
  blocks: Blocks, items: Array<{ bytes: Uint8Array }>,
) {
  for(let start = 0; start < items.length; start += CONCURRENCY) {
    await Promise.all(
      items.slice(start, start + CONCURRENCY).map(({ bytes }) => (
        blocks.put(bytes)
      ))
    )
  }
}
