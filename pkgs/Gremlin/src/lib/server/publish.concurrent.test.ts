import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { commitInTransaction, prepare, type Prepared } from '#lib/server/publish.js'
import { stageSpots } from '#lib/server/staging.js'
import { g } from '#lib/server/janusgraph.js'
import {
  dropUser, memoryBlocks, seedTree, seedUser, signUpdate, testAccount,
  transaction, type Id,
} from '#lib/server/testing.js'

// The one test that commits (plan.md, Complexity Tracking): a lock
// conflict only shows up when two transactions commit, so it seeds a
// throwaway user with a random address & deletes it all afterwards.

let account: ReturnType<typeof testAccount>
let address: string
let user: Id
let device: Id
const now = '2026-11-21T00:00:00.000Z'

const committed = async <T>(
  work: (source: ReturnType<typeof transaction>['source']) => Promise<T>,
) => {
  const { source, rollback, commit } = transaction()
  try {
    const result = await work(source)
    await commit()
    return result
  } catch(err) {
    await rollback()
    throw err
  }
}

beforeEach(async () => {
  account = testAccount()
  address = account.address.toLowerCase()
  ;({ user, device } = await committed(async (source) => {
    const seeded = await seedUser(source, { address })
    await seedTree(source, { root: seeded.root, tree: { a: {} } })
    await stageSpots({ source, address, all: true })
    return seeded
  }))
})

afterEach(async () => {
  await committed((source) => dropUser(source, { user }))
})

describe('two publishes at once (FR-016)', () => {
  it('lets exactly one commit, & unpins the other’s Update', async () => {
    const blocks = memoryBlocks()
    const ready = await Promise.all(['one', 'two'].map(async (comment) => {
      const result = await prepare({ source: g(), blocks, address, comment, now })
      if(result.nothing) throw new Error('Nothing was prepared.')
      return result as Extract<Prepared, { nothing: false }>
    }))
    const results = await Promise.allSettled(ready.map(async ({ plan, typedData }) => (
      commitInTransaction({
        tx: g().tx(),
        blocks,
        address,
        plan,
        signature: await signUpdate(account, {
          ...typedData,
          message: { ...typedData.message, sequence: BigInt(typedData.message.sequence) },
        }),
        now,
      })
    )))

    const won = results.filter(({ status }) => status === 'fulfilled')
    const lost = results.filter(({ status }) => status === 'rejected')
    expect(won).toHaveLength(1)
    expect(lost).toHaveLength(1)
    expect((lost[0] as PromiseRejectedResult).reason).toMatchObject({
      status: 409, body: { message: 'Another publish finished first; publish again.' },
    })
    const { cid } = (won[0] as PromiseFulfilledResult<{ cid: string }>).value
    expect([...blocks.pins]).toEqual([cid])

    expect(await g().V(device).values('sequence').toList()).toEqual([1])
    expect(await g().V(device).out('COMMITS').out('SPANS').values('cid').toList())
    .toEqual([cid])
  })
})
