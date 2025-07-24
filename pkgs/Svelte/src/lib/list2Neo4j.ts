import type { Entry } from '../routes/list/+page.svelte'
import { getNeo4j } from './drivers.ts'
import { v7 as uuid } from 'uuid'

export async function list2Neo4j(list: Array<Entry>, path: Array<string>) {
  const neo4j = getNeo4j()
  const session = neo4j.session()

  try {
    const { records: [root] } = await session.run(
      'MERGE (r:Root) RETURN elementId(r) as id'
    )
    let currentId = root.get('id')

    const stepQuery = `
      MATCH (elem) WHERE elementId(elem) = $currentId
      MERGE (elem)-[:CONTAINS {path: $element}]->(next:Spot)
      ON CREATE SET elem.mimis_id = $uuid
      RETURN elementId(next) as id
    `
    for(const element of path) {
      const { records: [step] } = await session.run(stepQuery, {
        currentId, element, uuid: uuid(),
      })
      currentId = step.get('id')
    }

    const nöoQuery = `
      MATCH (path) WHERE elementId(path) = $currentId
      OPTIONAL MATCH (path)-[:REPRESENTED_BY]->(sib:Nöopoint)
      WITH path, sib
      ORDER BY sib.createdAt DESC
      WITH path, collect(sib)[0] as previous
      CREATE (path)-[:REPRESENTED_BY]->(list:List:Nöopoint {
        mimis_id: $uuid, createdAt: timestamp()
      })
      WITH list, previous
      FOREACH (_ IN CASE WHEN previous IS NOT NULL THEN [1] ELSE [] END |
        MERGE (list)-[:PREVIOUS]->(previous)
      )
      RETURN elementId(list) as id
    `
    const { records: [point] } = await session.run(nöoQuery, {
      currentId, uuid: uuid(),
    })
    currentId = point.get('id')

    const lineQuery = `
      MATCH (list) WHERE elementId(list) = $currentId
      MERGE (file:IPFS:File {cid: $cid})
      MERGE (point:Nöopoint)-[:EMBODIED_AS]->(file)
      MERGE (spot:Spot)-[:REPRESENTED_BY]->(point)
      MERGE (item:Spot)-[:CONTAINS {path: $title}]->(spot)
      ON CREATE SET file.createdAt = timestamp()
      ON CREATE SET file.mimis_id = $uuid
      SET file.type = (
        CASE WHEN file.type IS NULL THEN $type ELSE file.type END
      )
      CREATE (list)-[:ENTRY {order: $order}]->(item)
      RETURN file
    `
    for(const i in list) {
      const { cid, title, type } = list[i]
      await session.run(lineQuery, {
        currentId, cid, title, type, order: Number(i) + 1, uuid: uuid(),
      })
    }
  } finally {
    await session.close()
    // await neo4j.close()
  }
}