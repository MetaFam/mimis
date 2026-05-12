import gremlin from 'gremlin'
import settings from '$lib/settings.svelte.ts'
import { getSessionAddress } from "./auth.ts";

const { driver, process } = gremlin
const {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  GraphTraversalSource, statics: __, merge: Merge, t: T,
} = process
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
  traversal: ReturnType<ReturnType<typeof connectToG>['V']>
  now?: string
}) {
  return (
    traversal
    .mergeV(new Map([[T.label, 'Root']]))
    .option(Merge.onCreate, { createdAt: now ?? new Date().toISOString() })
  )
}

export function mergeSpotRoot({ traversal, address, now }: {
  traversal: InstanceType<typeof GraphTraversalSource>
  address: string
  now?: string
}) {
  return (
    traversal
    .mergeV(new Map([[T.label, 'SpotRoot'], ['signer', address]]))
    .option(Merge.onCreate, { createdAt: now ?? new Date().toISOString() })
  )
}

export async function mergePath({
  traversal, containerId, path, now: createdAt,
}: {
  traversal: ReturnType<ReturnType<typeof connectToG>['V']>
  containerId?: number
  path: string[]
  now?: string
}) {
  createdAt ??= new Date().toISOString()
  const address = await getSessionAddress()

  if(containerId != null) {
    if(!await(
      mergeSpotRoot({ traversal: connectToG(connection), address, now })
      .out()
      .hasId(containerId)
      .hasNext()
    )) {
      throw error(400, `Continer id, "${containerId}", does not belong to the user.`)
    }
    traversal = traversal.V(containerId)
  }

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
          .property({ createdAt })
          .addE('CONTAINS')
          .from_('parent')
          .property({ path: elem, createdAt })
          .inV()
        ),
      )
    )
  }
  return traversal
}
