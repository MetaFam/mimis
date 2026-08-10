import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import { error } from '@sveltejs/kit'
import settings from '$lib/settings.svelte'
import {
  connect as connectJanusGraph, connectToG, mergePath,
} from '$lib/server/janusgraph'
import { representations } from './representations.remote'
import { spotId } from './spotId.remote'
import { searchFor } from './searchFor.remote'

const { process } = gremlin
const { statics: __ } = process

const NewSpotsSchema = v.object({
  path: v.array(v.string()),
  files: v.array(v.object({
    cid: v.string(),
    type: v.string(),
    name: v.string(),
    size: v.number(),
  })),
})

export const addFiles = command(
  NewSpotsSchema,
  async ({ path, files }) => {
    const connection = connectJanusGraph()
    const now = new Date().toISOString()

    console.debug({ addFiles: { path, files } })

    try {
      const containerId = await spotId({ path, create: true })

      // ToDo: Switch to AbortController fired on first error
      const retStaisi = await Promise.allSettled<Array<
        { status: 'fulfilled', value: unknown }
        | { status: 'rejected', reason: string | Error }
      >>(
        files.map(async ({ cid, name, type, size }) => {
          const [, title, ext] = (
            name.match(/^(.+)\.([^.]+)$/) ?? [null, name, null]
          )

          const path: Array<string> = []

          // Files are named ext.ext so there's no
          // context information in the file name
          if(title !== ext) {
            path.push(title)
          }

          const genTraversal = async (
            { create = false }: { create: boolean } = { create: false }
          ) => {
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
          void searchFor({ path }).refresh()
          return fileId
        })
      )
      const values = retStaisi.map((result) => {
        if(result.status === 'rejected') {
          const error = (result.reason as Error)?.message ?? result.reason ?? null
          console.debug({ status: result.status, error })
          return { error }
        }
        return result.value
      })

      void representations({ path }).refresh()

      return values
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
