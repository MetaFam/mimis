import gremlin from 'gremlin'
import { v7 as uuidV7 } from 'uuid'
import { error } from '@sveltejs/kit'
import settings from '#lib/settings.svelte.js'
import { getSessionAddress } from './auth.ts'

const { driver, process } = gremlin
const {
  statics: __, merge: Merge, t: T, direction: Direction,
} = process
export type GraphTraversalSource = (
  InstanceType<typeof process.GraphTraversalSource>
)
export type GraphTraversal = InstanceType<typeof process.GraphTraversal>
export type Id = string | number

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

/**
 * JanusGraph’s edge ids arrive as `{ relationId }`, & only the bare
 * string finds the edge again.
 */
export function edgeId(id: unknown) {
  const relationId = (id as { relationId?: unknown } | null)?.relationId
  if(typeof relationId !== 'string') {
    throw new Error(`Expected an edge id, got ${JSON.stringify(id)}.`)
  }
  return relationId
}

/**
 * A mid-traversal `E(id)`, which TinkerPop 3.7 has but gremlin’s types
 * leave out.
 */
export const edgeAt = (id: string) => (
  (__ as unknown as { E(id: string): GraphTraversal }).E(id)
)

let traversalSource: GraphTraversalSource | null | undefined
export function g() {
  if(!traversalSource) {
    const connection = connect()
    traversalSource = process.traversal().withRemote(connection)
  }
  return traversalSource
}

/** Runs `work` in a transaction, committed only if it succeeds. */
export async function inTransaction<T>(
  work: (source: GraphTraversalSource) => Promise<T>,
) {
  const tx = g().tx()
  try {
    const result = await work(tx.begin())
    await tx.commit()
    return result
  } catch(err) {
    await tx.rollback()
    throw err
  }
}

/**
 * `Users` → `User{address}` → `Device{uuid: device}` → `Updates`,
 * merged, so each author’s Device is recorded once however often its
 * Updates arrive. The `Updates` id.
 */
export async function mergeDevice(
  { source, address, device, now: createdAt }:
  {
    source: GraphTraversalSource
    address: string
    device: string
    now: string
  },
) {
  const { value } = await (
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
    .option(Merge.onCreate, { createdAt, author: address })

    .select('user')
    .coalesce(
      __.out('USES').has('Device', 'uuid', device),
      (
        __.addV('Device')
        .property('uuid', device)
        .property('createdAt', createdAt)
        .as('added_device')
        .addE('USES')
        .from_('user')
        .property('createdAt', createdAt)
        .select('added_device')
      ),
    )
    .as('device')

    .coalesce(
      __.out('COMMITS').hasLabel('Updates'),
      (
        __.addV('Updates')
        .property('createdAt', createdAt)
        .as('added_updates')
        .addE('COMMITS')
        .from_('device')
        .property('createdAt', createdAt)
        .select('added_updates')
      ),
    )
    .id()
    .next()
  )
  return value as Id
}

export async function base() {
  const now = new Date().toISOString()
  const address = (await getSessionAddress({ throw: true }))!
  const source = g()
  const user = () => source.V().has('User', 'address', address)

  const { value: devices } = await (
    user().out('USES').hasLabel('Device').values('uuid').fold().next()
  )
  const [device = uuidV7()] = devices as Array<string>
  await mergeDevice({ source, address, device, now })

  await (
    user()
    .as('user')
    .coalesce(
      __.out('WRITES').hasLabel('Spot'),
      (
        __.addV('Spot')
        .property('createdAt', now)
        .property('uuid', uuidV7())
        .as('root')
        .addE('WRITES')
        .from_('user')
        .select('root')
      ),
    )
    .next()
  )
  checkedBase = true
}

let checkedBase = false
export async function verifyBase() {
  if(!checkedBase) await base()
}


export async function writeLayer() {
  const [, address] = await Promise.all([
    await verifyBase(),
    await getSessionAddress({ throw: true }),
  ])

  return layerOf(address!)
}

export const layerOf = (address: string, source = g()) => (
  source.V().hasLabel('User').has('address', address)
  .out('WRITES').hasLabel('Spot')
)

/**
 * The `INCLUDES.author` of each `User` whose tree holds `spot`, by
 * `CONTAINS` alone, as opposed to through a mount.
 */
export async function ownersOf(
  { source, spot }: { source: GraphTraversalSource, spot: Id },
) {
  const users = await (
    source.V(spot)
    .hasLabel('Spot')
    .repeat(__.in_('CONTAINS', 'WRITES').simplePath())
    .until(__.hasLabel('User'))
    .dedup()
    .project('id', 'authors')
    .by(__.id())
    .by(__.inE('INCLUDES').values('author').fold())
    .toList()
  ) as Array<Map<string, unknown>>
  return [...new Set(users.map((user) => {
    const [author] = user.get('authors') as Array<string>
    if(author == null) {
      throw new Error(`User #${user.get('id')} has no INCLUDES author.`)
    }
    return author
  }))]
}

/**
 * Throws unless every named Spot is in the session user’s own tree,
 * as opposed to reached through a mount of someone else’s.
 */
export async function assertOwned(
  { source = g(), ids, address }:
  {
    source?: GraphTraversalSource
    ids: Record<string, unknown>
    address?: string | null
  }
) {
  address ??= await getSessionAddress({ throw: true })
  await Promise.all(Object.entries(ids).map(async ([role, id]) => {
    if(!['number', 'string'].includes(typeof id)) {
      throw error(400, `The ${role} id, “${id}”, isn’t a vertex id.`)
    }
    if(!(await ownersOf({ source, spot: id as Id })).includes(address!)) {
      throw error(
        403,
        `The ${role}, Spot #${id}, doesn’t belong to the user ${address}.`
      )
    }
  }))
}

const WRITES_PER_REQUEST = 100

/**
 * Runs `writes`, many to a request. The server refuses a request over
 * 64 KiB, & a `union()` much wider than this gets slower per write.
 */
export async function writeAll(
  source: GraphTraversalSource, writes: Array<GraphTraversal>,
) {
  for(let start = 0; start < writes.length; start += WRITES_PER_REQUEST) {
    await (
      source.inject(0)
      .union(...writes.slice(start, start + WRITES_PER_REQUEST))
      .count()
      .next()
    )
  }
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
