import gremlin from 'gremlin'
import settings from '$lib/settings.svelte.ts'

const { driver, process } = gremlin
const { DriverRemoteConnection } = driver

export function connect() {
  const connection = new DriverRemoteConnection(
    settings.janusGraphURL,
  )
  return {
    connection,
    generateG: () => (
      process.traversal().withRemote(connection)
    ),
  }
}