import * as v from 'valibot'
import { error } from '@sveltejs/kit'
import { command } from '$app/server'
import { listing } from './listing.remote'
import settings from '#lib/settings.svelte.js'
import { splitName } from '#lib/mimetypes.js'
import { putRepresentation } from '#lib/server/edits.js'
import { g, mergePath, type Id } from '#lib/server/janusgraph.js'

const NewSpotsSchema = v.object({
  path: v.array(v.string()),
  /** Each file is a new Content, ranked last, not a new version (FR-017). */
  alternative: v.optional(v.boolean(), false),
  /** Every file goes onto the Spot at `path`, whatever its name. */
  onto: v.optional(v.boolean(), false),
  files: v.array(v.object({
    cid: v.string(),
    type: v.string(),
    name: v.string(),
    size: v.number(),
  })),
})

export const addFiles = command(
  NewSpotsSchema,
  async ({ path, files, alternative, onto }) => {
    const now = new Date().toISOString()

    console.debug({ addFiles: { path, files } })

    try {
      const { value: containerId = null } = (
        await (await mergePath({ path })).id().next()
      )

      // A file’s title, its name sans extension, is a Spot in the
      // container, except for `ext.ext`, which names no Spot & so
      // attaches to the container itself, as every file does `onto` it.
      const subpathFor = (name: string) => {
        const { title, ext } = splitName(name)
        return (onto || title === ext) ? [] : [title]
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
      const retStaisi = await Promise.allSettled(
        files.map(async ({ cid, name, type, size }) => {
          const { ext } = splitName(name)
          const [title] = subpathFor(name)
          const spotId = (
            title == null ? containerId : spotIds.get(title)
          )

          type ||= `application/octet-stream;extension=${ext ?? '𝘶𝘯𝘬𝘯𝘰𝘸𝘯'}`

          if(settings.debugging) {
            console.debug({
              Add: (
                `${[...path, title ?? ''].join(' → ')}:`
                + ` ${cid} @ ${spotId} (${type})`
              ),
            })
          }

          return putRepresentation({
            source: g(), spot: spotId as Id, type, cid, size, now, alternative,
          })
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
