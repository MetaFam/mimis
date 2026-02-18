import { CID } from 'multiformats/cid'
// import * as json from '@ipld/dag-json'
import * as cbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { type ByteView } from 'multiformats'
import {
  createConfig as createWAGMIConfig, http, signTypedData,
} from '@wagmi/core'
import { mainnet as L1, sepolia } from '@wagmi/core/chains'
import { settings } from '$lib/settings.svelte.ts'
import { nodeInfo } from '$lib/nodeInfo.remote.ts'
import { getIPFS, blocksToCAR } from '$lib/ipfs.ts'
import type { Logger } from '../types'
import type { KuboRPCClient } from "kubo-rpc-client";

type Options = {
  log?: Logger
  batchSize?: number
  rootId?: number | null
}

export type Node = {
  type: 'node'
  labels: Array<string>
  properties: Array<string>
}

export type Nodes = Record<string, Node>
export type CIDs = Record<string, CID>

type Block = {
  cid: CID
  bytes: Uint8Array
}

export type Encoder = {
  encode: (val: unknown) => ByteView<unknown>
  name: string
  code: number
}

export class Serializer {
  private ipfs: KuboRPCClient | null = null
  path: Array<string> = []
  log?: Logger = null
  batchSize = 1_500
  encoder: Encoder = cbor
  carReadable: ReadableStream | null = null
  carWritable: WritableStream | null = null
  carWriter: ReturnType<WritableStream["getWriter"]> | null = null
  blocks: Array<Block> = []

  constructor(
    {
      log = null,
      batchSize = 1000,
      encoder = cbor,
      writeCAR = false,
      writeIPFS = true,
    }:
    {
      log?: Logger
      batchSize?: number
      encoder?: Encoder
      writeCAR?: boolean
      writeIPFS?: boolean
    }
  ) {
    if(log != null) {
      this.log = log
    } else if(settings.debugging) {
      this.log = console.debug
    }

    this.batchSize = batchSize
    this.encoder = encoder

    if(!writeIPFS && !writeCAR) {
      throw new Error(
        'At least one of `writeIPFS` or `writeCAR` must be true.'
      )
    }

    if(writeIPFS) {
      this.ipfs = getIPFS()
    }

    if(writeCAR) {
      const { readable, writable } = new TransformStream()
      this.carReadable = readable
      this.carWritable = writable
      this.carWriter = writable.getWriter()

      const blocks = this.blocks
      this.carReadable.pipeTo(new WritableStream({
        write(block) { blocks.push(block) },
      }))
    }
  }

  async node(rootId?: number | null): Promise<CID> {
    const { edges, id, properties, ...props } = await nodeInfo(rootId)

    const relationships = await Promise.all(
      edges.map(async ({ targetId, ...edge }) => ({
        ...edge,
        target: await this.node(targetId as number),
      }))
    )

    const cid = await this.addToIPFS({
      ...props,
      properties: Object.fromEntries(
        Object.entries(properties).map(([key, value]) => {
          if(key === 'cid') {
            value = CID.parse(value as string)
          }
          return [key, value]
        })
      ),
      relationships,
    })
    this.log?.({ cid: cid.toString() })
    return cid as CID
  }

  async addToIPFS(data: unknown) {
    const bytes = this.encoder.encode(data)
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, this.encoder.code, hash)
    if(this.ipfs != null) {
      const writtenCID = await this.ipfs.block.put(
        bytes, { format: this.encoder.name },
      )
      if(!cid.equals(writtenCID)) {
        throw new Error(
          'CID Mismatch:'
          + ` Expected ${cid.toString()}, got ${writtenCID.toString()}.`
        )
      }
    }
    if(this.carWriter != null) {
      await this.carWriter.write({ cid, bytes })
    }
    return cid
  }

  async generateCAR() {
    return await blocksToCAR(this.blocks)
  }
}

export async function signCID(cid: string) {
  const config = createWAGMIConfig({
    chains: [L1, sepolia],
    transports: {
      [L1.id]: http(),
      [sepolia.id]: http(),
    },
  })

  const sig = await signTypedData(config, {
    types: {
      Root: [
        { name: 'cid', type: 'string' },
      ],
    },
    primaryType: 'Root',
    message: { cid },
  })
  return sig
}


export async function janusToCAR(
  { log = null, batchSize = 1000, rootId = null }: Options
) {
  try {
    const encoder = cbor
    const serializer = new Serializer({
      log, batchSize, encoder,
    })
    serializer.log?.(`Exporting nodes to \`${encoder.name}\`…`)
    const rootCID = await serializer.node(rootId)
    const signature = await signCID(rootCID.toString())
    const updateCID = await serializer.addToIPFS({
      cid: rootCID,
      signature,
    })
    const out = { cid: updateCID }
    if(serializer.carWriter != null) {
      out.car = await serializer.generateCAR()
    }
    serializer.log?.({ out })
    return out
  } catch(error) {
    console.error({ 'Graph Serializing Error': error })
    throw error
  }
}

