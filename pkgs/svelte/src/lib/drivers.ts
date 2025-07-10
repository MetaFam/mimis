import neo4jFactory from 'neo4j-driver'
import { create as ipfsFactory } from 'kubo-rpc-client'
import { settings } from '$lib/settings.svelte';

let neo4j: Neo4j | null = null
export const getNeo4j = () => {
  if(!neo4j) {
    neo4j = neo4jFactory.driver(
      settings.neo4jURL,
      neo4jFactory.auth.basic(
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