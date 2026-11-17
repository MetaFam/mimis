import * as v from 'valibot'
import { v7 as uuidV7 } from 'uuid'
import { error, isHttpError } from '@sveltejs/kit'
import { command } from '$app/server'
import { assertOwned, g } from '$lib/server/janusgraph'
import {
  moveSpotTraversal, nameClash, wouldCycle,
} from '$lib/server/moves'

const MoveSpotSchema = v.object({
  what: v.number(),
  from: v.number(),
  to: v.number(),
})

/** Moves a Spot, keeping its name, from one container to another. */
export const moveSpot = command(
  MoveSpotSchema,
  async ({ what, from, to }) => {
    const now = new Date().toISOString()

    try {
      if(from === to) {
        throw error(400, 'The Spot is already in that container.')
      }
      await assertOwned({ ids: { source: from, destination: to } })

      const source = g()
      if(await wouldCycle({ source, what, to }).hasNext()) {
        throw error(400, 'Can’t move a Spot into itself.')
      }
      const { value: name = null } = (
        await nameClash({ source, what, from, to }).next()
      )
      if(name != null) {
        throw error(409, `The destination already contains “${name}”.`)
      }

      const { value: id = null } = await (
        moveSpotTraversal({
          source, what, from, to, now, uuid: uuidV7(),
        })
        .next()
      )
      if(id == null) {
        throw error(400, `Spot #${from} doesn’t contain Spot #${what}.`)
      }
      return id
    } catch(err) {
      console.error({ moveSpot: err })
      if(isHttpError(err)) {
        throw err
      }
      throw error(500, `Spot Move: "${(err as Error)?.message ?? err}"`)
    }
  }
)
