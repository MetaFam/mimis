import { CID } from 'multiformats/cid'
// import * as json from '@ipld/dag-json'
import * as cbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { type ByteView } from 'multiformats'
import type { KuboRPCClient } from 'kubo-rpc-client'
import { signTypedData } from '@wagmi/core'
import { settings } from '$lib/settings.svelte.ts'
import { nodeInfo } from '$lib/nodeInfo.remote.ts'
import { getIPFS, blocksToCAR } from '$lib/ipfs.ts'
import type { Logger } from '../types'
import { toHTTP } from "./index.ts";

type Options = {
  log?: Logger
  batchSize?: number
  rootId?: number | null
  generateCAR?: boolean
  insertInIPFS?: boolean
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
      generateCAR = false,
      insertInIPFS = true,
    }:
    {
      log?: Logger
      batchSize?: number
      encoder?: Encoder
      generateCAR?: boolean
      insertInIPFS?: boolean
    }
  ) {
    if(log != null) {
      this.log = log
    } else if(settings.debugging) {
      this.log = console.debug
    }

    this.batchSize = batchSize
    this.encoder = encoder

    if(!insertInIPFS && !generateCAR) {
      throw new Error(
        'At least one of `insertInIPFS` or `generateCAR` must be true.'
      )
    }

    if(insertInIPFS) {
      this.ipfs = getIPFS()
    }

    if(generateCAR) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    this.log?.(
      `Node ${id} serialized to`
      + ` <a href="${toHTTP({ cid })}" target="_blank">`
      + cid.toString()
      + '</a>.'
    )
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
  const { getWagmiAdapter } = await import('$lib/appkit')
  const adapter = getWagmiAdapter()

  const sig = await signTypedData(adapter.wagmiConfig, {
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


export async function janusToDAG(
  {
    log = null,
    batchSize = 1000,
    rootId = null,
    generateCAR = false,
    insertInIPFS = true,
  }: Options = {}
) {
  try {
    const encoder = cbor
    const serializer = new Serializer({
      log, batchSize, encoder, generateCAR, insertInIPFS,
    })
    serializer.log?.(`Exporting nodes to \`${encoder.name}\`…`)
    const rootCID = await serializer.node(rootId)
    serializer.log?.('Awaiting Ethereum signature by user…')
    const signature = await signCID(rootCID.toString())
    const updateCID = await serializer.addToIPFS({
      cid: rootCID,
      signature,
    })
    const out: { cid: CID, car?: { url: string, cid: CID } } = (
      { cid: updateCID }
    )
    if(serializer.carWriter != null) {
      out.car = await serializer.generateCAR()
    }
    return out
  } catch(error) {
    console.error({ 'Graph Serializing Error': error })
    throw error
  }
}

