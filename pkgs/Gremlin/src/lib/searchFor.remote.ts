import { process, structure, driver } from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'

const { statics: __ } = process
const { DriverRemoteConnection } = driver
const { Graph } = structure

const SearchSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false),
  })),
})

export const searchFor = query(
  SearchSchema,
  async ({
    path = [],
    options = {
      maxMountDepth: 10,
      allowCycles: false,
    },
  }): Promise<Array<{
    spot: any
    mountOrder: number
    warning?: string
  }>> => {
    const { maxMountDepth: maxDepth, allowCycles } = options
    const connection = new DriverRemoteConnection(
      'ws://localhost:8182/gremlin',
    )
    const g = process.traversal().withRemote(connection)

    try {
      let traversal = (
        g.V().has('label', 'Root')
        .project('current', 'orderAccum')
        .by(__.identity())
        .by(__.constant(0))
      )

      for(const pathElement of path) {
        if(!allowCycles) {
          traversal = traversal.simplePath()
        }

        traversal = traversal.flatMap(
          __.union(
            (
              __.select('current')
              .out('CONTAINS')
              .has('path', pathElement)
              .project('current', 'orderAccum')
              .by(__.identity())
              .by(__.select('orderAccum'))
            ),
            (
              __.as('state')
              .select('current')
              .repeat(__.outE('MOUNT').inV())
              .times(maxDepth)
              .emit()
              .as('mountedNode')
              .path()
              .as('traversalPath')
              .select('mountedNode')
              .out('CONTAINS')
              .has('path', pathElement)
              .as('result')
              .select('state', 'traversalPath', 'result')
              .project('current', 'orderAccum')
              .by(__.select('result'))
              .by(
                __.select('state')
                .select('orderAccum')
                .as('prevOrder')
                .select('traversalPath')
                .unfold()
                .hasLabel('MOUNT')
                .values('order')
                .fold()
                .coalesce(__.unfold().sum(), __.constant(0))
                .as('chainSum')
                .math('prevOrder + chainSum')
              )
            ),
          )
        )
      }

      const results = (
        await traversal
        .order()
        .by(__.select('orderAccum'))
        .select('current', 'orderAccum')
        .dedup()
        .toList()
      )

      console.debug({ results })

      return results.map((r: any) => ({
        spot: r.current,
        mountOrder: r.orderAccum
      }))
    } finally {
      await connection.close()
    }
  }
)
