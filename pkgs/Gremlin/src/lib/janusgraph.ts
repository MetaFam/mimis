import { process, driver } from 'gremlin'
import settings from '$lib/settings.svelte'

const { DriverRemoteConnection } = driver

export function connect() {
  const connection = new DriverRemoteConnection(
    settings.janusGraphURL,
  )
  return {
    connection,
    g: process.traversal().withRemote(connection),
  }
}