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

    if(settings.debugging) console.debug({ Create: path })

    try {
      const g = connectToG(connection)

      if(containerId == null) {
        containerId = await mergeRoot(g)
      }

      if(address) {
        containerId = await mergeAccount(g, containerId, address, now)
      }

      const traversal = mergePath({
        traversal: g.V(containerId), path, now,
      })
      const result = await traversal.id().next()

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
        .property({ createdAt: now, signer: address })
        .as('account')
        .addE('ACCOUNT')
        .from_('root')
        .property({ signer: address, createdAt: now })
        .select('account')
      ),
    )
    .id()
    .next()
  )

  const spotRoot = await (
    g.V(account.value)
    .coalesce(
      __.out('SPOTROOT'),
      (
        __.as('account')
        .addV('SpotRoot')
        .property({ createdAt: now, inserter: address })
        .as('spotRoot')
        .addE('SPOTROOT')
        .from_('account')
        .property({ inserter: address, createdAt: now })
        .select('spotRoot')
      ),
    )
    .id()
    .next()
  )

  // Create app/argus path
  const argusTraversal = mergePath({
    traversal: g.V(spotRoot.value),
    path: ['app', 'argus'],
    now,
  })
  const argusId = await argusTraversal.id().next()

  // Create app/mïmis as a MOUNT to the global Root
  const mimisTraversal = mergePath({
    traversal: g.V(spotRoot.value),
    path: ['app', 'mïmis'],
    now,
  })
  await (
    mimisTraversal
    .coalesce(
      __.outE('MOUNT'),
      (
        __.as('mimis')
        .addE('MOUNT')
        .to(__.V(rootId))
        .property({ order: 0, createdAt: now })
        .select('mimis')
      ),
    )
    .next()
  )

  return argusId.value as number
}
