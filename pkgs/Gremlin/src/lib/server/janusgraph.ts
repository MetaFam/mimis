import gremlin from 'gremlin'
import { error } from '@sveltejs/kit'
import settings from '$lib/settings.svelte.ts'
import { getSessionAddress } from "./auth.ts";

const { driver, process } = gremlin
const {
  statics: __, merge: Merge, t: T,
} = process

type GraphTraversalSource = InstanceType<typeof process.GraphTraversalSource>

const {
  DriverRemoteConnection,
  auth: { PlainTextSaslAuthenticator },
} = driver

export function connect() {
  if(settings.debugging) {
    console.debug({ Connecting: settings.janusGraphURL })
  }
  const opts: { authenticator?: InstanceType<typeof PlainTextSaslAuthenticator> } = {}
  if(settings.janusGraphUsername) {
    if(settings.debugging) {
      console.debug(
        `Connecting to Janus (${settings.janusGraphURL}) as ${settings.janusGraphUsername}`
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

export function connectToG(
  connection: ReturnType<typeof connect>
) {
  return process.traversal().withRemote(connection)
}

export async function mergeRoot({ traversal, now }: {
  traversal: GraphTraversalSource
  now?: string
}) {
  return (
    traversal
    .mergeV(new Map([[T.label, 'Root']]))
    .option(Merge.onCreate, { createdAt: now ?? new Date().toISOString() })
  )
}

export async function mergeSpotRoot({ traversal, address, now: createdAt, create }: {
  traversal: GraphTraversalSource
  address?: string | null
  now?: string | null
  create?: boolean
}) {
  address ??= await getSessionAddress({ throw: true })
  createdAt ??= new Date().toISOString()
  create ??= true
  return (
    (create ? (
      traversal
      .mergeV(new Map([[T.label, 'SpotRoot'], ['signer', address]]))
      .option(Merge.onCreate, { createdAt })
    ) : (
      traversal
      .V()
      .hasLabel('SpotRoot')
      .has('signer', address)
    ))
  )
}

export async function mergePath({
  traversal, containerId, path, now: createdAt, create,
}: {
  traversal: GraphTraversalSource
  containerId?: number
  path: Array<string>
  now?: string
  create?: boolean
}) {
  createdAt ??= new Date().toISOString()
  create ??= true

  if(containerId != null) {
    if(!await (
      (await mergeSpotRoot({ traversal, now: createdAt, create: false }))
      .repeat(__.out())
      .until(
        __.hasId(containerId)
        .or()
        .count().is(0)
      )
      .hasId(containerId)
      .hasNext()
    )) {
      throw error(400, `Container id, "${containerId}", does not belong to the user.`)
    }
    console.debug({ mergePath: `Starting at ${containerId}.` })
    traversal = traversal.V(containerId)
  }

  for(const elem of path) {
    console.debug({ mergePath: elem, create })
    traversal = (
      (create ? (
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
            .property(new Map(Object.entries({ createdAt })))
            .addE('CONTAINS')
            .from_('parent')
            .property(new Map(Object.entries({ path: elem, createdAt })))
            .inV()
          ),
        )
      ) : (
        traversal.outE('CONTAINS')
        .has('path', elem)
        .inV()
      ))
    )
  }
  return traversal
}
