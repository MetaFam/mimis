import { create as createKubo } from 'kubo-rpc-client'
import { UnreachableNodeError } from './errors.ts'
import { cidOf, type CID } from './codec.ts'

export type Blockstore = {
  put(bytes: Uint8Array): Promise<CID>,
  get(cid: CID): Promise<Uint8Array>,
}

// pin: false suits bulk writers that take one recursive pin on their
// root afterwards — per-block pinning is a pinset commit each time.
export const kuboStore = (url: string, { pin = true } = {}): Blockstore => {
  const kubo = createKubo({ url })
  return {
    put: async (bytes) => {
      const expected = await cidOf(bytes)
      const stored = String(await kubo.block.put(bytes, {
        format: 'dag-cbor',
        mhtype: 'sha2-256',
        version: 1,
        pin,
      }))
      if(stored !== expected.toString()) {
        throw new Error(`kubo stored ${stored} where ${expected.toString()} was expected`)
      }
      return expected
    },
    get: async (cid) => {
      try {
        return await kubo.block.get(cid, { timeout: 30_000 })
      } catch(cause) {
        throw new UnreachableNodeError(cid.toString(), cause)
      }
    },
  }
}
