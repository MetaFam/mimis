import { identify, records2Object, Nöopoint } from '$lib'
import { type Entry } from '../routes/list/[...path]/+page.svelte'
import { getNeo4j } from './drivers.ts'

export async function neo4j2List(path: Array<string>) {
  const results = await Nöopoint.get.children(path, { onlyCurrent: true })

  if(results.length === 0) {
    throw new Error('No results for path.')
  } else if(results.length > 1) {
    throw new Error(`${results.length} results for path.`)
  }

  const [{ nöopoint }] = results
  const neo4j = getNeo4j()
  const session = neo4j.session()

  console.debug({ nöopoint })

  try {
    const list = `
      MERGE (itemPoint:Nöopoint)-[:EMBODIED_BY]->(item)
      MATCH (point)-[:REPRESENTED_BY]->(itemPoint)
      WHERE point.mïmid = $id
      AND NOT ()-[:PREVIOUS]->(point)
      ORDER BY entry.order
      RETURN DISTINCT entry, item
    `

    const { records } = await session.run(
      list, { id: nöopoint.mïmid }
    )
    const results = records2Object(records)

    console.debug({ found: results })

    return identify<Entry>(results.map((result: any) => ({
      title: result.entry.properties.path,
      type: result.item.properties.type,
      cid: result.item.properties.cid,
    })))
  } finally {
    session.close()
    neo4j.close()
  }
}
