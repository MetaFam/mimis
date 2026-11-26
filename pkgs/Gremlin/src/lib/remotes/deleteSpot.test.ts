// Not `deleteSpot.remote.test.ts`: SvelteKit takes any `*.remote.*`
// file for a module of remote functions.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as v from 'valibot'
import { deleteSpot } from '#lib/remotes/deleteSpot.remote.js'
import { createSessionToken } from '#lib/server/auth.js'
import {
  addSpot, link, mount, mountLink, seedTree, seedUser, testAccount,
  transaction, type Id,
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
let from: Id
let what: Id

const newAddress = () => testAccount().address.toLowerCase()
const signIn = async (as: string | null) => {
  const headers = new Headers()
  if(as) {
    const { token } = await createSessionToken(as)
    headers.set('authorization', `Bearer ${token}`)
  }
  current.request = new Request('http://localhost/', { headers })
}
const names = async (spot: Id) => (
  (await source.V(spot).outE('CONTAINS').values('path').toList()).sort()
)
const valid = () => ({ what: Number(what), from: Number(from), name: 'x' })

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  current.source = source
  address = newAddress()
  const { root } = await seedUser(source, { address })
  const ids = await seedTree(source, { root, tree: { dir: { x: { y: {} } } } })
  ;[from, what] = [ids.get('dir')!, ids.get('dir/x')!]
  await signIn(address)
  inTransaction.mockClear()
})

afterEach(async () => {
  vi.restoreAllMocks()
  await rollback()
})

describe('deleteSpot', () => {
  it('takes the Spot out of its container & keeps what it holds', async () => {
    expect(await deleteSpot(valid())).toBe(true)
    expect(await names(from)).toEqual([])
    expect(await names(what)).toEqual(['y'])
    expect(inTransaction).toHaveBeenCalledOnce()
  })

  it('stamps a published link’s marker with the time of the delete', async () => {
    await source.V(from).outE('CONTAINS').property('published', '["x"]').toList()
    const before = Date.now()
    await deleteSpot(valid())
    const after = Date.now()
    const { value: stamp } = (
      await source.V(from).outE('REMOVED').values('createdAt').next()
    )
    expect(stamp).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
    expect(Date.parse(stamp as string)).toBeGreaterThanOrEqual(before)
    expect(Date.parse(stamp as string)).toBeLessThanOrEqual(after)
  })

  it('takes out a Spot that’s in someone else’s tree too, & leaves it there', async () => {
    const { root: theirs } = await seedUser(source, { address: newAddress() })
    await link(source, { from: theirs, to: what, name: 'shared' })
    expect(await deleteSpot(valid())).toBe(true)
    expect(await names(from)).toEqual([])
    expect(await names(theirs)).toEqual(['shared'])
  })

  it('takes out the user’s rename of someone else’s Spot, & leaves theirs', async () => {
    const { root: theirs } = await seedUser(source, { address: newAddress() })
    const their = await seedTree(source, { root: theirs, tree: { dir: { hatz: {} } } })
    await mount(source, { from: Number(from), to: theirs })
    await mountLink(source, {
      from, to: their.get('dir/hatz')!, uuid: 'u-hatz', path: 'hats', parent: 'u-dir',
    })
    expect(await deleteSpot({ what: Number(their.get('dir/hatz')), from: Number(from), name: 'hats' }))
    .toBe(true)
    expect(await source.V(from).outE('MOUNT').has('path').count().next()).toMatchObject({ value: 0 })
    expect(await names(their.get('dir')!)).toEqual(['hatz'])
  })

  it('gives a 404 for a name the Spot isn’t under', async () => {
    await expect(deleteSpot({ ...valid(), name: 'nope' }))
    .rejects.toMatchObject({
      status: 404,
      body: { message: `Spot #${from} doesn’t hold Spot #${what} as “nope”.` },
    })
    expect(await names(from)).toEqual(['x'])
  })

  it('gives a 404 for a Spot the container doesn’t hold', async () => {
    const elsewhere = await addSpot(source)
    await expect(deleteSpot({ ...valid(), what: Number(elsewhere) }))
    .rejects.toMatchObject({ status: 404 })
    expect(await names(from)).toEqual(['x'])
  })

  it.each([
    { who: 'someone else', as: newAddress, status: 403 },
    { who: 'no one', as: () => null, status: 401 },
  ])('refuses $who with a $status & opens no transaction', async ({ as, status }) => {
    await signIn(as())
    await expect(deleteSpot(valid())).rejects.toMatchObject({ status })
    expect(inTransaction).not.toHaveBeenCalled()
    expect(await names(from)).toEqual(['x'])
  })

  it('refuses a container the user doesn’t own, though they own the Spot', async () => {
    const { root: theirs } = await seedUser(source, { address: newAddress() })
    await link(source, { from: theirs, to: what, name: 'x' })
    await expect(deleteSpot({ ...valid(), from: Number(theirs) }))
    .rejects.toMatchObject({
      status: 403,
      body: {
        message: `The container, Spot #${theirs}, doesn’t belong to the user ${address}.`,
      },
    })
    expect(await names(theirs)).toEqual(['x'])
  })

  it.each([
    { given: 'a string id', input: () => ({ ...valid(), what: String(what) }) },
    { given: 'no container', input: () => ({ ...valid(), from: undefined }) },
    { given: 'no name', input: () => ({ ...valid(), name: undefined }) },
  ])('refuses $given as a bad request', async ({ input }) => {
    await expect(deleteSpot(input() as unknown as ReturnType<typeof valid>))
    .rejects.toMatchObject({ status: 400 })
    expect(inTransaction).not.toHaveBeenCalled()
    expect(await names(from)).toEqual(['x'])
  })

  it('reports an unexpected failure as a 500 naming the delete', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failure = new Error('Lock wait timed out.')
    inTransaction.mockRejectedValueOnce(failure)
    await expect(deleteSpot(valid())).rejects.toMatchObject({
      status: 500,
      body: { message: 'Delete: "Lock wait timed out."' },
    })
    expect(logged).toHaveBeenCalledWith({ Delete: failure })
  })
})
