import gremlin from 'gremlin'
import settings from '$lib/settings.svelte.ts'

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
  const connection = new DriverRemoteConnection(
    settings.janusGraphURL, opts,
  )
  return connection
}

export function connectToG(
  connection: ReturnType<typeof connect>
) {
  return process.traversal().withRemote(connection)
}

export async function mergeRoot(g: InstanceType<typeof GraphTraversalSource>) {
  const now = new Date().toISOString()
  const traversal = (
    g.mergeV(new Map([[T.label, 'Root']]))
    .option(Merge.onCreate, { createdAt: now })
    .id()
  )
  const results = await traversal.next()
  return results.value as number
}

export function mergePath({ traversal, path, now }: {
  traversal: ReturnType<ReturnType<typeof connectToG>['V']>
  path: string[]
  now: string
}) {
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
          .property({ createdAt: now })
          .addE('CONTAINS')
          .from_('parent')
          .property({ path: elem, createdAt: now })
          .inV()
        ),
      )
    )
  }
  return traversal
}

export async function findSpotRoot(
  g: InstanceType<typeof GraphTraversalSource>,
  address: string,
): Promise<number | null> {
  const result = await (
    g.V().has(T.label, 'Root')
    .outE('ACCOUNT').has('signer', address).inV()
    .out('SPOTROOT')
    .id()
    .next()
  )
  return (result.value as number) ?? null
}