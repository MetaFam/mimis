import gremlin from 'gremlin'
import { v7 as uuidV7 } from 'uuid'
import { error } from '@sveltejs/kit'
import settings from '$lib/settings.svelte'
import { getSessionAddress } from "./auth.ts";

const { driver, process } = gremlin
const {
  statics: __, merge: Merge, t: T, direction: Direction,
} = process
type GraphTraversalSource = InstanceType<typeof process.GraphTraversalSource>
type GraphTraversal = InstanceType<typeof process.GraphTraversal>

const {
  DriverRemoteConnection,
  auth: { PlainTextSaslAuthenticator },
} = driver

export function connect() {
  if(settings.debugging) {
    console.debug({ Connecting: settings.janusGraphURL })
  }
  const opts: {
    authenticator?: InstanceType<typeof PlainTextSaslAuthenticator>
  } = {}
  if(settings.janusGraphUsername) {
    if(settings.debugging) {
      console.debug(
        `Connecting to Janus (${settings.janusGraphURL})`
        + ` as ${settings.janusGraphUsername}.`
      )
    }
    opts.authenticator = (
      new PlainTextSaslAuthenticator(
        settings.janusGraphUsername,
        settings.janusGraphPassword,
      )
    )
  }
  return new DriverRemoteConnection(
    settings.janusGraphURL, opts,
  )
}

let traversalSource: GraphTraversalSource | null | undefined
export function g() {
  if(!traversalSource) {
    const connection = connect()
    traversalSource = process.traversal().withRemote(connection)
  }
  return traversalSource
}

export async function base() {
  const createdAt = new Date().toISOString()
  const address = await getSessionAddress({ throw: true })
  const spotUUID = uuidV7()
  const deviceUUID = uuidV7()

  const source = g()
  const base = (
    source
    .mergeV(new Map([[T.label, 'Users']]))
    .option(Merge.onCreate, { createdAt })
    .as('users')

    .mergeV(new Map([[T.label, 'User'], ['address', address]]))
    .option(Merge.onCreate, { createdAt })
    .as('user')

    .mergeE(new Map([
      [T.label, 'INCLUDES'],
      [Direction.out, Merge.outV],
      [Direction.in, Merge.inV],
    ]))
    .option(Merge.outV, __.select('users'))
    .option(Merge.inV, __.select('user'))
    .option(Merge.onCreate, { createdAt })

    .coalesce(
      __.select('user').outE('USES').inV().hasLabel('Device'),
      (
        __.addV('Device')
        .property('uuid', deviceUUID)
        .property('createdAt', createdAt)
      ),
    ).as('device')

    .mergeE(new Map([
      [T.label, 'USES'],
      [Direction.out, Merge.outV],
      [Direction.in, Merge.inV],
    ]))
    .option(Merge.outV, __.select('user'))
    .option(Merge.inV, __.select('device'))
    .option(Merge.onCreate, { createdAt })

    .coalesce(
      __.select('device').outE('COMMITS').inV().hasLabel('Updates'),
      __.addV('Updates').property('createdAt', createdAt),
    ).as('updates')

    .mergeE(new Map([
      [T.label, 'COMMITS'],
      [Direction.out, Merge.outV],
      [Direction.in, Merge.inV],
    ]))
    .option(Merge.outV, __.select('device'))
    .option(Merge.inV, __.select('updates'))
    .option(Merge.onCreate, { createdAt })

    .coalesce(
      __.select('user').outE('WRITES').inV().hasLabel('Spot'),
      (
        __.addV('Spot').as('write_spot')
        .property('createdAt', createdAt)
        .property('uuid', spotUUID)
        .addE('WRITES')
        .from_('user').to('write_spot')
      ),
    )

    .select('users')
  )
  checkedBase = true
  return base
}

let checkedBase = false
export async function verifyBase() {
  if(!checkedBase) {
    await (await base()).next()
    checkedBase = true
  }
}


export async function writeLayer() {
  const [, address] = await Promise.all([
    await verifyBase(),
    await getSessionAddress({ throw: true }),
  ])

  return (
    g().V().hasLabel('User').has('address', address)
    .outE('WRITES').inV().hasLabel('Spot')
  )
}

/**
 * Throws unless every named Spot is in the session user’s own tree,
 * as opposed to reached through a mount of someone else’s.
 */
export async function assertOwned(
  { ids, address }:
  { ids: Record<string, unknown>, address?: string | null }
) {
  address ??= await getSessionAddress({ throw: true })
  await Promise.all(Object.entries(ids).map(async ([role, id]) => {
    if(!['number', 'string'].includes(typeof id)) {
      throw error(400, `The ${role} id, “${id}”, isn’t a vertex id.`)
    }
    const owned = await (
      g().V(id)
      .hasLabel('Spot')
      .repeat(__.in_('CONTAINS', 'WRITES').simplePath())
      .until(__.hasLabel('User'))
      .has('address', address)
      .limit(1)
      .hasNext()
    )
    if(!owned) {
      throw error(
        403,
        `The ${role}, Spot #${id}, doesn’t belong to the user ${address}.`
      )
    }
  }))
}

export async function mergePath({
  containerId, path, now: createdAt, traversal,
}: {
  containerId?: number | null
  path: Array<string>
  now?: string
  traversal?: GraphTraversal
}) {
  createdAt ??= new Date().toISOString()
  const address = await getSessionAddress({ throw: true })
  if(traversal == null) traversal = await writeLayer()

  console.debug({ Path: { address, containerId } })

  if(containerId != null) {
    await assertOwned({ ids: { container: containerId }, address })
    traversal = g().V(containerId)
  }

  console.debug({ Path: { containerId } })

  for(const elem of path) {
    traversal = (
      traversal
      .as('parent')
      .coalesce(
        (
          __.outE('CONTAINS')
          .has('path', elem)
          .inV()
        ),
        (
          __.addV('Spot')
          .property(new Map(Object.entries(
            { createdAt, uuid: uuidV7() }
          )))
          .addE('CONTAINS')
          .from_('parent')
          .property(new Map(Object.entries(
            { path: elem, createdAt, uuid: uuidV7() }
          )))
          .inV()
        ),
      )
    )
  }

  return traversal
}
