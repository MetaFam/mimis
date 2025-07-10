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
  try {
    const session = driver.session()
    path = path.filter((elem) => elem.trim() !== '')
    limit = parseInt(Number(limit).toFixed(0))
    offset = parseInt(Number(offset).toFixed(0))
    const query = (path.length === 0 ? (
      `
        MATCH (start:Root)-[children:CONTAINS|CONNECTS]->(child)
        RETURN [] as path, children.path as container, child
      `
    ) : (
      `
        WITH $elems as pathElems
        MATCH path = (start:Root)-[:CONTAINS|CONNECTS|EMBODIED_AS*]->(end)
        MATCH (end)-[children:CONTAINS|CONNECTS|ENTRY]->(child)
        WITH pathElems, path, children, child,
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
        ORDER BY children.order
        LIMIT ${offset + limit}
        SKIP ${offset}
        RETURN DISTINCT
          elements as path,
          children.path as container,
          child
      `
    ))
    const result = await session.run(
      query, {
        elems: path,
        limit: BigInt(limit),
        offset: BigInt(offset),
      }
    )
    await session.close()
    return result.records
  } finally {
    driver.close()
  }
}