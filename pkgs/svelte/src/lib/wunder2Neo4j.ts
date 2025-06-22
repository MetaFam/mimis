import type { WunderbaumNode } from 'wb_node'
import { getNeo4j } from '$lib/neo4jDriver'

export async function wunder2Neo4j(
  root: WunderbaumNode,
  path: Array<string> = [],
  onAdd?: (msg: string) => void,
) {
  const driver = getNeo4j()

  try {
    const pathStr = `/${path.join('/')}${path.length > 0 ? '/' : ''}`
    const rootCID = await ingest(root)
    onAdd?.(`Mounted ${rootCID} at ${pathStr}.`)
    return rootCID
  } finally {
    await driver.close()
  }

  async function addDirEntry(
    { dirCID, entryCID, name }:
    { dirCID: string, entryCID: string, name: string }
  ) {
    const session = driver.session()
    const query = `
      MATCH (e:IPFS { cid: $entryCID })
      MERGE (d:IPFS:Directory { cid: $dirCID })
      MERGE (d)-[c:CONTAINS]->(e)
      SET c.path = $name
    `
    await session.run(query, { dirCID, entryCID, name })

    onAdd?.(`Added ${name} → ${entryCID}`)

    await session.close()
  }

  async function addFile(
    { cid, type, size }:
    { cid: string, type: string | null, size: number }
  ) {
    const session = driver.session()
    const query = `
      MERGE (e:IPFS:File { cid: $cid })
      SET e.mimetype = CASE WHEN $type IS NOT NULL THEN $type END
      SET e.size = $size
    `
    await session.run(query, { cid, type, size })

    onAdd?.(`Added /${cid} (${type})`)

    await session.close()
  }

  async function mount() {
    const session = driver.session()

    const rootQ = `
      MERGE (r:Mount:Root)
      RETURN elementId(r) as id
    `
    const { records } = await session.run(rootQ)
    let next = records[0].get('id')

    onAdd?.(`Added Root: ${next}`)

    while(path.length > 0) {
      const pathQ = `
        MATCH (p:Mount)
        WHERE elementId(p) = $next
        MERGE (p)-[:CONTAINS {path: $elem}]->(n:Mount)
        RETURN elementId(n) as id
      `
      const elem = path.shift()
      const { records } = await session.run(
        pathQ, { next, elem }
      )
      next = records[0].get('id')
    }

    if(!root.children) {
      throw new Error('Root has no children.')
    }

    const mountQ = `
      MATCH (m:Mount)
      WHERE elementId(m) = $next
      MATCH (i:IPFS { cid: $cid })
      MERGE (m)-[:CONNECTS {order: 1, path: $name}]->(i)
    `
    for(const child of root.children) {
      const { title: name, data: { cid } } = child
      onAdd?.(`Mounting: ${cid} @ ${name}`)
      await session.run(mountQ, { next, cid, name })
    }
    await session.close()
  }

  async function ingest(node: WunderbaumNode) {
    if(!node.children) {
      throw new Error(`Not A Directory: ${node.title}`)
    }
    for(const child of node.children) {
      if(!child.selected && child.getSelectedNodes().length === 0) {
        continue
      }

      if(child.children) {
        await ingest(child)
      } else {
        const type = (() => {
          switch(child.title.split('.').at(-1)?.toLowerCase()) {
            case 'svg': return 'image/svg+xml'
            case 'png': return 'image/png'
            case 'jpg': case 'jpeg': return 'image/jpeg'
            default: return null
          }
        })()

        await addFile({
          cid: child.data.cid,
          type,
          size: child.data.size,
        })
      }
      if(node.data.cid) {
        await addDirEntry({
          dirCID: node.data.cid,
          entryCID: child.data.cid,
          name: child.title,
        })
      } else {
        await mount()
        return child.data.cid
      }
    }
    return node.data.cid
  }
}
