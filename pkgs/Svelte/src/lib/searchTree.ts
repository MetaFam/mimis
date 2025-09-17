import mime from 'mime'
import { getNeo4j } from './drivers.ts'
import { settings } from './settings.svelte.ts'

export const searchTree = async (
  { path, type = null, limit = 200, offset = 0 }:
  {
    path: Array<string>
    type?: string | null
    limit?: number
    offset?: number
  }
) => {
  const driver = getNeo4j()
  const session = driver.session()

  try {
    path = path.filter((elem) => elem.trim() !== '')
    limit = parseInt(Number(limit).toFixed(0))
    offset = parseInt(Number(offset).toFixed(0))

    if(!!type && !type.includes('/')) {
      type = mime.getType(type) ?? `unknown/${type}`
    }

    const query = (path.length === 0 ? (
      `
        MATCH (start:Root)-[next:CONTAINS]->(child)
        RETURN [] as path, next, child
      `
    ) : (
      `
        WITH $elems as pathElems
        MATCH path = (start:Root)-[:CONTAINS|EQUALS*]->(end)
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
          MATCH (end)-[:REPRESENTED_BY]->(${
            'mediate'
          })-[next:EMBODIED_AS]->(child${
            !type ? '' : ' { mimetype: $type }'
          })
            RETURN next, child
        }
        RETURN DISTINCT
          elements AS path,
          end.mïmid as id,
          next,
          child
        SKIP $offset
        LIMIT $limit
      `
    ))
    const params = {
      elems: path,
      type,
      limit: BigInt(limit || settings.limit),
      offset: BigInt(offset),
    }
    const { records } = await session.run(query, params)
    return records
  } finally {
    await session.close()
  }
}
