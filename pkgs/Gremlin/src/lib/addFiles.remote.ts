import { process, driver } from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'

const { t: T, merge: Merge } = process
const { statics: __ } = process
const { DriverRemoteConnection } = driver

const NewFilesSchema = v.object({
  container: v.number(),
  files: v.array(v.object({
    cid: v.string(),
    type: v.string(),
    name: v.string(),
    size: v.number(),
  }))
})

export const addFiles = command(
  NewFilesSchema,
  async ({ container, files }) => {
    const connection = new DriverRemoteConnection(
      'ws://localhost:8182/gremlin',
    )
    const g = process.traversal().withRemote(connection)

    const now = new Date().toISOString()

    try {
      let traversal = (
        g.V(new Map([[T.id, container]]))
      )

      for(const { cid, name, type, size } of files) {
        console.debug({ add: `${cid} (${type})` })

        traversal = (
          traversal
          .as('parent')
          .coalesce(
            (
              __.outE('CONTAINS')
              .has('path', 'svg')
              .inV()
            ),
            (
              __.addV('Spot')
              .property({ createdAt: now })
              .addE('CONTAINS')
              .from_('parent')
              .property({ path: 'svg', createdAt: now })
              .inV()
            ),
          )
        )

        await traversal.iterate()
      }
      return { success: true }
    } catch(error) {
      console.error({ error })
      return { error: (error as Error).message }
    } finally {
      await connection.close()
    }
  }
)
