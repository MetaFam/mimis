import type { Entry } from '../routes/list/+page.svelte'
import { getNeo4j } from './neo4jDriver'

export async function list2Neo4j(list: Array<Entry>, path: Array<string>) {
  const neo4j = getNeo4j()
  const session = neo4j.session()

  try {
    const { records: [root] } = await session.run(
      'MERGE (r:Root) RETURN elementId(r) as id'
    )
    let currentId = root.get('id')

    for(const element of path) {
      const stepQuery = `
        MATCH (elem) WHERE elementId(elem) = $currentId
        MERGE (elem)-[:CONTAINS {path: $element}]->(next:Collection)
        RETURN elementId(next) as id
      `
      const { records: [step] } = await session.run(stepQuery, {
        currentId, element,
      })
      currentId = step.get('id')
    }

    const nöoQuery = `
      MATCH (path) WHERE elementId(path) = $currentId
      CREATE (path)-[:EMBODIED_AS]->(point:Nöopoint)
      SET point.createdAt = timestamp()
      RETURN elementId(point) as id
    `
    const { records: [point] } = await session.run(nöoQuery, { currentId })
    currentId = point.get('id')

    for(const i in list) {
      const { cid, title, type } = list[i]
      const lineQuery = `
        MATCH (point) WHERE elementId(point) = $currentId
        MERGE (file:File {cid: $cid})
        ON CREATE SET file.createdAt = timestamp()
        SET file.type =
          CASE WHEN file.type IS NULL THEN $type ELSE file.type END
        CREATE (point)-[:ENTRY {path: $title, order: $order}]->(file)
        RETURN file
      `
      await session.run(lineQuery, {
        currentId, cid, title, type, order: Number(i) + 1
      })
    }
  } finally {
    await session.close()
    await neo4j.close()
  }
}