import * as v from 'valibot'
import { query } from '$app/server'
import { error, isHttpError } from '@sveltejs/kit'
import settings from '$lib/settings.svelte'
import { writeLayer } from '$lib/server/janusgraph'
import { assembleListing, listingTraversal } from '$lib/server/listing'

export type { Child, Content, Listing } from '$lib/server/listing'

const ListingSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
  })),
})

/**
 * Everything shown for a cursor at `path`: the `Content` on the Spots
 * it resolves to, the Spots they `CONTAINS`, & the same from all
 * their `MOUNT`ed layers, merged by precedence.
 */
export const listing = query(
  ListingSchema,
  async ({ path = [], options: { maxMountDepth = 10 } = {} }) => {
    try {
      path = path.filter(Boolean)
      const rows = await (
        listingTraversal({
          from: await writeLayer(),
          path,
          maxDepth: maxMountDepth,
        })
        .toList()
      ) as Parameters<typeof assembleListing>[0]
      const result = assembleListing(rows)
      if(settings.debugging) {
        console.debug({ Listing: { result, path } })
      }
      return result
    } catch(err) {
      if(isHttpError(err)) {
        throw err
      }
      let { message: msg } = err as Error
      if((err as Error).name === 'TypeError') {
        msg = (
          'Connection Error: Could not connect to JanusGraph'
          + ` @ ${settings.janusGraphURL}.`
        )
      }
      console.error({ listing: err, stack: (err as Error)?.stack })
      throw error(500, `Listing: "${msg}"`)
    }
  }
)
