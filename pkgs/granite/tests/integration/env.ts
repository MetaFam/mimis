// Detects which daemons are reachable so integration suites can skip
// cleanly instead of failing when the environment lacks them
// (quickstart.md lists the full prerequisite set).
export const rpcUrl = process.env.GRANITE_RPC_URL ?? 'http://127.0.0.1:8545'
export const kuboUrl = process.env.GRANITE_KUBO ?? 'http://127.0.0.1:5001'
export const gremlinUrl = process.env.GRANITE_GREMLIN ?? 'ws://127.0.0.1:8182/gremlin'

const reachable = async (probe: () => Promise<boolean>): Promise<boolean> => {
  try {
    return await probe()
  } catch {
    return false
  }
}

export const anvilUp = await reachable(async () => {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
    signal: AbortSignal.timeout(2000),
  })
  return response.ok
})

export const kuboUp = await reachable(async () => {
  const response = await fetch(`${kuboUrl}/api/v0/version`, {
    method: 'POST',
    signal: AbortSignal.timeout(2000),
  })
  return response.ok
})

export const gremlinUp = await reachable(async () => {
  const gremlin = await import('gremlin')
  const connection = new gremlin.default.driver.DriverRemoteConnection(gremlinUrl)
  try {
    const g = gremlin.default.process.AnonymousTraversalSource.traversal()
    .withRemote(connection)
    await g.inject(1).toList()
    return true
  } finally {
    await connection.close().catch(() => {})
  }
})

// anvil's default funded accounts
export const fundedKeys = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
] as const
