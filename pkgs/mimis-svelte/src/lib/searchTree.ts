import { getNeo4j } from '$lib/neo4jDriver'

export const searchTree = async (path: Array<string>) => {
  const driver = getNeo4j()
  try {
    const session = driver.session()
    const query = (path.length === 0 ? (
      `
        MATCH (start:Root)-[children:CONTAINS|CONNECTS]->(child)
        RETURN children.path as path, child
      `
    ) : (
      `
        WITH $elems as pathElems
        MATCH path = (start:Root)-[:CONTAINS|CONNECTS*]->(end)
        MATCH (end)-[children:CONTAINS|CONNECTS]->(child)
        WHERE [rel in relationships(path) WHERE NOT isEmpty(rel.path) | rel.path] = pathElems
        RETURN children.path as path, child
      `
    ))
    const result = await session.run(query, { elems: path })
    await session.close()
    return result.records
  } finally {
    driver.close()
  }
}