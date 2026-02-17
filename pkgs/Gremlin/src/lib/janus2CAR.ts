import { CID } from 'multiformats/cid'
// import * as json from '@ipld/dag-json'
import * as cbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { type ByteView } from 'multiformats'
import { settings } from '$lib/settings.svelte.ts'
import { nodeInfo } from '$lib/nodeInfo.remote.ts'
import { getIPFS, blocksToCAR } from '$lib/ipfs.ts'
import type { Logger } from '../types'

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
  path: Array<string> = []
  log?: Logger = null
  batchSize = 1_500
  encoder: Encoder = cbor
  carReadable: ReadableStream | null = null
  carWritable: WritableStream | null = null
  carWriter: ReturnType<WritableStream["getWriter"]> | null = null
  blocks: Array<Block> = []

  constructor(
    { log = null, batchSize = 1000, encoder = cbor }:
    { log?: Logger, batchSize?: number, encoder?: Encoder }
  ) {
    if(log != null) {
      this.log = log
    } else if(settings.debugging) {
      this.log = console.debug
    }

    this.batchSize = batchSize
    this.encoder = encoder

    const { readable, writable } = new TransformStream()
    this.carReadable = readable
    this.carWritable = writable
    this.carWriter = writable.getWriter()

    const blocks = this.blocks
    this.carReadable.pipeTo(new WritableStream({
      write(block) { blocks.push(block) },
    }))
  }

  async node(rootId?: number | null): Promise<CID> {
    const { edges, id, properties, ...props } = await nodeInfo(rootId)

    const relationships = await Promise.all(
      edges.map(async ({ targetId, ...edge }) => ({
        ...edge,
        target: await this.node(targetId),
      }))
    )

    const cid = await this.addToCAR({
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
    return cid
  }

  async addToCAR(data: unknown) {
    const bytes = this.encoder.encode(data)
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, this.encoder.code, hash)
    if(this.carWriter == null) throw new Error('No `carWriter`.')
    const writtenCID = await getIPFS().block.put(
      bytes, { format: this.encoder.name },
    )
    if(!cid.equals(writtenCID)) {
      throw new Error(
        `CID Mismatch: Expected ${cid.toString()}, got ${writtenCID.toString()}.`
      )
    }
    await this.carWriter.write({ cid, bytes })
    return cid
  }

  async generateCAR() {
    return await blocksToCAR(this.blocks)
  }
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
    const out = await serializer.generateCAR()
    serializer.log?.({ out, rootCID: rootCID.toString() })
    return rootCID
  } catch(error) {
    console.error({ 'Graph Serializing Error': error })
    throw error
  }
}

