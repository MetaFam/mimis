import { driver as createNeo4j, auth, Driver, driver } from 'neo4j-driver'
import { create as ipfsFactory } from 'kubo-rpc-client'
import { settings } from './settings.svelte.ts'

let neo4j: Driver | null = null
export const getNeo4j = () => {
  if(!neo4j) {
    try {
      neo4j = createNeo4j(
        // I can't get this to change
        // settings.neo4jURL,
        'neo4j+s://neo4j.mimis.dhappy.org',
        auth.basic(
          settings.neo4jUser,
          settings.neo4jPass,
        )
      )
    } catch(err) {
      console.error(`Couldn’t generate Neo4j driver: "${(err as Error).message}".`)
      throw err
    }
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