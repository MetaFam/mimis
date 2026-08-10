import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import { error } from '@sveltejs/kit'
import {
  connect as connectJanusGraph, connectToG, mergeSpotRoot,
} from '$lib/server/janusgraph'
import { getSessionAddress } from '$lib/server/auth'
import { upsertSpot } from './upsertSpot.remote'
import { searchFor } from './searchFor.remote'

const { statics: __ } = gremlin.process

const SearchSchema = v.object({
  path: v.array(v.string()),
  maxMountDepth: v.optional(v.number(), 10),
  allowCycles: v.optional(v.boolean(), false),
  create: v.optional(v.boolean(), false),
})

export const spotId = command(
  SearchSchema,
  async ({
    path = [],
    maxMountDepth: maxDepth = 10,
    allowCycles = false,
    create = false,
  }) => {
    const connection = connectJanusGraph()
    try {
      path = path.filter(Boolean)

      const address = await getSessionAddress()
      if(!address) return null

      const g = connectToG(connection)
      let traversal = await mergeSpotRoot(
        { traversal: g, address, create: false }
      )

      for (const element of path) {
        if (!allowCycles) {
          traversal = traversal.simplePath()
        }

        traversal = (
          traversal
          .until(
            __.not(__.outE('MOUNT'))
            .or().loops().is(maxDepth)
          )
          .repeat(
            __.outE('MOUNT')
            .order()
            .by('order')
            .inV()
          )
          .outE('CONTAINS')
          .has('path', element)
          .inV()
        )
      }

      let { value = null } = await traversal.id().next()
      if(value == null && create) {
        value = await upsertSpot({ subdirectory: path })
      }
      void searchFor({ path }).refresh()
      console.debug({ spotId: { path, value } })
      return value
    } catch(err) {
      console.error({ spotId: err })
      throw error(500, `Spot ID: "${(err as Error).message}"`)
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({ 'spotId Close Failed': error })
      }
    }
  }
)
