import gremlin from 'gremlin'
import settings from '$lib/settings.svelte.ts'

const { driver, process } = gremlin
const { DriverRemoteConnection } = driver

export function connect() {
  if(settings.debugging) {
    console.debug({ Connecting: settings.janusGraphURL })
  }
  const connection = new DriverRemoteConnection(
    settings.janusGraphURL,
  )
  return connection
}

export function connectToG(
  connection: DriverRemoteConnection
) {
  return process.traversal().withRemote(connection)
}