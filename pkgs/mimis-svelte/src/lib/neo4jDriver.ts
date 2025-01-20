import neo4j from 'neo4j-driver'
import { settings } from '$lib/settings.svelte';

export const getNeo4j = () => (
  neo4j.driver(
    settings.neo4jURL,
    neo4j.auth.basic(
      settings.neo4jUser,
      settings.neo4jPass,
    )
  )
)