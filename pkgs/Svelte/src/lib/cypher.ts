import { v7 as uuid } from 'uuid'
import { getNeo4j } from './drivers.ts'

/**
 * Make every position in the list equal to the last position
 * in the list.
 *
 * @param ids: List of Neo4j elementIds of nodes to equalize.
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
  const neo4j = getNeo4j()
  const session = neo4j.session()

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