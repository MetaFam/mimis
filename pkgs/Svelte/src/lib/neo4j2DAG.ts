import { CID } from 'multiformats/cid'
import * as json from '@ipld/dag-json'
import * as cbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { ByteView } from 'multiformats'
import { settings } from './settings.svelte.ts'
import { getIPFS, getNeo4j } from './drivers.ts'
import type { Logger } from '../types'
import { Recorder, genCAR } from './cypher.ts'

type Options = {
  log?: Logger
  batchSize?: number
  rootId?: string | null
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

const emptyCID = CID.parse(
  'bafybeiczsscdsbs7ffqz55ahobb37kkvllc4hikvjbgmsecgnuyzy4b4ga'
)

export async function emptyJSONDAGCID() {
  const bytes = json.encode({})
  const hash = await sha256.digest(bytes)
  return CID.create(1, json.code, hash)
}

export class Serializer {
  private neo4j = getNeo4j()
  path: Array<string> = []
  log?: Logger = null
  batchSize = 1_500
  encoder: Encoder = json
  carReadable: ReadableStream | null = null
  carWritable: WritableStream | null = null
  carWriter: ReturnType<WritableStream["getWriter"]> | null = null
  blocks: Array<Block> = []
  recorder = new Recorder()

  constructor(
    { log = null, batchSize = 1000, encoder = json }:
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

  async node(rootId?: string | null): Promise<CID> {
    const session = this.neo4j.session()

    if(rootId == null) {
      const statement = `
        MATCH (r:Root) RETURN elementId(r) as id
      `
      const { records } = await this.recorder.exec({ statement }, {})
      const count = records.length
      if(count === 0) {
        throw new Error('Couldn’t find `rootId`.')
      } else if(count > 1) {
        throw new Error(`Found ${count} \`rootId\`s.`)
      }
      rootId = records[0].get('id')
    }

    if(rootId == null) throw new Error('Couldn’t get `rootId`.')

    if(this.path.includes(rootId)) {
      throw new Error(
        `Revisited ${rootId}. (¿Cycle found?)`,
        { cause: this.path },
      )
    }
    this.path.push(rootId)

    try {
      const statement = `
        MATCH (start) WHERE elementId(start) = $rootId
        OPTIONAL MATCH (start)-[rel]->(node)
        ORDER BY rel.path
        RETURN
          labels(start) AS labels,
          properties(start) AS properties,
          [r IN collect({
            type: type(rel),
            properties: properties(rel),
            targetId: elementId(node)
          }) WHERE r.type IS NOT NULL] AS relations
      `

      const { records } = await this.recorder.exec(
        { statement, params: { rootId } }, { session }
      )

      this.log?.(`Found ${records.length} node${
        records.length === 1 ? '' : 's'
      } at ${rootId.split(':').at(-1)}`)

      if(records.length !== 1) {
        throw new Error(`Returned ${records.length} records.`)
      }

      const [record] = records
      const relationships = []
      for(const rel of record.get('relations') ?? []) {
        relationships.push({
          type: rel.type,
          ...rel.properties,
          target: await this.node(rel.targetId)
        })
      }
      const cid = await this.addToCAR({
        labels: record.get('labels') as Array<string>,
        properties: (
          Object.fromEntries(Object.entries(
            record.get('properties') as Record<string, string | CID>
          ).map(([prop, val]) => {
            if(prop === 'cid' && typeof val === 'string') {
              val = CID.parse(val)
            }
            return [prop, val]
          }))
        ),
        relationships,
      })
      this.path.pop()
      this.log?.({ cid: cid.toString() })
      return cid
    } finally {
      await session.close()
    }
  }

  async addToCAR(data: unknown) {
    const bytes = this.encoder.encode(data)
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, this.encoder.code, hash)
    if(this.carWriter == null) throw new Error('No `carWriter`.')
    await this.carWriter.write({ cid, bytes })
    return cid
  }

  async generateCAR() {
    return genCAR(this.blocks)
  }
}

export async function toIPFS(
  data: any, { encoder = json }: { encoder: Encoder }
) {
  return await getIPFS().block.put(
    encoder.encode(data), { format: encoder.name },
  )
}

export async function neo4j2IPFS(
  { log = null, batchSize = 1000, rootId = null }: Options
) {
  try {
    const encoder = cbor
    const serializer = new Serializer({
      log, batchSize, encoder,
    })
    serializer.recorder.reset()
    serializer.log?.(`Exporting nodes to \`${encoder.name}\`…`)
    const rootCID = await serializer.node(rootId)
    const opsCID = (await serializer.recorder.generateCAR()).cid
    serializer.log?.({ rootCID, opsCID })
    return { serializer, rootCID, opsCID }
  } catch(error) {
    console.error({ 'Graph Serializing Error': error })
    throw error
  }
}
