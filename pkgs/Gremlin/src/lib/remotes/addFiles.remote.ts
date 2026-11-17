import gremlin from 'gremlin'
import * as v from 'valibot'
import { v7 as uuidV7 } from 'uuid'
import { error } from '@sveltejs/kit'
import { command } from '$app/server'
import { listing } from './listing.remote'
import settings from '#lib/settings.svelte.js'
import { splitName } from '#lib/mimetypes.js'
import { g, mergePath } from '#lib/server/janusgraph.js'

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
    const now = new Date().toISOString()

    console.debug({ addFiles: { path, files } })

    try {
      const { value: containerId = null } = (
        await (await mergePath({ path })).id().next()
      )

      // A file’s title, its name sans extension, is a Spot in the
      // container, except for `ext.ext`, which names no Spot & so
      // attaches to the container itself.
      const subpathFor = (name: string) => {
        const { title, ext } = splitName(name)
        return title === ext ? [] : [title]
      }

      // Resolved one at a time so files sharing a title, like
      // `a.png` & `a.svg`, share one Spot rather than racing to
      // create two.
      const spotIds = new Map<string, unknown>()
      for(const { name } of files) {
        const [title] = subpathFor(name)
        if(title == null || spotIds.has(title)) continue
        const { value: id = null } = await (
          (await mergePath({
            traversal: g().V(containerId),
            path: [title],
            now,
          }))
          .id()
          .next()
        )
        if(id == null) {
          throw new Error(`Couldn’t create a Spot for “${title}”.`)
        }
        spotIds.set(title, id)
      }

      // ToDo: Switch to AbortController fired on first error
      const retStaisi = await Promise.allSettled<Array<
        { status: 'fulfilled', value: unknown }
        | { status: 'rejected', reason: string | Error }
      >>(
        files.map(async ({ cid, name, type, size }) => {
          const { ext } = splitName(name)
          const [title] = subpathFor(name)
          const spotId = (
            title == null ? containerId : spotIds.get(title)
          )

          const genTraversal = () => g().V(spotId)

          type ||= `application/octet-stream;extension=${ext ?? '𝘶𝘯𝘬𝘯𝘰𝘸𝘯'}`

          if(settings.debugging) {
            console.debug({
              Add: (
                `${[...path, title ?? ''].join(' → ')}:`
                + ` ${cid} @ ${spotId} (${type})`
              ),
            })
          }

          const { value: existing } = await (
            genTraversal()
            .outE('AS')
            .inV()
            .hasLabel('Content')
            .has('type', type)
            .not(__.inE('PREVIOUS'))
            .project('id', 'cid')
            .by(__.id())
            .by(__.coalesce(
              __.out('IS').hasLabel('Blob').values('cid'),
              __.constant(null),
            ))
            .next()
          )

          const exists = existing && existing.get('cid') === cid
          const existingId = existing?.get('id') ?? null
          let id = existingId

          console.debug({ Path: { exists } })

          if(!exists) {
            id = (await (
              genTraversal()
              .as('spot')
              .addV('Content')
              .property('createdAt', now)
              .property('type', type)
              .property('uuid', uuidV7())
              .property('order', -1)
              .as('file')
              .addE('AS')
              .property('order', '-1')
              .from_('spot').to('file')
              .property('createdAt', now)
              .addV('Blob')
              .property('createdAt', now)
              .property('cid', cid)
              .property('size', size)
              .as('blob')
              .addE('IS')
              .from_('file').to('blob')
              .select('file').id()
              .next()
            )).value

            // if(existingId != null) {
            //   g().mergeE('PREVIOUS').from_(id).to(existingId)
            // }
          }
          return id
        })
      )
      const values = retStaisi.map((result) => {
        if(result.status === 'rejected') {
          const error = (
            (result.reason as Error)?.message ?? result.reason ?? null
          )
          console.debug({ Error: error })
          return { error }
        }
        return result.value
      })

      void listing({ path }).refresh()

      return values
    } catch(err) {
      console.error({ addFiles: err })
      throw error(500, (err as Error).message)
    }
  }
)
