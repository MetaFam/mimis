import type { WunderbaumNode } from 'wb_node'
import { getNeo4j } from '$lib/neo4jDriver'
import { Nöopoint } from '$lib'

export async function wunder2Neo4j(
  root: WunderbaumNode,
  path: Array<string> = [],
  onAdd?: (msg: string) => void,
) {
  const driver = getNeo4j()

  try {
    const pathStr = `/${path.join('/')}${path.length > 0 ? '/' : ''}`
    const rootId = await ingest(root)
    await mount({ rootId })
    onAdd?.(`Mounted ${rootId} at ${pathStr}.`)
    return rootId
  } finally {
    await driver.close()
  }

  async function createIPFSDir() {
    const session = driver.session()
    try {
      const query = `
        CREATE (dir:IPFS:Directory)
        RETURN elementId(dir) AS id
      `
      const { records } = await session.run(query)
      onAdd?.('Created Directory')
      return records[0].get('id')
    } finally {
      await session.close()
    }
  }

  async function addDirEntry(
    { dirId, itemId, name, type = ':IPFS:Directory', rship = ':CONTAINS' }:
    { dirId?: string, itemId: string, name?: string, type?: string, rship?: string }
  ) {
    const session = driver.session()
    try {
      const query = `
        MATCH (entry) WHERE elementId(entry) = $itemId
        ${dirId == null ? (
          `CREATE (dir${type})`
        ) : (
          'MATCH (dir) WHERE elementId(dir) = $dirId'
        )}
        MERGE (dir)-[c${rship} ${name != null ? '{ path: $name }' : ''}]->(entry)
        RETURN elementId(dir) AS id
      `
      const { records } = await session.run(
        query, { itemId, name, dirId }
      )
      const retId = records[0].get('id')
      onAdd?.(`Added ${name} → ${itemId} (${dirId} → ${retId})`)
      return retId
    } finally {
      await session.close()
    }
  }

  async function addFile(
    { cid, type, size }:
    { cid: string, type: string | null, size: number }
  ) {
    const session = driver.session()
    try {
      const query = `
        MERGE (file:IPFS:File { cid: $cid })
        MERGE (item:Nöopoint)-[:EMBODIED_AS]->(file)
        SET file.mimetype = CASE WHEN $type IS NOT NULL THEN $type END
        SET file.size = $size
        RETURN elementId(item) AS id
      `
      const { records } = await session.run(
        query, { cid, type, size }
      )
      onAdd?.(`Added /${cid} (${type})`)
      return records[0].get('id')
    } finally {
      await session.close()
    }
  }

  async function mount({ rootId }: { rootId: string }) {
    const session = driver.session()

    const rootQ = `
      MERGE (r:Root)
      SET r:Mount:Directory
      RETURN elementId(r) AS id
    `
    const { records } = await session.run(rootQ)
    let current = records[0].get('id')

    onAdd?.(`Added Root: ${current}`)

    while(path.length > 1) {
      const pathQ = `
        MATCH (dir)
        WHERE elementId(dir) = $current
        MERGE (dir)-[:CONTAINS {path: $elem}]->(item)
        SET item:Mount:Directory
        RETURN elementId(item) as id
      `
      const elem = path.shift()
      const { records } = await session.run(
        pathQ, { current, elem }
      )
      current = records[0].get('id')
    }

    if(!root.children) {
      throw new Error('Root has no children.')
    }

    const mountQ = `
      MATCH (mount)
      MATCH (base)
      WHERE elementId(mount) = $current
      AND elementId(base) = $rootId
      MERGE (mount)-[:CONNECTS { path: $name }]->(base)
    `
    await session.run(mountQ, { current, rootId, name: path[0] })

    await session.close()
  }

  type Node = {
    id: string
    title: string
  }

  async function ingest(node: WunderbaumNode) {
    if(!node.children) throw new Error(`Not a directory: ${node.title}.`)
    if(node.children.length === 0) throw new Error(`Empty directory: ${node.title}.`)

    const baseId = await createIPFSDir()
    await Promise.all(
      node.children.map(async (child) => {
        if(!child.selected && child.getSelectedNodes().length === 0) {
          return null
        }

        if(child.children) {
          await addDirEntry({
            itemId: await ingest(child),
            dirId: baseId,
            name: child.title,
          })
        } else {
          const ext = child.title.split('.').at(-1) as string
          const name = child.title.slice(0, -(ext.length + 1))
          const type = (() => {
            switch(ext) {
              case 'svg': return 'image/svg+xml'
              case 'png': return 'image/png'
              case 'jpg': case 'jpeg': return 'image/jpeg'
              default: return null
            }
          })()
          let itemId = await addFile({
            cid: child.data.cid,
            type,
            size: child.data.size,
          })
          itemId = await addDirEntry({
            itemId,
            dirId: (name === ext ? baseId : undefined),
            rship: ':REPRESENTED_BY',
          })
          if(name !== ext) {
            await addDirEntry({
              itemId,
              name,
              dirId: baseId,
            })
          }
        }
      })
    )
    return baseId
  }
}
