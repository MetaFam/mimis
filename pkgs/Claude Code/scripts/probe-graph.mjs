import gremlin from 'gremlin'

const { driver, process: gp } = gremlin
const { DriverRemoteConnection, auth: { PlainTextSaslAuthenticator } } = driver

const URL = 'ws://localhost:8182/gremlin'
const conn = new DriverRemoteConnection(URL, {
  authenticator: new PlainTextSaslAuthenticator('mimis', 'ThisistheJanusGraphpasswordformimis.'),
})

try {
  const g = gp.traversal().withRemote(conn)
  const vCount = await g.V().count().next()
  const eCount = await g.E().count().next()
  const labels = await g.V().label().groupCount().next()
  const spotRoots = await g.V().hasLabel('SpotRoot').valueMap(true).toList()
  console.log(JSON.stringify({
    ok: true,
    vertices: vCount.value,
    edges: eCount.value,
    labels: Object.fromEntries(labels.value),
    spotRoots,
  }, (_, x) => (typeof x === 'bigint' ? Number(x) : x), 2))
} catch (err) {
  console.error('PROBE FAILED:', err?.message ?? err)
  process.exitCode = 1
} finally {
  await conn.close()
}
