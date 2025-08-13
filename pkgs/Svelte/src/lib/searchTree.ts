import { getNeo4j } from './drivers.ts'

export const searchTree = async (
  { path, limit = 200, offset = 0 }:
  {
    path: Array<string>,
    limit?: number,
    offset?: number,
  }
) => {
  const driver = getNeo4j()
  const session = driver.session()

  try {
    path = path.filter((elem) => elem.trim() !== '')
    limit = parseInt(Number(limit).toFixed(0))
    offset = parseInt(Number(offset).toFixed(0))
    const query = (path.length === 0 ? (
      `
        MATCH (start:Root)-[next:CONTAINS]->(child)
        RETURN [] as path, next, child
      `
    ) : (
      `
        WITH $elems as pathElems
        MATCH path = (start:Root)-[:CONTAINS*]->(end)
        WITH pathElems, path, end,
            [
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
        CALL (end) {
          MATCH (end)-[next:CONTAINS]->(child)
            RETURN next, child
          UNION DISTINCT
          MATCH (end)-[:REPRESENTED_BY]->(mediate)-[next:EMBODIED_AS]->(child)
            RETURN next, child
        }
        RETURN DISTINCT
          elements AS path,
          next,
          child
        SKIP $offset
        LIMIT $limit
      `
    ))
    const { records } = await session.run(
      query, {
        elems: path,
        limit: BigInt(limit),
        offset: BigInt(offset),
      }
    )
    console.debug({ query, records })
    return records
  } finally {
    await session.close()
  }
}