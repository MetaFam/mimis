import { driver as createNeo4j, auth, Driver } from 'neo4j-driver'
import { create as ipfsFactory } from 'kubo-rpc-client'
import { settings } from './settings.svelte.ts'

let neo4j: Driver | null = null
export const getNeo4j = () => {
  if(!neo4j) {
    console.debug(`Connecting ${settings.neo4jUser}:${settings.neo4jPass} to ${settings.neo4jURL}.`)
    neo4j = createNeo4j(
      settings.neo4jURL,
      auth.basic(
        settings.neo4jUser,
        settings.neo4jPass,
      )
    )
  }
  return neo4j
}

let ipfs: ReturnType<typeof ipfsFactory> | null = null
export const getIPFS = () => {
  if(!ipfs) {
    ipfs = ipfsFactory(settings.ipfsAPI.replace(/\/+$/, ''))
  }
  return ipfs
}