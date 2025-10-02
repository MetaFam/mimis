import type { WunderbaumNode } from 'wb_node'
import { v7 as uuid } from 'uuid'
import mime from 'mime'
import { getNeo4j } from './drivers.ts'
import type { Logger } from '../types'

export async function wunder2Neo4j({
  root, path = [], log, on,
}: {
  root: WunderbaumNode,
  path: Array<string>,
  log?: Logger,
  on: { node: { enter: (
    (node: WunderbaumNode) => void
  ) } }
}) {
  const driver = getNeo4j()
  const session = driver.session()
  const tx = session.beginTransaction({
    metadata: { action: 'car import', path, file: root.data.filename }
  })

  try {
    const mountId = await createMount()
    if(root.children?.length != 1) {
      throw new Error(`Can't handle ${root.children?.length} root children.`)
    }
    const rootId = await ingest({ node: root.children[0], mountId })
    const pathStr = `/${path.join('/')}${path.length > 0 ? '/' : ''}`
    log?.(`Mounted ${rootId} at ${pathStr}.`)
    return { rootId }
  } finally {
    await tx.commit()
    await session.close()
  }

  async function getPoint({ dirId }: { dirId: string }) {
    const statement = `
      MATCH (dir) WHERE dir.mïmid = $dirId
      MERGE (dir)-[rel:REPRESENTED_BY]->(point:Nöopoint)
      ON CREATE SET point.mïmid = $pointUUID
      ON CREATE SET rel.mïmid = $relUUID
      RETURN point.mïmid AS id
    `
    const { records } = await tx.run(
      statement, {
        dirId, pointUUID: uuid(), relUUID: uuid()
      }
    )
    const pointId = records[0].get('id')
    log?.({ 'Added Point': `${dirId} → ${pointId}` })
    return pointId
  }

  async function addDirEntry(
    { dirId, itemId, name, type = ':Spot', rship = ':CONTAINS' }:
    {
      dirId?: string
      itemId?: string
      name?: string
      type?: string
      rship?: string
    }
  ) {
    const statement = `
      ${!itemId ? '' : (
        'MATCH (entry) WHERE entry.mïmid = $itemId'
      )}
      ${dirId == null ? (
        `CREATE (dir${type} { mïmid: $dirUUID })`
      ) : (
        'MATCH (dir) WHERE dir.mïmid = $dirId'
      )}
      MERGE (dir)-[c${rship} ${
        name != null ? '{ path: $name }' : ''
      }]->(entry)
      ON CREATE SET c.mïmid = $relUUID
      ON CREATE SET entry.mïmid = $entryUUID
      SET dir:Spot
      SET entry:Spot
      RETURN entry.mïmid AS id
    `
    const { records: [entry] } = await tx.run(
      statement, {
        itemId: itemId ?? null, name, dirId,
        dirUUID: uuid(), relUUID: uuid(), entryUUID: uuid(),
      }
    )
    const retId = entry.get('id')
    log?.(`Added ${name} → ${itemId} (${dirId} → ${retId})`)
    return retId
  }

  async function addFile(
    { dirId, cid, type, size }:
    { dirId: string, cid: string, type: string | null, size: number }
  ) {
    const pointId = await getPoint({ dirId })
    const statement = `
      MATCH (point) WHERE point.mïmid = $pointId
      MERGE (file:IPFS:File { cid: $cid })
      MERGE (point)-[rel:EMBODIED_AS]->(file)
      ON CREATE SET file.mïmid = $fileUUID
      ON CREATE SET rel.mïmid = $relUUID
      SET file.mimetype = CASE WHEN $type IS NOT NULL THEN $type END
      SET file.size = $size
      RETURN file.mïmid AS id
    `
    const { records } = await tx.run(
      statement, {
        pointId, cid, type, size,
        itemUUID: uuid(), fileUUID: uuid(), relUUID: uuid()
      }
    )
    log?.({ 'Added At': `${pointId}: ${cid} (${type})` })
    return records[0].get('id')
  }

  /**
   * Attaches a graph representing a CAR file to a context tree.
   *
   * @param rootId: The root node of the recently imported CAR file.
   * @returns
   */
  async function createMount() {
    const statement = `
      MERGE (r:Root)
      ON CREATE SET r.mïmid = $uuid
      SET r:Root:Spot
      RETURN r.mïmid AS id
    `
    const { records: [root] } = await tx.run(
      statement, { uuid: uuid() }
    )
    let current = root.get('id') as string

    log?.({ 'Got Root': current })

    while(path.length > 0) {
      const statement = `
        MATCH (dir) WHERE dir.mïmid = $current
        MERGE (dir)-[rel:CONTAINS { path: $elem }]->(item)
        ON CREATE SET rel.mïmid = $relUUID
        ON CREATE SET item.mïmid = $itemUUID
        SET item:Spot
        RETURN item.mïmid as id
      `
      const elem = path.shift()
      const { records } = await tx.run(
        statement, {
          current, elem, itemUUID: uuid(), relUUID: uuid()
        },
      )
      current = records[0].get('id') as string
    }
    return current
  }

  async function ingest(
    { node, mountId }: { node: WunderbaumNode, mountId: string }
  ) {
    if(!node.children) throw new Error(`Not a directory: ${node.title}.`)
    if(node.children.length === 0) throw new Error(`Empty directory: ${node.title}.`)

    let dirId = await addDirEntry({
      dirId: mountId,
      name: node.title,
    })

    await Promise.all(
      node.children.map(async (child) => {
        on.node.enter(child)
        if(!child.selected && child.getSelectedNodes().length === 0) {
          return null
        }

        if(child.isExpandable()) {
          await ingest({ node: child, mountId: dirId})
        } else {
          const ext = child.title.split('.').at(-1) as string
          const name = child.title.slice(0, -(ext.length + 1))
          if(name === '') {
            throw new Error(`Error Processing: "${child.title}": No Extension`)
          }
          const typeFile = (name === '' || name === ext)
          const type = mime.getType(ext) ?? `unknown/${ext}`
          if(!typeFile) {
            dirId = await addDirEntry({
              name,
              dirId,
            })
          }
          await addFile({
            dirId,
            cid: child.data.cid,
            type,
            size: child.data.size,
          })
        }
      })
    )
    return dirId
  }
}
