import gremlin from 'gremlin'
import * as v from 'valibot'
import { error, isHttpError } from '@sveltejs/kit'
import { command } from '$app/server'
import {
  connect as connectJanusGraph, connectToG, mergeSpotRoot,
} from '$lib/server/janusgraph'
import { getSessionAddress } from '$lib/server/auth'

const { statics: __ } = gremlin.process

const MoveSpotSchema = v.object({
  what: v.number(),
  from: v.number(),
  to: v.number(),
})

export const moveSpot = command(
  MoveSpotSchema,
  async ({ what, from, to }) => {
    const connection = connectJanusGraph()
    const now = new Date().toISOString()

    console.debug({ moveSpotStart: { what, from, to, now } })

    try {
      await Promise.all(Object.entries({ what, from, to }).map(
        async ([type, id]) => {
          if(!await (
            (await mergeSpotRoot(
              { traversal: connectToG(connection), create: false }
            ))
            .until(__.hasId(id))
            .repeat(__.out())
            .hasNext()
          )) {
            const address = await getSessionAddress()
            throw error(400, `Container, #${id} (${type}), does not belong to the user ${address}.`)
          }
        }
      ))

      const traversal = connectToG(connection)

      const { value: path } = await (
        traversal
        .V(from)
        .outE('CONTAINS')
        .where(__.inV().hasId(what))
        .values('path')
        .next()
      )
      if(path == null) {
        throw error(
          400,
          `No “CONTAINS” edge exists between ${from} & ${what}.`,
        )
      }

      console.debug({ moveSpot: { what, from, to, path } })

      await (
        traversal
        .V(from)
        .outE('CONTAINS')
        .where(__.inV().hasId(what))
        .drop()
        .iterate()
      )

      await (
        traversal
        .V(to)
        .addE('CONTAINS')
        .to(__.V(what))
        .property('path', path)
        .property('createdAt', now)
        .project('id', 'path')
        .by(__.id())
        .by('path')
        .next()
      )
    } catch(err) {
      console.error({ moveSpot: err })
      if(isHttpError(err)) {
        throw err
      }
      throw error(500, `Spot Move: "${(err as Error)?.message ?? err}"`)
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({ 'moveSpot Close Failed': error })
      }
    }
  }
)
