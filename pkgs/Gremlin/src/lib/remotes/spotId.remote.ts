import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import { error } from '@sveltejs/kit'
import {
  writeLayer,
} from '$lib/server/janusgraph'
import { upsertSpot } from './upsertSpot.remote'
import { listing } from './listing.remote'

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
    create = false,
  }) => {
    try {
      path = path.filter(Boolean)

      let traversal = await writeLayer()

      for (const element of path) {
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
          .outE('CONTAINS').has('path', element).inV()
        )
      }

      let { value: id = null } = await traversal.id().next()
      if(id == null && create) {
        id = await upsertSpot({ subdirectory: path })
      }
      void listing({ path }).refresh()
      return id
    } catch(err) {
      console.error({ spotId: err })
      throw error(500, `Spot ID: "${(err as Error).message}"`)
    }
  }
)
