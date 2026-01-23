import { process, structure, driver } from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'

const { statics: __, t: T } = process
const { DriverRemoteConnection } = driver
const { Graph } = structure

const SearchSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false),
  })),
})

export const spotId = query(
  SearchSchema,
  async ({
    path = [],
    options = {
      maxMountDepth: 10,
      allowCycles: false,
    },
  }): Promise<number | { error: string }> => {
    const { maxMountDepth: maxDepth, allowCycles } = options
    const connection = new DriverRemoteConnection(
      'ws://localhost:8182/gremlin',
    )
    try {
      const g = process.traversal().withRemote(connection)

      path = path.filter(Boolean)

      let traversal = g.V().has(T.label, 'Root')

      for (const element of path) {
        if (!allowCycles) {
          traversal = traversal.simplePath()
        }

        traversal = (
          traversal
          .until(
            __.not(__.outE('MOUNT'))
            .or().loops().is(maxDepth)
          )
          .repeat(
            __.outE('MOUNT')
            .order()
            .by('order')
            .inV()
          )
          .outE('CONTAINS')
          .has('path', element)
          .inV()
        )
      }

      traversal = traversal.id().limit(1)
      const result = await traversal.next()
      return result.value
    } catch(err) {
      console.error({ 'In spotId': err })
      return { error: (err as Error).message }
    } finally {
      await connection.close()
    }
  }
)
