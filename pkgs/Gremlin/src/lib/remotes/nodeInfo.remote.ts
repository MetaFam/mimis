import gremlin from 'gremlin'
import * as v from 'valibot'
import { error } from '@sveltejs/kit'
import { query } from '$app/server'
import {
  connect as connectJanusGraph, connectToG, mergeSpotRoot,
} from '$lib/server/janusgraph.ts'
import { getSessionAddress } from '$lib/server/auth.ts'

const { statics: __, t: T, EnumValue } = gremlin.process

const IdSchema = v.optional(v.nullable(v.number()))

export const nodeInfo = query(
  IdSchema,
  async (nodeId?: number | null) => {
    const connection = await connectJanusGraph()
    const now = new Date().toISOString()

    try {
      const g = connectToG(connection)

      if(nodeId == null) {
        const address = await getSessionAddress()
        if(!address) return null

        const { value: rootId } = await (
          (await mergeSpotRoot({ traversal: connectToG(connection), address, now }))
          .id().next()
        )
        nodeId = rootId

        if(nodeId == null) {
          throw error(500, `SpotRoot for ${address} not found.`)
        }
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
          targetId: (
            IN as Map<InstanceType<typeof EnumValue>, unknown>
          ).get(T.id),
        }
      })
      return { label, id, properties, edges }
    } finally {
      await connection.close()
    }
  }
)