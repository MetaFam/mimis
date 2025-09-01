import { v7 as uuid } from 'uuid'
import * as cbor from '@ipld/dag-cbor'
import { QueryResult, Session } from 'neo4j-driver'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { CAREncoderStream } from 'ipfs-car'
import { getNeo4j } from './drivers.ts'
import type { Logger } from '../types'
/**
 * Make every position in the list equal to the last position
 * in the list.
 *
 * @param ids: List of Neo4j elementIds of nodes to equate.
 */
export async function equalize(ids: Array<string>) {
  const neo4j = getNeo4j()

  ids = ids.filter(Boolean)
  const targetId = ids.pop()
  await Promise.all(ids.map(async (equivId) => {
    const session = neo4j.session()
    try {
      const query = `
        MATCH (e) WHERE elementId(e) = $equivId
        MATCH (t) WHERE elementId(t) = $targetId
        MERGE (e)-[eq:EQUALS]->(t)
        ON CREATE SET eq.mimis_id = $uuid
        RETURN $uuid
      `
      await session.run(
        query, { equivId, targetId, uuid: uuid() },
      )
    } finally {
      session.close()
    }
  }))
}

export async function create({ path }: { path: Array<string> }) {
  const session = getNeo4j().session()

  try {
    const rootQuery = (
      `MERGE (r:Root) RETURN elementId(r) AS id`
    )
    const { records: [root] } = await session.run(rootQuery)
    let current = root.get('id') as string

    const elems = [...path]
    while(elems.length > 0) {
      const elem = elems.shift()
      const query = `
        MATCH (base) WHERE elementId(base) = $current
        MERGE (base)-[cont:CONTAINS { path: $elem }]->(node:Spot)
        ON CREATE SET cont.mimis_id = $contUUID
        ON CREATE SET node.mimis_id = $nodeUUID
        RETURN elementId(node) AS id
      `
      const { records: [node] } = await session.run(
        query, {
          current, elem, contUUID: uuid(), nodeUUID: uuid(),
        },
      )
      current = node.get('id')
    }
    return current
  } finally {
    session.close()
  }
}

export const to = { base:
  (parts: Uint8Array, base: number) => {
    const hash = Array.from(parts).map(
      (n) => (
        n.toString(base).padStart(
          (base === Math.pow(2, 8)) ? 1 : 2,
          '0',
        )
      )
    ).join('')
    return hash
  }
}

export const hash = {
  sha256: async (
    content: Uint8Array | string, { base = 64 } = {},
  ) => {
    if(typeof content === 'string') {
      const encoder = new TextEncoder()
      content = encoder.encode(content)
    }
    const digest = await sha256.digest(content)
    return digest
  }
}

export type Call = {
  statement: string
  params?: Record<string, unknown> | null
}

type Block = {
  cid: CID
  bytes: Uint8Array
}

export type Operation = {
  mïmid: string
  statement: string
  params?: Record<string, unknown> | null
  previous?: CID | null
  at: string
}

type ExecuteOptions = {
  session?: Session | null
  record?: boolean | null
} | undefined

export type SHA256 = bigint
export type CBOR = Uint8Array
export class Recorder {
  ops: Map<string, Operation> = new Map()
  rec: ((op: Call) => Promise<Operation>)
  exec: ((op: Call, opts: ExecuteOptions) => Promise<QueryResult>)
  last: CID | null = null
  car: {
    readable: ReadableStream | null
    writable: WritableStream | null
    writer: ReturnType<WritableStream["getWriter"]> | null
  } = {
    readable: null,
    writable: null,
    writer: null,
  }
  blocks: Array<Block> = []

  constructor() {
    this.rec = this.record.bind(this)
    this.exec = this.execute.bind(this)
    this.reset()
  }

  reset() {
    const { readable, writable } = new TransformStream()
    this.car.readable = readable
    this.car.writable = writable
    this.car.writer = writable.getWriter()

    const blocks = this.blocks
    this.car.readable.pipeTo(new WritableStream({
      write(block) { blocks.push(block) },
    }))
  }

  async record({ statement, params }: Call) {
    const op: Operation = {
      statement: statement.trim(),
      at: new Date().toISOString(),
      mïmid: uuid(),
    }
    if(params) op.params = params
    if(this.last) op.previous = this.last
    console.debug({ Encoding: op })
    const bytes = await cbor.encode(op)
    const hashed = await hash.sha256(bytes)
    this.last = CID.create(1, cbor.code, hashed)
    this.ops.set(this.last.toString(), op)
    if(this.car.writer != null) {
      await this.car.writer.write({ cid: this.last, bytes })
    }
    return op
  }

  set recording(rec: boolean) {
    if(rec) {
      if(!this.car.writer) this.reset()
    } else {
      this.car.writer = null
    }
  }

  async execute(
    { statement, params }: Call,
    {
      session = null, record = null,
    }: ExecuteOptions = {}
  ) {
    if(record == null) {
      record = !!this.car.writer
    }

    // params.rootId ??= getRootId()

    let sessionCreated = false
    if(session == null) {
      session = getNeo4j().session()
      sessionCreated = true
    }
    try {
      if(record) {
        await this.record({ statement, params })
      }
      console.debug({ Running: { statement, params } })
      return await session.run(statement, params)
    } finally {
      if(sessionCreated) {
        console.debug({ Closing: session })
        session.close()
      }
    }
  }

  async run() {
    const neo4j = getNeo4j()
    const session = neo4j.session()
    try {
      if(this.last) {
        let current = (
          this.ops.get(this.last.toString()) ?? null
        )
        do {
          if(current) {
            await this.execute(current, { session })
            current = (current.previous != null ? (
              this.ops.get(current.previous.toString())
              ?? null
            ) : ( null ))
          }
        } while(current)
      }
    } finally {
      session.close()
    }
  }

  generateCAR() {
    return genCAR(this.blocks)
  }
}

export type CARInfo = {
  url: string
  cid: CID
}

export async function genCAR(
  blocks: Array<Block>,
  { log = null }: { log?: Logger } = {}
) {
  log?.('Generating CAR URL…')

  const blks = [...blocks]
  const blockStream = new ReadableStream({
    pull(controller) {
      if(blks.length > 0) {
        controller.enqueue(blks.shift())
      } else {
        controller.close()
      }
    }
  })

  if(!blks || blks.length === 0) {
    throw new Error('No blocks generated.')
  }

  const rootBlock = blks.at(-1)
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

  return {
    url: URL.createObjectURL(new Blob(chunks)),
    cid: rootBlock.cid,
  }
}