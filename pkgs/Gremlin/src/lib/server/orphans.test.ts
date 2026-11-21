import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import gremlin from 'gremlin'
import { assertLocalGraph } from '#lib/server/backfill.js'
import { g, inTransaction } from '#lib/server/janusgraph.js'
import { orphanedTransactions } from '#lib/server/orphans.js'
import { addSpot, type Id } from '#lib/server/testing.js'
import settings from '#lib/settings.svelte.js'

// Commits (plan.md, Complexity Tracking): an orphan comes only from a
// session whose process dies, so a child process reads a throwaway
// Spot for real & exits mid-transaction.

const { Client, auth: { PlainTextSaslAuthenticator } } = gremlin.driver

/** Opens a session, reads `spot` in it, & exits without closing it. */
const DIE_MID_TRANSACTION = `
import gremlin from 'gremlin'
const { DriverRemoteConnection, auth: { PlainTextSaslAuthenticator } } = gremlin.driver
const { GRAPH_URL: url, GRAPH_USER: user, GRAPH_PASSWORD: password, SPOT: spot } = process.env
const options = user ? { authenticator: new PlainTextSaslAuthenticator(user, password) } : {}
const g = gremlin.process.traversal().withRemote(new DriverRemoteConnection(url, options))
await g.tx().begin().V(Number(spot)).toList()
process.exit(0)
`

let client: InstanceType<typeof Client>
let spot: Id
let before: Set<number>

const orphanIds = async () => (
  new Set((await orphanedTransactions(client)).map(({ id }) => id))
)
const added = async () => (
  [...await orphanIds()].filter((id) => !before.has(id))
)

beforeEach(async () => {
  assertLocalGraph(settings.janusGraphURL, { remote: false })
  client = new Client(settings.janusGraphURL, {
    traversalsource: 'g',
    ...(settings.janusGraphUsername ? {
      authenticator: new PlainTextSaslAuthenticator(
        settings.janusGraphUsername, settings.janusGraphPassword,
      ),
    } : {}),
  })
  spot = await addSpot(g())
  before = await orphanIds()
})

afterEach(async () => {
  try {
    const left = await added()
    if(left.length > 0) {
      await orphanedTransactions(client, { rollback: true, only: left })
    }
    await g().V(spot).drop().toList()
  } finally {
    await client.close()
  }
})

describe('orphanedTransactions', () => {
  it('finds none left by a session that commits', async () => {
    await inTransaction((source) => source.V(spot).toList())
    expect(await added()).toEqual([])
  })

  it('finds the one a dead process left, & rolls back only it', async () => {
    execFileSync(process.execPath, ['--input-type=module', '-e', DIE_MID_TRANSACTION], {
      env: {
        ...process.env,
        GRAPH_URL: settings.janusGraphURL,
        GRAPH_USER: settings.janusGraphUsername ?? '',
        GRAPH_PASSWORD: settings.janusGraphPassword ?? '',
        SPOT: String(spot),
      },
      timeout: 15_000,
    })
    let orphan = NaN
    await vi.waitFor(async () => {
      const found = await added()
      expect(found).toHaveLength(1)
      ;[orphan] = found
    }, { timeout: 10_000, interval: 250 })

    const rows = await orphanedTransactions(client, { rollback: true, only: [orphan] })
    expect(rows.filter(({ rolledBack }) => rolledBack)).toEqual([
      { id: orphan, thread: expect.stringMatching(/^gremlin-server-session-/), rolledBack: true },
    ])
    expect(await orphanIds()).toEqual(before)
  }, 30_000)
})
