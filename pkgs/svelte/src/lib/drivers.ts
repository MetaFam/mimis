import { driver as createNeo4j, auth, Driver } from 'neo4j-driver'
import { create as ipfsFactory } from 'kubo-rpc-client'
import { settings } from '$lib/settings.svelte';

let neo4j: Driver | null = null
export const getNeo4j = () => {
  if(!neo4j) {
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