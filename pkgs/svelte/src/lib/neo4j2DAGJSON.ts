import { CID } from 'multiformats/cid'
import { encodeDAGJSON } from '@ipld/dag-json'
import { getIPFS, getNeo4j } from './neo4jDriver.ts'

type Options = {
  status: ((msg: string) => void) | null
  batchSize: number
  rootId?: string | null
}

export type Relationship = {
  type: 'relation'
  relationship: string
  sourceId: string
  targetId: string
  properties: Array<string>
}

export type Out = Omit<Relationship, 'sourceId' | 'targetId'> & {
  source: CID
  target: CID
}

export type Node = {
  id: string
  type: 'node'
  labels: Array<string>
  properties: Array<string>
}

export type Nodes = Record<string, Node>
export type CIDs = Record<string, CID>

export async function serializeGraph(
  { status = null, batchSize = 1000, rootId = null }: Options
) {
  const options = { status, batchSize, rootId }
  try {
    status?.('Exporting nodes…')
    const nodes = await exportNodes(options)
    const result = await serializeNodes(nodes, options)

    status?.('Adding relationships…')
    const rels = await exportRelationships(nodes, options)
    await serializeRelationships(rels)

    status?.('Creating root index…')
    const rootCID = await nodes2IPLD(rels, options)

    status?.(`Graph serialized to IPFS. Root CID: ${rootCID}`)
    return rootCID
  } catch(error) {
    console.error('Error serializing graph:', error)
    throw error
  }
}

async function exportNodes({ batchSize, status, rootId }: Options) {
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
        elementId(n) as id,
        labels(n) as labels,
        properties(n) as properties
      ORDER BY elementId(n)
    `

    const result = await session.run(query, { rootId })

    status?.(`Found ${result.records.length} nodes`)


    return Object.fromEntries(
      Array.from(result.records).map((record: any) => ([
        record.get('id') as string,
        {
          type: 'node',
          id: record.get('id') as string,
          labels: record.get('labels') as Array<string>,
          properties: record.get('properties') as Array<string>,
        }
      ]))
    )
  } finally {
    await session.close()
  }
}

async function addRelationships(nodes: Nodes, { batchSize, status, rootId }: Options) {
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

    return Array.from(result.records).map((record) => {
      const sourceId = record.get('sourceId')
      const targetId = record.get('targetId')

      if(!(sourceId in nodes)) {
        console.warn(`Unknown Node Id: ${sourceId}`)
        return
      }

      return ({
        type: 'relation',
        relationship: record.get('type'),
        source: result[sourceId],
        target: result[targetId],
        properties: record.get('properties'),
      })
    })
  } finally {
    await session.close()
  }
}

export async function nodes2IPLD(nodes: Nodes, { status, rootId }: Options) {
  const result = {}
  await traverse(nodes, rootId ? nodes[rootId] : null, result)
}

async function traverse(nodes: Nodes, node: Node | null, result: CIDs) {
  for(const [id, node] of Object.entries(nodes)) {
    if(result[id]) return result[id]
    for(const rel of node.relationships) {
      const { sourceId, targetId, ...rest } = rel
      const out: Out = {
        source: await traverse(nodes, nodes[id], result),
        target: await traverse(nodes, nodes[rel.targetId], result),
        ...rest,
      }
      result[id] = await createIPLDBlock(out)
    }
  }
  if(node == null) {
    const childIds = new Set(
      Object.values(nodes)
      .map((parent: Node) => (
        parent.relationships.map((rel: Relationship) => rel.targetId)
      )).flat()
    )
    const allIds = new Set(Object.keys(nodes))
    const parentIds = allIds.difference(childIds)
    return genRoot(parentIds.map((id: string) => result[id]))
  }
  return result[node.id]
}

async function getRoot(children: Array<Out>) {
  const root: Node = {
    id: 'generated',
    labels: ['Generated', 'Root'],
    properties: [],
    relationships: children.map((child) => ({
      type: 'CONTAINS',
      sourceId: 'generated',
      targetId:
    }))
  }
}

async function createIPLDBlock(data: Out) {
  const bytes = encodeDAGJSON(data)
  const ipfs = getIPFS()
  return await ipfs.block.put(bytes)
}
