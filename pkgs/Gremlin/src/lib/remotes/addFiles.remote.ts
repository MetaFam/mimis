import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import { error } from '@sveltejs/kit'
import settings from '$lib/settings.svelte.ts'
import {
  connect as connectJanusGraph, connectToG, mergePath,
} from '$lib/server/janusgraph.ts'

const { process } = gremlin
const { t: T, statics: __ } = process

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
        fileIds: await Promise.all(
          files.map(async ({ cid, name, type, size }) => {
            const [_, title, ext] = (
              name.match(/^(?:(.*)\.)?([^.]+)$/) ?? [null, name, null]
            )

            const path: Array<string> = []

            if(title !== ext) {
              path.push(title)
            }

            const genTraversal = async () => {
              return await (
                mergePath({
                  traversal: connectToG(connection), containerId, path,
                })
              )
            }

            if(settings.debugging) {
              console.debug({
                Add: `${path.join(' → ')}: ${cid} @ ${containerId} (${type})`
              })
            }

            const { value: existing } = await (
              (await genTraversal())
              .outE()
              .has(T.label, 'REPRESENTATION')
              .in_('File')
              .has('type', type)
              .not(__.inE('PREVIOUS'))
              .project('id', 'cid')
              .by(__.id())
              .by('cid')
              .next()
            )

            if(existing && existing.cid === cid) {
              return existing.id
            }

            let traversal = (
              (await genTraversal())
              .as('spot')
              .addV()
              .has(T.label, 'File')
              .property({ createdAt: now, cid, type, size })
              .as('file')
              .addE('REPRESENTATION')
              .from_('spot')
              .property({ createdAt: now })
            )

            if(existing) {
              traversal = (
                traversal
                .V(existing.id)
                .addE('PREVIOUS')
                .from_('file')
                .property({ createdAt: now })
              )
            }

            const { value: fileId } = await traversal.select('file').id().next()
            return fileId
          })
        )
      }
    } catch(err) {
      console.error({ addFiles: err })
      throw error(500, (err as Error).message)
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({ 'addFiles Close Failed': error })
      }
    }
  }
)
