import { CID } from 'multiformats/cid'
import { encode as encodeDAGJSON } from '@ipld/dag-json'
import { getIPFS, getNeo4j } from './drivers.ts'

type Options = {
  status?: ((msg: string) => void) | null
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

export type Nodes = Record<string, Node>
export type CIDs = Record<string, CID>

export const serialize = {
  async nodes({ batchSize, status, rootId }: Options) {
    const neo4j = getNeo4j()
    const session = neo4j.session()

    try {
      const query = `
        OPTIONAL MATCH (start) WHERE elementId(start) = $rootId
        MATCH (node)
        WHERE
          $rootId IS NULL OR
          (start IS NOT NULL AND ((start)-[*]->(node)))
        RETURN
          DISTINCT elementId(node) as id,
          labels(node) as labels,
          properties(node) as properties
        ORDER BY elementId(node)
      `

      const result = await session.run(query, { rootId })

      status?.(`Found ${result.records.length} node${result.records.length === 1 ? '' : 's'}`)

      return Object.fromEntries(
        await Promise.all(
          Array.from(result.records).map(async (record: any) => ([
            record.get('id') as string,
            await toIPFS({
              type: 'node',
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
            })
          ]))
        )
      )
    } finally {
      await session.close()
    }
  },

  async relationships(nodes: Results, { batchSize, status, rootId }: Options) {
    const neo4j = getNeo4j()
    const session = neo4j.session()

    try {
      const query = `
        OPTIONAL MATCH (start) WHERE elementId(start) = $rootId
        MATCH (source)-[r]->(target)
        WHERE
          $rootId IS NULL OR
          (start IS NOT NULL AND ((start)-[*]->(source)))
        RETURN
          elementId(source) as sourceId,
          elementId(target) as targetId,
          type(r) as type,
          properties(r) as properties
        ORDER BY elementId(r)
      `

      const result = await session.run(query, { rootId })

      return Array.from(result.records).map((record: any) => {
        const source = nodes[record.get('sourceId')]
        const target = nodes[record.get('targetId')]

        if(!source) throw new Error(`No node for ${record.get('sourceId')}`)
        if(!target) throw new Error(`No node for ${record.get('targetId')}`)

        if(!source.equals(target)) {
          return ({
            type: 'relation',
            relationship: record.get('type'),
            source,
            target,
            properties: record.get('properties'),
          } as Relationship)
        }
      }).filter(Boolean)
    } finally {
      await session.close()
    }
  },

  async index(
    nodes: Results,
    relations: Array<Relationship>,
    { status, rootId }: Options
  ) {
    const childIds = new Set(
      relations.map((rel: Relationship) => (
        rel.target?.toString() ?? (
          (() => {
            throw new Error(`Relation Mapping Error: ${JSON.stringify(rel, null, 2)}`)
          })()
        )
      ))
    )
    const allIds = new Set(Object.values(nodes).map(
      (val: CID) => val.toString())
    )
    const roots = allIds.difference(childIds)
    console.debug({ allIds: allIds.values().map((id) => CID.parse(id)), roots })
    return toIPFS({
      nodes: Array.from(allIds.values()).map((id) => CID.parse(id)),
      relations,
      roots: Array.from(roots.values()).map((id) => CID.parse(id)),
    })
  }
}

export async function toIPFS(data: any) {
  return await getIPFS().block.put(
    encodeDAGJSON(data), { format: 'dag-json' },
  )
}

export async function neo4j2IPFS(
  { status = null, batchSize = 1000, rootId = null }: Options
) {
  const options = { status, batchSize, rootId }
  try {
    status?.('Exporting nodes…')
    const nodes = await serialize.nodes(options)

    console.debug({ nodes })

    status?.('Adding relationships…')
    const rels = await serialize.relationships(nodes, options)


    status?.('Writing to IPFS…')
    const rootCID = await serialize.index(nodes, rels, options)

    status?.(`Graph serialized to IPFS.\n  Root CID: \ ${rootCID}\ `)
    return rootCID
  } catch(error) {
    console.error('Error serializing graph:', error)
    throw error
  }
}
