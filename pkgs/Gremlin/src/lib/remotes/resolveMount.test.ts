// Not `resolveMount.remote.test.ts`: SvelteKit takes any `*.remote.*`
// file for a module of remote functions.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as v from 'valibot'
import { error } from '@sveltejs/kit'
import { v7 as uuidV7 } from 'uuid'
import {
  followMount, keepMount, removeMount,
} from '#lib/remotes/resolveMount.remote.js'
import { edgeId } from '#lib/server/janusgraph.js'
import { relinkSpot } from '#lib/server/moves.js'
import { renameSpot } from '#lib/server/renames.js'
import { createSessionToken } from '#lib/server/auth.js'
import {
  mount, seedTree, seedUser, testAccount, transaction,
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
let address: string
let mounted: string
const now = '2026-11-22T00:00:00.000Z'

const signIn = async (as: string | null) => {
  const headers = new Headers()
  if(as) {
    const { token } = await createSessionToken(as)
    headers.set('authorization', `Bearer ${token}`)
  }
  current.request = new Request('http://localhost/', { headers })
}

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  current.source = source
  address = testAccount().address.toLowerCase()
  const { root } = await seedUser(source, { address })
  const { root: sRoot } = await seedUser(source, { address: '0xs' })
  const theirs = await seedTree(source, { root: sRoot, tree: { image: { hatz: {} }, old: {} } })
  await mount(source, { from: root, to: sRoot })
  await renameSpot({ source, address, path: ['image'], from: 'hatz', to: 'hats', now })
  await relinkSpot({
    source, what: theirs.get('image/hatz')!, from: theirs.get('image')!,
    to: theirs.get('old')!, now, uuid: uuidV7(),
  })
  mounted = edgeId((await source.V(root).out('CONTAINS').outE('MOUNT').id().next()).value)
  await signIn(address)
  inTransaction.mockClear()
})

afterEach(async () => {
  vi.restoreAllMocks()
  await rollback()
})

describe.each([
  ['removeMount', removeMount, { from: ['image', 'hats'], to: ['old', 'hatz'] }],
  ['followMount', followMount, { from: ['image', 'hats'], to: ['old', 'hats'] }],
  ['keepMount', keepMount, { from: ['image', 'hats'], to: ['image', 'hats'] }],
] as const)('%s', (_, resolve, moved) => {
  it('resolves in one transaction, giving the paths before & after', async () => {
    expect(await resolve({ mount: mounted })).toEqual(moved)
    expect(inTransaction).toHaveBeenCalledOnce()
  })

  it('refuses no one with a 401 & opens no transaction', async () => {
    await signIn(null)
    await expect(resolve({ mount: mounted })).rejects.toMatchObject({ status: 401 })
    expect(inTransaction).not.toHaveBeenCalled()
  })

  it('passes a 403 for someone else’s mount through', async () => {
    await signIn(testAccount().address.toLowerCase())
    await expect(resolve({ mount: mounted })).rejects.toMatchObject({ status: 403 })
  })

  it('passes a 404 for no such mount through', async () => {
    await expect(resolve({ mount: 'nope' })).rejects.toMatchObject({
      status: 404, body: { message: 'There’s no mounted link nope.' },
    })
  })

  it('passes a 409 through as it is', async () => {
    inTransaction.mockImplementationOnce(async () => error(409, 'That link hasn’t moved.'))
    await expect(resolve({ mount: mounted })).rejects.toMatchObject({
      status: 409, body: { message: 'That link hasn’t moved.' },
    })
  })

  it('refuses a mount that isn’t a string as a bad request', async () => {
    await expect(resolve({ mount: 7 } as unknown as { mount: string }))
    .rejects.toMatchObject({ status: 400 })
    expect(inTransaction).not.toHaveBeenCalled()
  })
})
