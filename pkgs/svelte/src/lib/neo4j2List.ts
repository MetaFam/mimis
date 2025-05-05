import { identify, records2Object } from '$lib'
import { getNeo4j } from './neo4jDriver'

export async function neo4j2List(path: Array<string>) {
  const results = await getNöopoints(path)

  if(results.length === 0) {
    throw new Error('No results for path.')
  } else if(results.length > 1) {
    throw new Error(`${results.length} results for path.`)
  }

  const [{ nöopoint }] = results
  console.debug({ 'loading from': nöopoint })

  const neo4j = getNeo4j()
  const session = neo4j.session()

  try {
    const list = `
      MATCH (nöopoint)-[entry:ENTRY]->(item)
      WHERE elementId(nöopoint) = $id
      ORDER BY entry.order
      RETURN DISTINCT
        entry,
        item
    `

    const { records } = await session.run(
      list, { id: nöopoint.elementId }
    )
    const results = records2Object(records)

    console.debug({ found: results })

    return identify(results.map((result) => ({
      title: result.entry.properties.path,
      type: result.item.properties.type,
      cid: result.item.properties.cid,
    })))
  } finally {
    session.close()
    neo4j.close()
  }
}

export async function getNöopoints(
  path: Array<string>, { offset = 0, limit = null } = {}
) {
  const neo4j = getNeo4j()
  const session = neo4j.session()

  try {
    const vals = {
      limit: limit != null ? Number(limit) : 0,
      offset: Number(offset),
    }

    const pathTraveral = `
      WITH $elems as pathElems
      MATCH path = (start:Root)-[:CONTAINS*]->(terminal)
      MATCH (terminal)-[EMBODIED_AS]->(point)
      WITH pathElems, path, terminal, point, [
        rel in relationships(path)
        WHERE NOT isEmpty(rel.path)
        | rel.path
      ] as elements
      WHERE size(elements) = size(pathElems)
      AND ALL(
        i IN range(0, size(pathElems) - 1)
        WHERE (
          pathElems[i] = '*'
          OR elements[i] = pathElems[i]
        )
      )
      ${vals.limit > 0 ? `LIMIT ${vals.offset + vals.limit}` : ''}
      SKIP ${vals.offset}
      RETURN DISTINCT
        elements as path,
        terminal as pathEnd,
        point as nöopoint
    `

    const { records } = await session.run(
      pathTraveral, { elems: path }
    )

    return records2Object(records)
  } finally {
    await session.close()
    await neo4j.close()
  }
}