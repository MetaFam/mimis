import * as v from 'valibot'
import { command } from '$app/server'
import { nameProblem } from '#lib/names.js'
import { getSessionAddress } from '#lib/server/auth.js'
import { rethrow } from '#lib/server/errors.js'
import { inTransaction } from '#lib/server/janusgraph.js'
import { renameSpot as rename } from '#lib/server/renames.js'

const RenameSchema = v.object({
  path: v.array(v.string()),
  from: v.string(),
  to: v.pipe(
    v.string(),
    v.check((name) => nameProblem(name) == null, 'That isn’t a name.'),
  ),
})

/** Renames what the user sees as `from` at `path`, giving its new path. */
export const renameSpot = command(
  RenameSchema,
  async ({ path, from, to }) => {
    const now = new Date().toISOString()
    try {
      const address = (await getSessionAddress({ throw: true }))!
      return await inTransaction((source) => (
        rename({ source, address, path, from, to, now })
      ))
    } catch(err) {
      rethrow('Rename', err)
    }
  }
)
