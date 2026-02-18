import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { connect as connectJanusGraph, connectToG } from '$lib/janusgraph.ts'

const { statics: __, t: T, EnumValue } = gremlin.process

const IdSchema = v.optional(v.nullable(v.number()))

export const nodeInfo = query(
  IdSchema,
  async (nodeId?: number | null) => {
    const connection = await connectJanusGraph()

    try {
      const g = connectToG(connection)

      if(nodeId == null) {
        const rootId = await g.V().has(T.label, 'Root').id().next()
        nodeId = rootId.value
      }

      const vertexMap = await g.V(nodeId).elementMap().next()
      const { id, label, ...properties } = (
        Object.fromEntries(vertexMap.value.entries())
      )
      const edgeResults = await (
        g.V(nodeId)
        .outE('CONTAINS', 'REPRESENTATION')
        .elementMap()
        .toList()
      ) as Array<Map<string, unknown>>

      const edges = edgeResults.map((result) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { IN, OUT: _out, id: _id, label, ...properties } = (
          Object.fromEntries(result.entries())
        )
        return {
          label,
          properties,
          targetId: (IN as Map<EnumValue, unknown>).get(T.id),
        }
      })
      return { label, id, properties, edges }
    } finally {
      await connection.close()
    }
  }
)