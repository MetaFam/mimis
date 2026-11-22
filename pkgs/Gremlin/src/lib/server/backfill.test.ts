import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import gremlin from 'gremlin'
import settings from '#lib/settings.svelte.js'
import {
  assertLocalGraph, backfillRepresentations, lockSequences,
} from '#lib/server/backfill.js'
import { addSpot, testAccount, transaction, type Id } from '#lib/server/testing.js'

const { merge: Merge, statics: __, t: T } = gremlin.process
type Source = ReturnType<typeof transaction>['source']

let source: Source
let rollback: () => Promise<void>

beforeEach(() => {
  ;({ source, rollback } = transaction())
})

afterEach(async () => {
  await rollback()
})

describe('backfillRepresentations', () => {
  let address: string
  let spot: Id
  let content: Id

  beforeEach(async () => {
    // Whatever the graph holds already is migrated first, inside this
    // transaction, so the counts below are only the seeded data’s.
    await backfillRepresentations({ source })

    address = testAccount().address.toLowerCase()
    const createdAt = '2026-11-17T00:00:00.000Z'
    await (
      source.mergeV(new Map([[T.label, 'Users']]))
      .option(Merge.onCreate, { createdAt })
      .as('users')
      .addV('User').property('address', address)
      .addE('INCLUDES').from_('users').property('createdAt', createdAt)
      .toList()
    )
    spot = await addSpot(source)
    content = (await (
      source.V(spot).as('spot')
      .addV('Content').property('uuid', 'c1').property('type', 'text/plain').property('order', -1)
      .as('content')
      .addE('AS').from_('spot').to('content').property('order', '-1')
      .addV('Blob').property('cid', 'bafyTXT').property('size', 3)
      .addE('IS').from_('content')
      .select('content').id()
      .next()
    )).value as Id
  })

  const afterOf = async (id: Id) => (
    source.V(spot).outE('AS').where(__.inV().hasId(id)).values('after').toList()
  )
  const add = async (uuid: string, order: number | string, createdAt = '2026-11-01T00:00:00.000Z') => (
    (await (
      source.V(spot).as('spot')
      .addV('Content').property('uuid', uuid).property('type', 'text/plain')
      .property('createdAt', createdAt)
      .as('content')
      .addE('AS').from_('spot').to('content').property('order', order)
      .select('content').id()
      .next()
    )).value as Id
  )

  it('migrates today’s shapes, & changes nothing the second time', async () => {
    expect(await backfillRepresentations({ source }))
    .toEqual({ representations: 1, ranks: 1, authors: 1 })

    expect((await source.V(content).outE('IS').values('uuid').next()).value)
    .toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(await source.V(spot).outE('AS').values('order').toList()).toEqual([])
    expect(await source.V(content).values('order').toList()).toEqual([])
    expect(await afterOf(content)).toEqual([])
    expect(await (
      source.V().has('User', 'address', address).inE('INCLUDES').values('author').toList()
    )).toEqual([address])

    expect(await backfillRepresentations({ source }))
    .toEqual({ representations: 0, ranks: 0, authors: 0 })
  })

  it('ranks a Spot’s Contents as they listed: by `order`, then newest first (FR-025)', async () => {
    const late = await add('c-late', 0, '2026-11-02T00:00:00.000Z')
    const early = await add('c-early', 0, '2026-11-01T00:00:00.000Z')
    const last = await add('c-last', '5', '2026-10-01T00:00:00.000Z')
    expect(await backfillRepresentations({ source })).toMatchObject({ ranks: 4 })
    expect(await afterOf(content)).toEqual([])
    expect(await afterOf(late)).toEqual(['c1'])
    expect(await afterOf(early)).toEqual(['c-late'])
    expect(await afterOf(last)).toEqual(['c-early'])
    expect(await source.V(spot).outE('AS').has('order').count().next()).toMatchObject({ value: 0 })
  })

  it('takes a missing `Content.order` from the `AS` edge', async () => {
    await source.V(content).properties('order').drop().toList()
    await source.V(spot).outE('AS').property('order', '2').toList()
    const first = await add('c0', 1)
    await backfillRepresentations({ source })
    expect(await afterOf(first)).toEqual([])
    expect(await afterOf(content)).toEqual(['c0'])
  })

  it('keeps an existing representation uuid', async () => {
    await source.V(content).outE('IS').property('uuid', 'kept').toList()
    expect(await backfillRepresentations({ source }))
    .toMatchObject({ representations: 0 })
    expect(await source.V(content).outE('IS').values('uuid').toList()).toEqual(['kept'])
  })
})

describe('lockSequences', () => {
  const client = () => {
    const { Client, auth: { PlainTextSaslAuthenticator } } = gremlin.driver
    return new Client(settings.janusGraphURL, {
      traversalsource: 'g',
      authenticator: new PlainTextSaslAuthenticator(
        settings.janusGraphUsername, settings.janusGraphPassword,
      ),
    })
  }

  it('makes `sequence` a locked key, & is idempotent', async () => {
    await transaction().rollback()
    const connection = client()
    try {
      expect(await lockSequences(connection)).toBe('LOCK')
      expect(await lockSequences(connection)).toBe('LOCK')
    } finally {
      await connection.close()
    }
  })

  it('throws when the key doesn’t end up locked', async () => {
    const stub = { submit: async () => ({ toArray: () => ['DEFAULT'] }) }
    await expect(lockSequences(stub)).rejects.toThrow('`sequence` is DEFAULT, not LOCK.')
  })
})

describe('assertLocalGraph', () => {
  it('refuses a remote graph', () => {
    expect(() => assertLocalGraph('wss://janus.example.org/gremlin', { remote: false }))
    .toThrow('Refusing to migrate wss://janus.example.org/gremlin; pass --remote to allow it.')
  })

  it.each([
    'ws://localhost:8182/gremlin',
    'ws://127.0.0.1:8182/gremlin',
    'ws://[::1]:8182/gremlin',
  ])('allows %s', (url) => {
    expect(() => assertLocalGraph(url, { remote: false })).not.toThrow()
  })

  it('allows a remote graph with `remote`', () => {
    expect(() => assertLocalGraph('wss://janus.example.org/gremlin', { remote: true }))
    .not.toThrow()
  })
})
