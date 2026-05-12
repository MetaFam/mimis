import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import settings from '$lib/settings.svelte.ts'
import {
  connect as connectJanusGraph, connectToG, mergePath,
} from '$lib/server/janusgraph.ts'

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
      return {
        spotIds: await Promise.all(
          files.map(async ({ cid, name, type, size }) => {
            const path = (
              name.match(/^(?:(.*)\.)?([^.]+)$/) ?? [null, name, null]
            ).filter(Boolean) as Array<string>

            const genTraversal = async () => {
              let traversal = connectToG(connection)

              // Early versions named files ext.ext to keep information out
              // of the filename while maintaining legacy compatibility,
              if(!(path.length === 2 && path.at(0) === path.at(-1))) {
                traversal = await (
                  mergePath({ traversal, containerId, path })
                )
              }
              return traversal
            }

            if(settings.debugging) {
              console.debug({
                Add: `${path.join(' → ')}: ${cid} @ ${containerId} (${type})`
              })
            }

            let traversal = genTraversal()

            if(!await (
              genTraversal()
              .outE()
              .has(T.label, 'REPRESENTATION')
              .in_('File')
              .has('cid', cid)
              .has('type', type)
              .not(__.inE('PREVIOUS'))
              .hasNext()
            )) {
              traversal = (
                traversal
                .as('spot')
                .addE()
                .has(T.label, 'REPRESENTATION')
                .addV()
                .has(T.label, 'File')
                .property({ createdAt: now, cid, type, size })
                .as('file')
                .addE('REPRESENTATION')
                .from_('spot')
                .property({ createdAt: now })
                .addE()
                .has(T.label, 'PREVIOUS')
                .from_('file')
              )
            }

            const { value: spotId } = (await traversal).id().iterate()
            return spotId
          })
        )
      }
    } catch(error) {
      console.error({ addFiles: error })
      throw error(500, (error as Error).message)
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({ 'addFiles Close Failed': error })
      }
    }
  }
)
