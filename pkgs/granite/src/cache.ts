import gremlin from 'gremlin'
import {
  isAddress,
  CID,
  type Address,
  type NodeDoc,
  type NodeMountDoc,
  type UpdateDoc,
} from './codec.ts'
import type { Mount, TraversalNode } from './mount.ts'
import type { CacheView } from './resolve.ts'

const { statics: __, P } = gremlin.process
const { DriverRemoteConnection } = gremlin.driver

// DAG-asserted properties are flattened under this prefix (trailing space
// included), marking provenance and leaving no reserved keys — publishers
// may use any prop name, including `name`.
export const propPrefix = 'mïm ⊫ '

const scalar = (value: unknown): string | number | boolean => (
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? (
    value
  ) : (
    JSON.stringify(value)
  )
)

export const gremlinCache = (url: string): CacheView => {
  const connection = new DriverRemoteConnection(url)
  const g = gremlin.process.AnonymousTraversalSource.traversal().withRemote(connection)

  const nodeVertex = (cid: string) => (
    g.V().has('Node', 'cid', cid)
    .fold()
    .coalesce(
      __.unfold(),
      __.addV('Node').property('cid', cid),
    )
  )

  const publisherVertex = (address: string) => (
    g.V().has('Publisher', 'address', address)
    .fold()
    .coalesce(
      __.unfold(),
      __.addV('Publisher').property('address', address),
    )
  )

  const mountEdges = async (fromCid: string, mounts: NodeMountDoc[]) => {
    for(const mount of mounts) {
      const source = CID.asCID(mount.source)
      if(source) {
        await nodeVertex(source.toString()).toList()
        await g.V().has('Node', 'cid', fromCid).as('a')
        .V().has('Node', 'cid', source.toString())
        .addE('MOUNT').from_('a').property('order', mount.order)
        .toList()
      } else {
        await publisherVertex(mount.source as string).toList()
        let traversal = g.V().has('Node', 'cid', fromCid).as('a')
        .V().has('Publisher', 'address', mount.source as string)
        .addE('MOUNT').from_('a').property('order', mount.order)
        if(mount.path) {
          traversal = traversal.property('path', mount.path)
        }
        await traversal.toList()
      }
    }
  }

  return {
    getNode: async (cid) => {
      const id = cid.toString()
      const expanded = await g.V().has('Node', 'cid', id).has('expanded', true).toList()
      if(expanded.length === 0) {
        return undefined
      }
      const edgeRows = await g.V().has('Node', 'cid', id)
      .outE('EDGE')
      .project('name', 'child')
      .by(__.values('name'))
      .by(__.inV().values('cid'))
      .toList()
      const edges: Record<string, CID> = {}
      for(const row of edgeRows as Map<string, string>[]) {
        edges[row.get('name') as string] = CID.parse(row.get('child') as string)
      }
      const mountRows = await g.V().has('Node', 'cid', id)
      .outE('MOUNT')
      .project('order', 'target', 'path')
      .by(__.values('order'))
      .by(__.inV().coalesce(__.values('cid'), __.values('address')))
      .by(__.coalesce(__.values('path'), __.constant('')))
      .toList()
      const mounts: NodeMountDoc[] = (mountRows as Map<string, unknown>[]).map((row) => {
        const target = row.get('target') as string
        const path = row.get('path') as string
        return {
          source: isAddress(target) ? target : CID.parse(target),
          ...(path === '' ? {} : { path }),
          order: Number(row.get('order')),
        }
      })
      const node: TraversalNode = {
        edges,
        mounts,
      }
      return node
    },

    putNode: async (cid, node: NodeDoc) => {
      const id = cid.toString()
      const already = await g.V().has('Node', 'cid', id).has('expanded', true).toList()
      if(already.length > 0) {
        return
      }
      await nodeVertex(id).property('expanded', true).toList()
      for(const [name, edge] of Object.entries(node.edges)) {
        const child = edge.child.toString()
        await nodeVertex(child).toList()
        let traversal = g.V().has('Node', 'cid', id).as('a')
        .V().has('Node', 'cid', child)
        .addE('EDGE').from_('a').property('name', name)
        for(const [key, value] of Object.entries(edge.props ?? {})) {
          traversal = traversal.property(`${propPrefix}${key}`, scalar(value))
        }
        await traversal.toList()
      }
      await mountEdges(id, node.mounts)
    },

    putUpdate: async (cid, update: UpdateDoc) => {
      const id = cid.toString()
      await (
        g.V().has('Update', 'cid', id)
        .fold()
        .coalesce(
          __.unfold(),
          __.addV('Update')
          .property('cid', id)
          .property('publisher', update.publisher)
          .property('at', update.at),
        )
        .toList()
      )
      await nodeVertex(update.root.toString()).toList()
      await (
        g.V().has('Update', 'cid', id)
        .where(__.not(__.outE('ROOT')))
        .as('u')
        .V().has('Node', 'cid', update.root.toString())
        .addE('ROOT').from_('u')
        .toList()
      )
      if(update.prev) {
        const prev = update.prev.toString()
        await g.V().has('Update', 'cid', prev)
        .fold()
        .coalesce(
          __.unfold(),
          __.addV('Update').property('cid', prev),
        )
        .toList()
        await g.V().has('Update', 'cid', id)
        .where(__.not(__.outE('PREV')))
        .as('u')
        .V().has('Update', 'cid', prev)
        .addE('PREV').from_('u')
        .toList()
      }
    },

    registerStack: async (key, mounts: Mount[], alias) => {
      let stack = g.V().has('Stack', 'key', key)
      .fold()
      .coalesce(
        __.unfold(),
        __.addV('Stack').property('key', key),
      )
      .property('hydratedAt', Math.floor(Date.now() / 1000))
      .property('stale', false)
      if(alias) {
        stack = stack.property('name', alias)
      }
      await stack.toList()
      await g.V().has('Stack', 'key', key).outE('MOUNT').drop().toList()
      for(const [order, mount] of mounts.entries()) {
        const source = CID.asCID(mount.source)
        if(source) {
          const id = source.toString()
          await g.V().has('Update', 'cid', id)
          .fold()
          .coalesce(
            __.unfold(),
            __.addV('Update').property('cid', id),
          )
          .toList()
          await g.V().has('Stack', 'key', key).as('s')
          .V().has('Update', 'cid', id)
          .addE('MOUNT').from_('s').property('order', order)
          .toList()
        } else {
          await publisherVertex(mount.source as string).toList()
          await g.V().has('Stack', 'key', key).as('s')
          .V().has('Publisher', 'address', mount.source as string)
          .addE('MOUNT').from_('s').property('order', order)
          .toList()
        }
      }
    },

    markStale: async (key) => {
      await g.V().has('Stack', 'key', key).property('stale', true).toList()
    },

    // Repoints LATEST and marks every Stack whose hydrated subgraph
    // reaches this publisher (directly or over node-level MOUNTs) stale.
    notePublished: async (publisher: Address, update: CID) => {
      const id = update.toString()
      await publisherVertex(publisher).toList()
      await g.V().has('Update', 'cid', id)
      .fold()
      .coalesce(
        __.unfold(),
        __.addV('Update').property('cid', id).property('publisher', publisher),
      )
      .toList()
      await g.V().has('Publisher', 'address', publisher).outE('LATEST').drop().toList()
      await g.V().has('Publisher', 'address', publisher).as('p')
      .V().has('Update', 'cid', id)
      .addE('LATEST').from_('p')
      .toList()
      await g.V().has('Publisher', 'address', publisher)
      .in_('MOUNT')
      .choose(
        __.hasLabel('Stack'),
        __.identity(),
        __.repeat(__.in_('EDGE', 'ROOT', 'MOUNT')).until(
          __.hasLabel('Stack').or().loops().is(P.gte(20)),
        ).hasLabel('Stack'),
      )
      .dedup()
      .property('stale', true)
      .toList()
    },

    close: async () => {
      await connection.close()
    },
  }
}