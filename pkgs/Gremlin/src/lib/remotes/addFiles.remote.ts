import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import { error } from '@sveltejs/kit'
import settings from '$lib/settings.svelte.ts'
import {
  connect as connectJanusGraph, connectToG, mergePath,
  mergeSpotRoot,
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

    console.debug({ addFiles: { containerId, files } })

    try {
      // ToDo: Switch to AbortController fired on first error
      const retStaisi = await Promise.allSettled(
        files.map(async ({ cid, name, type, size }) => {
          const [_, title, ext] = (
            name.match(/^(.+)\.([^.]+)$/) ?? [null, name, null]
          )

          const path: Array<string> = []

          // Files are named ext.ext so there's no
          // context information in the file name
          if(title !== ext) {
            path.push(title)
          }

          const genTraversal = async ({ create = false } = { create: false }) => {
            // const traversal = await (
            //   mergeSpotRoot({ traversal: connectToG(connection), create })
            // )
            return (
              mergePath({
                traversal: connectToG(connection), containerId, path, create,
              })
            )
          }

          type ||= `application/octet-stream;extension=${ext ?? '𝘶𝘯𝘬𝘯𝘰𝘸𝘯'}`

          if(settings.debugging) {
            console.debug({
              Add: `${path.join(' → ')}: ${cid} @ ${containerId} (${type})`
            })
          }

          const { value: existing } = await (
            (await genTraversal())
            .outE('REPRESENTATION')
            .inV()
            .has('type', type)
            .not(__.inE('PREVIOUS'))
            .project('id', 'cid')
            .by(__.id())
            .by('cid')
            .next()
          )

          console.debug({ existing, type })

          if(existing && existing.get('cid') === cid) {
            return existing.get('id')
          }

          let traversal = (
            (await genTraversal({ create: true }))
            .as('spot')
            .addV('File')
            .property('createdAt', now)
            .property('cid', cid)
            .property('type', type)
            .property('size', size)
            .as('file')
            .addE('REPRESENTATION')
            .from_('spot')
            .property('createdAt', now)
          )

          if(existing) {
            traversal = (
              traversal
              .V(existing.get('id'))
              .addE('PREVIOUS')
              .from_('file')
              .property('createdAt', now)
            )
          }

          const { value: fileId } = await (
            traversal.select('file').id().next()
          )
          return fileId
        })
      )
      console.debug({ retStaisi })
      return retStaisi.map(({ status, value, reason }) => {
        if(status === 'rejected') {
          const error = (reason as Error)?.message ?? null
          console.debug({ status, error })
          return { error }
        }
        return value
      })
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
