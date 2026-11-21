// Lists the JanusGraph transactions orphaned by Gremlin sessions that
// died mid-transaction, which hold their locks until rolled back, so
// writes to what they read time out. `--rollback` rolls them back.
import gremlin from 'gremlin'
import { assertLocalGraph } from '../src/lib/server/backfill.ts'
import { orphanedTransactions } from '../src/lib/server/orphans.ts'

process.loadEnvFile('.env.local')
const {
  PUBLIC_JANUSGRAPH_URL: url,
  PUBLIC_JANUSGRAPH_USERNAME: username,
  PUBLIC_JANUSGRAPH_PASSWORD: password,
} = process.env
if(!url) throw new Error('`PUBLIC_JANUSGRAPH_URL` isn’t set in .env.local.')
assertLocalGraph(url, { remote: process.argv.includes('--remote') })

const { Client, auth: { PlainTextSaslAuthenticator } } = gremlin.driver
const client = new Client(url, {
  traversalsource: 'g',
  ...(username ? {
    authenticator: new PlainTextSaslAuthenticator(username, password),
  } : {}),
})
const rollback = process.argv.includes('--rollback')
try {
  const orphans = await orphanedTransactions(client, { rollback })
  console.info({
    [rollback ? 'Rolled back' : 'Orphaned (--rollback to roll back)']: orphans,
  })
} finally {
  await client.close()
}
