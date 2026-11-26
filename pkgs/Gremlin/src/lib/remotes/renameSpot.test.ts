// Not `renameSpot.remote.test.ts`: SvelteKit takes any `*.remote.*`
// file for a module of remote functions.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as v from 'valibot'
import { error } from '@sveltejs/kit'
import { renameSpot } from '#lib/remotes/renameSpot.remote.js'
import { createSessionToken } from '#lib/server/auth.js'
import {
  seedTree, seedUser, testAccount, transaction, type Id,
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
  }
})

let source: Source
let rollback: () => Promise<void>
let image: Id

const signIn = async (as: string | null) => {
  const headers = new Headers()
  if(as) {
    const { token } = await createSessionToken(as)
    headers.set('authorization', `Bearer ${token}`)
  }
  current.request = new Request('http://localhost/', { headers })
}
const names = async () => (
  (await source.V(image).outE('CONTAINS').values('path').toList()).sort()
)

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  current.source = source
  const address = testAccount().address.toLowerCase()
  const { root } = await seedUser(source, { address })
  image = (await seedTree(source, { root, tree: { image: { hatz: {} } } })).get('image')!
  await signIn(address)
  inTransaction.mockClear()
})

afterEach(async () => {
  vi.restoreAllMocks()
  await rollback()
})

describe('renameSpot', () => {
  it('renames in one transaction, giving the new path', async () => {
    expect(await renameSpot({ path: ['image'], from: 'hatz', to: 'hats' }))
    .toEqual({ path: ['image', 'hats'] })
    expect(await names()).toEqual(['hats'])
    expect(inTransaction).toHaveBeenCalledOnce()
  })

  it('refuses no one with a 401 & opens no transaction', async () => {
    await signIn(null)
    await expect(renameSpot({ path: ['image'], from: 'hatz', to: 'hats' }))
    .rejects.toMatchObject({ status: 401 })
    expect(inTransaction).not.toHaveBeenCalled()
    expect(await names()).toEqual(['hatz'])
  })

  it.each(['', '  ', '.', '..', 'a/b'])('refuses %j before renaming', async (to) => {
    await expect(renameSpot({ path: ['image'], from: 'hatz', to }))
    .rejects.toMatchObject({ status: 400 })
    expect(inTransaction).not.toHaveBeenCalled()
  })

  it('passes a refusal through as it is', async () => {
    inTransaction.mockImplementationOnce(async () => error(409, '/image/ already contains “hats”'))
    await expect(renameSpot({ path: ['image'], from: 'hatz', to: 'hats' }))
    .rejects.toMatchObject({ status: 409, body: { message: '/image/ already contains “hats”' } })
  })

  it('reports an unexpected failure as a 500 naming the rename', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failure = new Error('Lock wait timed out.')
    inTransaction.mockRejectedValueOnce(failure)
    await expect(renameSpot({ path: ['image'], from: 'hatz', to: 'hats' }))
    .rejects.toMatchObject({ status: 500, body: { message: 'Rename: "Lock wait timed out."' } })
    expect(logged).toHaveBeenCalledWith({ Rename: failure })
  })
})
