import * as v from 'valibot'
import { command } from '$app/server'
import { getSessionAddress } from '#lib/server/auth.js'
import { rethrow } from '#lib/server/errors.js'
import { inTransaction } from '#lib/server/janusgraph.js'
import * as renames from '#lib/server/renames.js'

const MountSchema = v.object({ mount: v.string() })

/** A command resolving a move notice by `resolve`, named `name` in errors. */
const resolver = (
  name: string, resolve: typeof renames.removeMount,
) => (
  command(MountSchema, async ({ mount }) => {
    const now = new Date().toISOString()
    try {
      const address = (await getSessionAddress({ throw: true }))!
      return await inTransaction((source) => (
        resolve({ source, address, mount, now })
      ))
    } catch(err) {
      rethrow(name, err)
    }
  })
)

/** Takes the user’s mount of a moved link out. */
export const removeMount = resolver('Remove', renames.removeMount)
/** Moves the user’s mount of a moved link to where it went. */
export const followMount = resolver('Follow', renames.followMount)
/** Makes the user’s mount of a moved link a link of their own. */
export const keepMount = resolver('Keep', renames.keepMount)
