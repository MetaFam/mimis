import { process, structure, driver } from 'gremlin'
import * as v from 'valibot'
import { form } from '$app/server'

const { t: T, merge: Merge } = process
const { statics: __ } = process
const { DriverRemoteConnection } = driver

const NewSpotSchema = v.object({
  path: v.pipe(v.string(), v.nonEmpty()),
})

export const createSpot = form(
  NewSpotSchema,
  async ({ path }) => {
    const connection = new DriverRemoteConnection(
      'ws://localhost:8182/gremlin',
    )
    const g = process.traversal().withRemote(connection)

    const now = new Date().toISOString()

    try {
      await (
        g.mergeV(new Map([[T.label, 'Root']]))
        .option(Merge.onCreate, { createdAt: now })
        .as('root')
        .coalesce(
          (
            __.outE('CONTAINS')
            .has('path', path)
            .constant('Match')
          ),
          (
            __.addV('Spot')
            .property({ createdAt: now })
            .as('spot')
            .addE('CONTAINS')
            .from_('root')
            .to('spot')
            .property({ path, createdAt: now })
          ),
        )
        .iterate()
      )
    } catch(error) {
      console.error({ error })
    }  finally {
      await connection.close()
    }
  }
)
