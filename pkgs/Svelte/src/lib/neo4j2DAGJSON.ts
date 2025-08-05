import { CID } from 'multiformats/cid'
import { encode as encodeDAGJSON } from '@ipld/dag-json'
import { settings } from './settings.svelte.ts'
import { getIPFS, getNeo4j } from './drivers.ts'

type Logger = ((msg: string | {}) => void) | null

type Options = {
  log?: Logger
  batchSize?: number
  rootId?: string | null
}

export type Relationship = {
  type: 'relation'
  relationship: string
  source: CID
  target: CID
  properties: Array<string>
}

export type Node = {
  type: 'node'
  labels: Array<string>
  properties: Array<string>
}

export type Results = Record<string, CID>

export type Checklist = Record<string, number>

export type Nodes = Record<string, Node>
export type CIDs = Record<string, CID>

export class Serializer {
  private neo4j = getNeo4j()
  path: Array<string> = []
  log?: Logger = null
  batchSize = 1_500

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
  }

  async node(rootId?: string): Promise<CID> {
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

      console.debug({ records })

      if(records.length !== 1) throw new Error(`Returned ${records.length} records.`)

      const [record] = records
      const relationships = []
      for(const rel of record.get('relations') ?? []) {
        relationships.push({
          type: rel.type,
          ...rel.properties,
          target: await this.node(rel.targetId)
        })
      }
      const cid = await toIPFS({
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
      this.log?.({ cid })
      return cid
    } finally {
      await session.close()
    }
  }
}

export async function toIPFS(data: any) {
  return await getIPFS().block.put(
    encodeDAGJSON(data), { format: 'dag-json' },
  )
}

export async function neo4j2IPFS(
  { log = null, batchSize = 1000, rootId = null }: Options
) {
  try {
    const serializer = new Serializer({ log, batchSize })
    serializer.log?.('Exporting nodes…')
    const rootCID = await serializer.node()
    serializer.log?.({ rootCID })
    return rootCID
  } catch(error) {
    console.error({ 'Graph Serializing Error': error })
    throw error
  }
}
