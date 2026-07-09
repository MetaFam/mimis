// US1 end-to-end (Kubo + anvil) plus CLI contract tests (contracts/cli.md).
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { create as createKubo } from 'kubo-rpc-client'
import { connect } from '../../src/index.ts'
import { asUpdate, decode } from '../../src/codec.ts'
import { generateKey } from '../../src/keys.ts'
import { deployRegistry } from '../../scripts/deploy-registry.ts'
import { anvilUp, fundedKeys, kuboUp, kuboUrl, rpcUrl } from './env.ts'

const cli = fileURLToPath(new URL('../../src/cli.ts', import.meta.url))

const runCli = (
  args: string[], env: Record<string, string> = {}, input?: string,
): { code: number, stdout: string } => {
  try {
    const stdout = execFileSync(
      process.execPath,
      [cli, ...args],
      {
        env: { ...process.env, ...env },
        ...(input === undefined ? {} : { input }),
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
    return { code: 0, stdout }
  } catch(error) {
    const failure = error as { status?: number, stdout?: string }
    return { code: failure.status ?? 1, stdout: failure.stdout ?? '' }
  }
}

describe('granite keys generate (no daemons needed)', () => {
  it('prints a key and its address, exit 0, --json shape', () => {
    const { code, stdout } = runCli(['keys', 'generate', '--json'])
    assert.equal(code, 0)
    const { key, address } = JSON.parse(stdout)
    assert.match(key, /^0x[0-9a-f]{64}$/)
    assert.match(address, /^0x[0-9a-f]{40}$/)
  })

  it('exits 2 on usage errors', () => {
    assert.equal(runCli(['keys']).code, 2)
    assert.equal(runCli(['no-such-command']).code, 2)
  })
})

describe(
  'publish round trip (Kubo + anvil)',
  { skip: (!anvilUp || !kuboUp) && 'kubo/anvil not reachable' },
  () => {
    it('publishes, chains prev, leaves history intact (SC-002, SC-005)', async () => {
      const registry = await deployRegistry(rpcUrl, fundedKeys[0])
      const granite = await connect({
        kubo: kuboUrl,
        chain: { rpcUrl, registry },
        key: fundedKeys[1],
      })
      const first = await granite.publish({
        data: { title: 'first' },
        edges: {},
      })
      const kubo = createKubo({ url: kuboUrl })
      const firstBytes = await kubo.block.get(first.update)
      const doc = asUpdate(first.update, decode(firstBytes))
      assert.ok(doc.root.equals(first.root))
      const second = await granite.publish({ data: { title: 'second' } })
      assert.ok(second.prev?.equals(first.update))
      assert.deepEqual(await kubo.block.get(first.update), firstBytes)
      await granite.close()
    })

    it('CLI publish emits the contract JSON shape', async () => {
      const registry = await deployRegistry(rpcUrl, fundedKeys[0])
      const env = {
        GRANITE_KUBO: kuboUrl,
        GRANITE_RPC_URL: rpcUrl,
        GRANITE_REGISTRY: registry,
        GRANITE_KEY: generateKey(),
      }
      // Unfunded key: publishing pays gas, so fund via anvil's setBalance
      await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'anvil_setBalance',
          params: [
            (await import('../../src/keys.ts')).addressOf(env.GRANITE_KEY as `0x${string}`),
            '0x8AC7230489E80000',
          ],
        }),
      })
      const { code, stdout } = runCli(
        ['publish', '-', '--json'],
        env,
        JSON.stringify({ data: { via: 'cli' }, edges: {} }),
      )
      assert.equal(code, 0)
      const result = JSON.parse(stdout)
      assert.match(result.update, /^bafy/)
      assert.match(result.root, /^bafy/)
    })
  },
)
