import gremlin from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'
import { error, isHttpError } from '@sveltejs/kit'
import {
  connect as connectJanusGraph, connectToG,
} from '$lib/server/janusgraph.ts'
import settings from '$lib/settings.svelte.ts'

const { statics: __, t: T } = gremlin.process

export interface GraphNode {
  id: string
  label: string
  properties: Record<string, unknown>
  // Simulation coordinates added by force-graph once rendering.
  x?: number
  y?: number
}

export interface GraphLink {
  id: string
  label: string
  source: string
  target: string
  properties: Record<string, unknown>
}

export interface GraphData {
  nodes: Array<GraphNode>
  links: Array<GraphLink>
}

const GraphSchema = v.optional(v.object({
  limit: v.optional(v.number(), 1000),
}), {})

// JanusGraph vertex/edge ids are not always JSON-safe numbers, so coerce them
// to strings for use as force-graph node keys.
const toId = (value: unknown) => String(value)

export const graphData = query(
  GraphSchema,
  async ({ limit = 1000 } = {}): Promise<GraphData> => {
    const connection = connectJanusGraph()

    try {
      const g = connectToG(connection)

      const vertexMaps = (
        await g.V().limit(limit).elementMap().toList()
      ) as Array<Map<unknown, unknown>>

      const nodes = vertexMaps.map((vertex) => {
        const { id, label, ...properties } = (
          Object.fromEntries(vertex.entries())
        )
        return { id: toId(id), label: String(label), properties }
      })

      const nodeIds = new Set(nodes.map(({ id }) => id))

      const edgeMaps = (
        await g.E()
        .limit(limit * 4)
        .project('id', 'label', 'source', 'target', 'properties')
        .by(T.id)
        .by(T.label)
        .by(__.outV().id())
        .by(__.inV().id())
        .by(__.valueMap())
        .toList()
      ) as Array<Map<string, unknown>>

      const links = (
        edgeMaps
        .map((edge) => {
          const {
            id, label, source, target, properties,
          } = Object.fromEntries(edge.entries())
          return {
            id: toId(id),
            label: String(label),
            source: toId(source),
            target: toId(target),
            properties: Object.fromEntries(
              (properties as Map<string, unknown>).entries(),
            ),
          }
        })
        // Drop edges whose endpoints fell outside the vertex limit so the
        // force graph never references a missing node.
        .filter(({ source, target }) => (
          nodeIds.has(source) && nodeIds.has(target)
        ))
      )

      if(settings.debugging) {
        console.debug({ graphData: { nodes: nodes.length, links: links.length } })
      }
      return { nodes, links }
    } catch(err) {
      if(isHttpError(err)) throw err
      let msg = (err as Error).message
      if((err as Error).name === 'TypeError') {
        msg = (
          'Connection Error: Could not connect to JanusGraph'
          + ` @ ${settings.janusGraphURL}.`
        )
      }
      console.error({ graphData: err })
      throw error(500, `Graph Export: "${msg}"`)
    } finally {
      try {
        if(connection) {
          await connection.close()
        }
      } catch(err) {
        console.error({ 'graphData Close Failed': err })
      }
    }
  },
)
