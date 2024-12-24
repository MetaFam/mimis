import neo4j from 'neo4j-driver'
import {
  PUBLIC_NEO4J_URI as uri,
  PUBLIC_NEO4J_USER as user,
  PUBLIC_NEO4J_PASSWORD as pass,
} from '$env/static/public'

export const getNeo4j = () => (
  neo4j.driver(uri, neo4j.auth.basic(user, pass))
)