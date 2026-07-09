import { createPublicClient, createWalletClient, hexToBytes, http, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import * as dagCbor from '@ipld/dag-cbor'
import { CID, type Address } from './codec.ts'
import { MalformedDocumentError, MissingKeyError, RegistryError } from './errors.ts'

export type Registry = {
  latest(publisher: Address): Promise<CID | undefined>,
  publish(root: CID): Promise<void>,
}

export const registryAbi = [
  {
    type: 'function',
    name: 'latest',
    stateMutability: 'view',
    inputs: [{ name: 'publisher', type: 'address' }],
    outputs: [{ name: '', type: 'bytes' }],
  },
  {
    type: 'function',
    name: 'publish',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'root', type: 'bytes' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'Published',
    inputs: [
      { name: 'publisher', type: 'address', indexed: true },
      { name: 'root', type: 'bytes', indexed: false },
    ],
  },
] as const

export type EthereumRegistryConfig = {
  rpcUrl: string,
  registry: Address,
  key?: `0x${string}`,
}

export const ethereumRegistry = (
  { rpcUrl, registry, key }: EthereumRegistryConfig,
): Registry => {
  const client = createPublicClient({ transport: http(rpcUrl) })
  const account = key ? privateKeyToAccount(key) : undefined
  const wallet = account ? (
    createWalletClient({ account, transport: http(rpcUrl) })
  ) : (
    undefined
  )
  return {
    latest: async (publisher) => {
      let hex: `0x${string}`
      try {
        hex = await client.readContract({
          address: registry,
          abi: registryAbi,
          functionName: 'latest',
          args: [publisher],
        })
      } catch(cause) {
        throw new RegistryError(`reading latest(${publisher})`, cause)
      }
      if(hex === '0x') {
        return undefined
      }
      let cid: CID
      try {
        cid = CID.decode(hexToBytes(hex))
      } catch {
        throw new MalformedDocumentError(hex, 'latest', 'registry bytes do not decode to a CID')
      }
      if(cid.version !== 1 || cid.code !== dagCbor.code) {
        throw new MalformedDocumentError(
          cid.toString(), 'latest', 'registry CID is not CIDv1 dag-cbor',
        )
      }
      return cid
    },
    publish: async (root) => {
      if(!wallet || !account) {
        throw new MissingKeyError('registry publish')
      }
      try {
        const hash = await wallet.writeContract({
          chain: null,
          address: registry,
          abi: registryAbi,
          functionName: 'publish',
          args: [toHex(root.bytes)],
        })
        await client.waitForTransactionReceipt({ hash })
      } catch(cause) {
        throw new RegistryError('publishing latest root', cause)
      }
    },
  }
}
