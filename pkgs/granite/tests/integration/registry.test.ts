// The four contract tests from contracts/registry.sol.md, against anvil.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPublicClient, http } from 'viem'
import { cidOf, encode } from '../../src/codec.ts'
import { ethereumRegistry, registryAbi } from '../../src/registry.ts'
import { addressOf } from '../../src/keys.ts'
import { deployRegistry } from '../../scripts/deploy-registry.ts'
import { anvilUp, fundedKeys, rpcUrl } from './env.ts'

const someCid = async (label: string) => (
  cidOf(encode({ granite: 1, label }))
)

describe('GraniteRegistry (anvil)', { skip: !anvilUp && 'anvil is not reachable' }, () => {
  it('passes the four contract tests', async () => {
    const registry = await deployRegistry(rpcUrl, fundedKeys[0])
    const account0 = addressOf(fundedKeys[0])
    const account1 = addressOf(fundedKeys[1])
    const registry0 = ethereumRegistry({ rpcUrl, registry, key: fundedKeys[0] })
    const registry1 = ethereumRegistry({ rpcUrl, registry, key: fundedKeys[1] })

    // 1. empty before any publish
    assert.equal(await registry0.latest(account0), undefined)

    // 2. publish stores exactly the bytes sent and emits Published
    const first = await someCid('first')
    await registry0.publish(first)
    assert.ok((await registry0.latest(account0))?.equals(first))
    const client = createPublicClient({ transport: http(rpcUrl) })
    const events = await client.getContractEvents({
      address: registry,
      abi: registryAbi,
      eventName: 'Published',
      fromBlock: 0n,
    })
    assert.equal(events.length, 1)
    assert.equal(events[0].args.publisher?.toLowerCase(), account0)

    // 3. a second publish overwrites latest for the sender only
    const second = await someCid('second')
    await registry0.publish(second)
    assert.ok((await registry0.latest(account0))?.equals(second))

    // 4. two accounts' entries do not interfere
    const other = await someCid('other')
    await registry1.publish(other)
    assert.ok((await registry1.latest(account1))?.equals(other))
    assert.ok((await registry0.latest(account0))?.equals(second))
  })
})
