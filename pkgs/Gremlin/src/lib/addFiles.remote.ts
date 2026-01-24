import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import settings from '$lib/settings.svelte.ts'
import {
  connect as connectJanusGraph, connectToG,
} from '$lib/janusgraph.ts'

const { process } = gremlin
const { P, t: T, statics: __ } = process

const NewSpotsSchema = v.object({
  containerId: v.number(),
  files: v.array(v.object({
    cid: v.string(),
    type: v.string(),
    name: v.string(),
    size: v.number(),
  }))
})

export const addFiles = command(
  NewSpotsSchema,
  async ({ containerId, files }) => {
    const connection = connectJanusGraph()
    const now = new Date().toISOString()

    try {
      const g = connectToG(connection)
      let traversal = g.V().has(T.id, containerId)

      for(const { cid, name, type, size } of files) {
        const [, title, ext] = (
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
      console.error({ addFiles: error })
      return { error: (error as Error).message }
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({ 'addFiles Close Failed': error })
      }
    }
  }
)
