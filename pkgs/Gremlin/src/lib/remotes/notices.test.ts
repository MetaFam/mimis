// Not `notices.remote.test.ts`: SvelteKit takes any `*.remote.*`
// file for a module of remote functions.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as v from 'valibot'
import { notices } from '#lib/remotes/notices.remote.js'
import { createSessionToken } from '#lib/server/auth.js'
import {
  seedUser, testAccount, transaction,
} from '#lib/server/testing.js'

type Source = ReturnType<typeof transaction>['source']

const { current, inTransaction } = vi.hoisted(() => {
  const current = {
    source: undefined as unknown as Source,
    request: new Request('http://localhost/'),
  }
  return {
    current,
    // In the test’s own transaction, so the rollback undoes it.
    inTransaction: vi.fn(async (work: (source: Source) => Promise<unknown>) => (
      work(current.source)
    )),
  }
})

vi.mock('$app/server', async (importOriginal) => {
  const { error } = await import('@sveltejs/kit')
  return {
    ...(await importOriginal<typeof import('$app/server')>()),
    getRequestEvent: () => ({ request: current.request }),
    /** As SvelteKit runs one: its argument checked by its schema. */
    query: (run: () => unknown) => Object.assign(async () => run(), { __: { type: 'query' } }),
    command: (schema: v.GenericSchema, run: (arg: unknown) => unknown) => (
      Object.assign(
        async (arg: unknown) => {
          const result = await schema['~standard'].validate(arg)
          if(result.issues) throw error(400, 'Bad Request')
          return run(result.value)
        },
        { __: { type: 'command' } },
      )
    ),
  }
})

vi.mock('#lib/server/janusgraph.js', async (importOriginal) => {
  const actual = (
    await importOriginal<typeof import('#lib/server/janusgraph.js')>()
  )
  return {
    ...actual,
    assertOwned: (args: Parameters<typeof actual.assertOwned>[0]) => (
      actual.assertOwned({ source: current.source, ...args })
    ),
    inTransaction,
    // Until a test sets its transaction, so `transaction()` gets the real one.
    g: () => current.source ?? actual.g(),
  }
})

let rollback: () => Promise<void>

const signIn = async (as: string | null) => {
  const headers = new Headers()
  if(as) {
    const { token } = await createSessionToken(as)
    headers.set('authorization', `Bearer ${token}`)
  }
  current.request = new Request('http://localhost/', { headers })
}

beforeEach(async () => {
  let source: Source
  ;({ source, rollback } = transaction())
  current.source = source
})

afterEach(async () => {
  vi.restoreAllMocks()
  await rollback()
  current.source = undefined as unknown as Source
})

describe('notices', () => {
  it('gives no notices to no one', async () => {
    await signIn(null)
    expect(await notices()).toEqual([])
  })

  it('gives the signed-in user theirs', async () => {
    const address = testAccount().address.toLowerCase()
    await seedUser(current.source, { address })
    await signIn(address)
    expect(await notices()).toEqual([])
  })
})
