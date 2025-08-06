import { CID } from 'multiformats/cid'
import * as json from '@ipld/dag-json'
import { sha256 } from 'multiformats/hashes/sha2'
import { CAREncoderStream } from 'ipfs-car'
import { settings } from './settings.svelte.ts'
import { getIPFS, getNeo4j } from './drivers.ts'
import type { Logger } from '../types'

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
  carReadable: ReadableStream | null = null
  carWritable: WritableStream | null = null
  carWriter: ReturnType<WritableStream["getWriter"]> | null = null
  blocks: Array<Block> = []

  constructor(
    { log = null, batchSize = 1000 }:
    { log: Logger, batchSize: number }
  ) {
    if(log != null) {
      this.log = log
    } else if(settings.debugging) {
      this.log = console.debug
    }

    this.batchSize = batchSize

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
      const query = `
        MATCH (r:Root) RETURN elementId(r) as id
      `
      const result = await session.run(query)
      const count = result.records.length
      if(count === 0) {
        throw new Error('Couldn’t find `rootId`.')
      } else if(count > 1) {
        throw new Error(`Found ${count} \`rootId\`s.`)
      }
      rootId = result.records[0].get('id')
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
      const query = `
        MATCH (start) WHERE elementId(start) = $rootId
        OPTIONAL MATCH (start)-[rel]->(node)
        RETURN
          labels(start) AS labels,
          properties(start) AS properties,
          [r IN collect({
            type: type(rel),
            properties: properties(rel),
            targetId: elementId(node)
          }) WHERE r.type IS NOT NULL] AS relations
      `

      const { records } = await session.run(query, { rootId })

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

  async addToCAR(data: any) {
    const bytes = json.encode(data)
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, json.code, hash)
    if(this.carWriter == null) throw new Error('No `carWriter`.')
    await this.carWriter.write({ cid, bytes })
    return cid
  }

  async carURL() {
    this.log?.('Generating CAR URL…')

    const blocks = this.blocks
    const blockStream = new ReadableStream({
      pull(controller) {
        if(blocks.length > 0) {
          controller.enqueue(blocks.shift())
        } else {
          controller.close()
        }
      }
    })

    if(!blocks || blocks.length === 0) {
      throw new Error('No blocks generated.')
    }

    const rootBlock = blocks.at(-1)
    if(!rootBlock) {
      throw new Error('No root block found.')
    }

    type Chunk = Uint8Array
    const chunks: Array<Chunk> = []
    await (
      blockStream
      .pipeThrough(new CAREncoderStream([rootBlock.cid]))
      .pipeTo(new WritableStream({
        write(chunk) { chunks.push(chunk) },
      }))
    )

    return URL.createObjectURL(new Blob(chunks))
  }
}

export async function toIPFS(data: any) {
  return await getIPFS().block.put(
    json.encode(data), { format: 'dag-json' },
  )
}

export async function neo4j2IPFS(
  { log = null, batchSize = 1000, rootId = null }: Options
) {
  try {
    const serializer = new Serializer({ log, batchSize })
    serializer.log?.('Exporting nodes…')
    const rootCID = await serializer.node(rootId)
    serializer.log?.({ rootCID })
    return { serializer, rootCID }
  } catch(error) {
    console.error({ 'Graph Serializing Error': error })
    throw error
  }
}
