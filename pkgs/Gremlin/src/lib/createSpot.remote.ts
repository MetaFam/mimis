import gremlin from 'gremlin'
import * as v from 'valibot'
import { command } from '$app/server'
import settings from '$lib/settings.svelte.ts'
import {
  connect as connectJanusGraph, connectToG,
  mergeRoot, mergePath,
} from '$lib/janusgraph.ts'

const { statics: __ } = gremlin.process

const NewSpotSchema = v.object({
  containerId: v.optional(v.nullable(v.number())),
  path: v.array(v.pipe(v.string(), v.nonEmpty())),
  address: v.optional(v.nullable(v.string())),
})

export const createSpot = command(
  NewSpotSchema,
  async ({ containerId, path, address }) => {
    const connection = connectJanusGraph()
    const now = new Date().toISOString()

    if(settings.debugging) {
      console.debug({ Create: path, containerId, address })
    }
    console.debug({ Create: path, containerId, address })

    try {
      const g = connectToG(connection)

      const rootId = await mergeRoot(g)
      if(containerId == null) {
        containerId = rootId
      }

      if(address) {
        containerId = await mergeAccount(g, rootId, address, now)
      }

      console.debug({ containerId })

      const traversal = mergePath({
        traversal: g.V(containerId), path, now,
      })
      const result = await traversal.id().next()
      console.debug({ Created: path, id: result.value })
      return result.value
    } catch(error) {
      console.error({ createSpot: error })
      return { error: (error as Error).message }
    } finally {
      try {
        await connection.close()
      } catch(error) {
        console.error({ 'createSpot Close Failed': error })
      }
    }
  }
)

async function mergeAccount(
  g: ReturnType<typeof connectToG>,
  rootId: number,
  address: string,
  now: string,
): Promise<number> {
  const account = await (
    g.V(rootId)
    .coalesce(
      (
        __.outE('ACCOUNT')
        .has('signer', address)
        .inV()
      ),
      (
        __.as('root')
        .addV('Account')
        .addE('ACCOUNT')
        .property({ createdAt: now, signer: address })
        .from_('root')
        .inV()
      ),
    )
    .id()
    .next()
  )

  console.debug({ accountId: account.value })

  const spotRoot = await (
    g.V(account.value)
    .coalesce(
      __.out('SPOTROOT'),
      (
        __.as('account')
        .addV('SpotRoot')
        .addE('SPOTROOT')
        .from_('account')
        .inV()
      ),
    )
    .id()
    .next()
  )

  return spotRoot.value as number
}
