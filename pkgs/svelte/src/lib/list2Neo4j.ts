import type { Entry } from '../routes/list/+page.svelte'
import { getNeo4j } from './neo4jDriver'

export async function list2Neo4j(list: Array<Entry>, path: Array<string>) {
  const neo4j = getNeo4j()
  const session = neo4j.session()

  try {
    const root = await session.run(
      'MERGE (r:Root) RETURN id(r) as id'
    )
    let currentId = root.records[0].get('id')

    for(const element of path) {
      const stepQuery = `
        MATCH (p) WHERE id(p) = $currentId
        MERGE (p)-[:CONTAINS {path: $element}]->(n:Collection)
        RETURN id(n) as id
      `
      const step = await session.run(stepQuery, {
        currentId, element,
      })
      currentId = step.records[0].get('id')
    }

    const nöoQuery = `
      MATCH (p) WHERE id(p) = $currentId
      MERGE (p)-[:EMBODIED_AS]->(n:Nöopoint)
      RETURN id(n) as id
    `
    const nöopoint = await session.run(nöoQuery, { currentId })
    const nöoId = nöopoint.records[0].get('id')

    for(const i in list) {
      const { cid, title } = list[i]
      const lineQuery = `
        MATCH (p) WHERE id(p) = $id
        MERGE (f:File {cid: $cid})
        CREATE (p)-[:ENTRY {path: $title, order: $order}]->(f)
        RETURN f
      `
      await session.run(lineQuery, {
        id: nöoId, cid, title, order: Number(i) + 1
      })
    }
  } finally {
    await session.close()
    await neo4j.close()
  }
}