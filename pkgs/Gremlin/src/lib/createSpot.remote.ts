import { process, driver } from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'

const { t: T, merge: Merge } = process
const { statics: __ } = process
const { DriverRemoteConnection } = driver

const NewSpotSchema = v.object({
  current: v.optional(v.string()),
  path: v.array(v.pipe(v.string(), v.nonEmpty())),
})

export const createSpot = command(
  NewSpotSchema,
  async ({ current, path }) => {
    const connection = new DriverRemoteConnection(
      'ws://localhost:8182/gremlin',
    )
    const g = process.traversal().withRemote(connection)

    const now = new Date().toISOString()

    console.debug({ create: path })

    try {
      let traversal = (
        g.mergeV(new Map([[T.label, 'Root']]))
        .option(Merge.onCreate, { createdAt: now })
      )
      for(const elem of path) {
        traversal = (
          traversal
          .as('parent')
          .coalesce(
            (
              __.outE('CONTAINS')
              .has('path', elem)
              .inV()
            ),
            (
              __.addV('Spot')
              .property({ createdAt: now })
              .addE('CONTAINS')
              .from_('parent')
              .property({ path: elem, createdAt: now })
              .inV()
            ),
          )
        )
      }

      await traversal.iterate()

      return { success: true }
    } catch(error) {
      console.error({ error })
      return { error: (error as Error).message }
    }     finally {
      await connection.close()
    }
  }
)
