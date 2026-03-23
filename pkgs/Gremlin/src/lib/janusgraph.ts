import gremlin from 'gremlin'
import settings from '$lib/settings.svelte.ts'

const { driver, process } = gremlin
const {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  GraphTraversalSource, merge: Merge, t: T,
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