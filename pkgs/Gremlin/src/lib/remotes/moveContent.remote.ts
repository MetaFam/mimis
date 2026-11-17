import * as v from 'valibot'
import { error, isHttpError } from '@sveltejs/kit'
import { command } from '$app/server'
import { assertOwned, g } from '$lib/server/janusgraph'
import { moveContentTraversal, typeClash } from '$lib/server/moves'

const MoveContentSchema = v.object({
  what: v.number(),
  from: v.number(),
  to: v.number(),
})

/** Moves a `Content` from one Spot to another. */
export const moveContent = command(
  MoveContentSchema,
  async ({ what, from, to }) => {
    const now = new Date().toISOString()

    try {
      if(from === to) {
        throw error(400, 'The Content is already in that Spot.')
      }
      await assertOwned({ ids: { source: from, destination: to } })

      const source = g()
      const { value: type = null } = (
        await typeClash({ source, what, to }).next()
      )
      if(type != null) {
        throw error(
          409,
          `The destination already has “${type}” Content.`,
        )
      }

      const { value: id = null } = await (
        moveContentTraversal({ source, what, from, to, now }).next()
      )
      if(id == null) {
        throw error(400, `Spot #${from} doesn’t hold Content #${what}.`)
      }
      return id
    } catch(err) {
      console.error({ moveContent: err })
      if(isHttpError(err)) {
        throw err
      }
      throw error(
        500, `Content Move: "${(err as Error)?.message ?? err}"`,
      )
    }
  }
)
