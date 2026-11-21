import gremlin from 'gremlin'
import {
  assertLocalGraph, backfillRepresentations, lockSequences,
} from '../src/lib/server/backfill.ts'

process.loadEnvFile('.env.local')
const {
  PUBLIC_JANUSGRAPH_URL: url,
  PUBLIC_JANUSGRAPH_USERNAME: username,
  PUBLIC_JANUSGRAPH_PASSWORD: password,
} = process.env
if(!url) throw new Error('`PUBLIC_JANUSGRAPH_URL` isn’t set in .env.local.')
assertLocalGraph(url, { remote: process.argv.includes('--remote') })

const {
  Client, DriverRemoteConnection, auth: { PlainTextSaslAuthenticator },
} = gremlin.driver
const options = username ? (
  { authenticator: new PlainTextSaslAuthenticator(username, password) }
) : {}
const connection = new DriverRemoteConnection(url, options)
const client = new Client(url, { ...options, traversalsource: 'g' })
const tx = gremlin.process.traversal().withRemote(connection).tx()
try {
  const counts = await backfillRepresentations({ source: tx.begin() })
  await tx.commit()
  console.info({ Backfilled: counts, sequence: await lockSequences(client) })
} catch(err) {
  await tx.rollback()
  throw err
} finally {
  await Promise.all([connection.close(), client.close()])
}
