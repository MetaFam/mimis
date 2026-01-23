import { process, driver } from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import { connect as connectJanusGraph } from '$lib/janusgraph'
import settings from './settings.svelte'

const { P, t: T, merge: Merge } = process
const { statics: __ } = process
const { DriverRemoteConnection } = driver

const NewFilesSchema = v.object({
  containerId: v.number(),
  files: v.array(v.object({
    cid: v.string(),
    type: v.string(),
    name: v.string(),
    size: v.number(),
  }))
})

export const addFiles = command(
  NewFilesSchema,
  async ({ containerId, files }) => {
    const { g, connection } = connectJanusGraph()
    const now = new Date().toISOString()

    try {
      let traversal = (
        g.V().has(T.id, containerId)
      )

      for(const { cid, name, type, size } of files) {
        const [_, title, ext] = (
          name.match(/^(.*)\.([^.]+)$/) ?? [null, name, '']
        )

        if(settings.debugging) {
          console.debug({
            Add: `${title}⁄${ext}: ${cid} @ ${containerId} (${type})`
          })
        }

        if(title !== ext && title.length > 0) {
          traversal = (
            traversal
            .as('grandparent')
            .coalesce(
              (
                __.outE('CONTAINS')
                .has('path', title)
                .inV()
              ),
              (
                __.addV('Spot')
                .property({ createdAt: now })
                .addE('CONTAINS')
                .from_('grandparent')
                .property({ path: title, createdAt: now })
                .inV()
              ),
            )
          )
        }

        traversal = (
          traversal
          .as('parent')
          .coalesce(
            (
              __.outE('CONTAINS')
              .has('path', ext)
              .inV()
            ),
            (
              __.addV('Spot')
              .property({ createdAt: now })
              .addE('CONTAINS')
              .from_('parent')
              .property({ path: ext, createdAt: now })
              .inV()
            ),
          )
          .as('new')
        )

        traversal = (
          traversal
          .coalesce(
            (
              __.outE('REPRESENTATION')
              .has('type', type)
              .inV()
              .has('cid', cid)
              .not(__.inE('PREVIOUS'))
            ),
            (
              __.addV('File')
              .property({ createdAt: now, cid, size })
              .as('file')
              .addE('REPRESENTATION')
              .from_('new')
              .property({ type, createdAt: now })
              .outV()
              .outE('REPRESENTATION')
              .has('type', type)
              .inV()
              .where(P.neq('file'))
              .not(__.inE('PREVIOUS'))
              .addE('PREVIOUS')
              .from_('file')
              .property({ createdAt: now })
            ),
          )
        )
      }

      await traversal.iterate()
      return { success: true }
    } catch(error) {
      console.error({ 'In addFiles': error })
      return { error: (error as Error).message }
    } finally {
      await connection.close()
    }
  }
)
