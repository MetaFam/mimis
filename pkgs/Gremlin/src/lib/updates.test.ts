import { describe, expect, it } from 'vitest'
import * as dagCBOR from '@ipld/dag-cbor'
import { v7 as uuidV7 } from 'uuid'
import { hashTypedData, hexToBytes } from 'viem'
import type { CID } from 'multiformats/cid'
import {
  authorOf, cidFor, digestOf, encodeContent, encodeSpot, encodeUpdate,
  MAX_BLOCK, typedDataFor, validateUpdate,
  type Signed, type Update,
} from '#lib/updates.js'
import { testAccount } from '#lib/server/testing.js'

const cidOf = (value: unknown) => cidFor(dagCBOR.encode(value))
const decoded = (bytes: Uint8Array) => (
  dagCBOR.decode(bytes) as Record<string, unknown>
)

const without = <T extends object>(value: T, key: keyof T) => (
  Object.fromEntries(Object.entries(value).filter(([field]) => field !== key))
)

const sign = async (
  account: ReturnType<typeof testAccount>, signed: Signed,
): Promise<Update> => ({
  ...signed,
  signature: hexToBytes(await account.signTypedData(typedDataFor(signed))),
  createdAt: '2026-11-21T00:00:00.000Z',
})

describe('encodeSpot', () => {
  it('leaves out absent & empty fields', async () => {
    const uuid = uuidV7()
    const [link] = await encodeSpot({
      uuid, contains: [], mounts: undefined, contents: [],
    })
    expect(decoded(link.bytes)).toEqual({ uuid })
    expect(link.cid.toString()).toBe((await cidOf({ uuid })).toString())
  })

  it('encodes a new empty Spot as its uuid alone', async () => {
    const uuid = uuidV7()
    const links = await encodeSpot({ uuid })
    expect(links).toHaveLength(1)
    expect(decoded(links[0].bytes)).toEqual({ uuid })
  })

  it('sorts each entry array by key, so order doesn’t change the CID', async () => {
    const target = await cidOf({ child: 1 })
    const contains = [uuidV7(), uuidV7(), uuidV7()].map((uuid, i) => (
      { uuid, path: `n${i}`, target }
    ))
    const contents = [uuidV7(), uuidV7()].map((uuid) => (
      { uuid, order: 0, type: 'text/plain' }
    ))
    const uuid = uuidV7()
    const [a] = await encodeSpot({ uuid, contains, contents })
    const [b] = await encodeSpot({
      uuid,
      contains: [...contains].reverse(),
      contents: [...contents].reverse(),
    })
    expect(b.cid.toString()).toBe(a.cid.toString())
    expect((decoded(a.bytes).contains as Array<{ uuid: string }>).map(({ uuid }) => uuid))
    .toEqual(contains.map(({ uuid }) => uuid))
  })

  it('sorts keys in UTF-8 byte order, not UTF-16’s', async () => {
    const [link] = await encodeSpot({
      uuid: uuidV7(),
      mounts: [
        { target: '😀', order: 0 },
        { target: '｡', order: 0 },
      ],
    })
    expect((decoded(link.bytes).mounts as Array<{ target: string }>).map(({ target }) => target))
    .toEqual(['｡', '😀'])
  })

  it('round-trips names in any script, & with slashes', async () => {
    const target = await cidOf({ child: 1 })
    const names = ['a/b', 'é', 'σοφία', '✨']
    const contains = names.map((path) => ({ uuid: uuidV7(), path, target }))
    const [link] = await encodeSpot({ uuid: uuidV7(), contains })
    const paths = (decoded(link.bytes).contains as Array<{ path: string }>).map(({ path }) => path)
    expect(paths).toEqual(names)
    const utf8 = (s: string) => [...new TextEncoder().encode(s)]
    expect(paths.map(utf8)).toEqual(names.map(utf8))
  })

  it('throws on an entry & a tombstone with the same key', async () => {
    const uuid = uuidV7()
    await expect(encodeSpot({
      uuid: uuidV7(),
      contents: [{ uuid, order: 0, type: 'text/plain' }, { tombstone: uuid }],
    }))
    .rejects.toThrow(`Two contents entries have the key “${uuid}”.`)
  })

  describe('chains (FR-032)', () => {
    const wide = async (count: number) => {
      const target = await cidOf({ child: 1 })
      return Array.from({ length: count }, (_, i) => (
        { uuid: uuidV7(), path: `child-${String(i).padStart(5, '0')}`, target }
      ))
    }

    it('fits a small version in one block', async () => {
      const links = await encodeSpot({ uuid: uuidV7(), contains: await wide(100) })
      expect(links).toHaveLength(1)
    })

    it('splits 10,000 entries into two blocks, in key order', async () => {
      const contains = await wide(10_000)
      const links = await encodeSpot({ uuid: uuidV7(), contains })
      expect(links).toHaveLength(2)
      const parts = links.map(({ bytes }) => {
        expect(bytes.length).toBeLessThanOrEqual(MAX_BLOCK)
        return (decoded(bytes).contains as Array<{ uuid: string }>).map(({ uuid }) => uuid)
      })
      expect(parts.flat()).toEqual(contains.map(({ uuid }) => uuid).sort())
      expect(parts[0].at(-1)! < parts[1][0]).toBe(true)
      expect((decoded(links[1].bytes).previous as CID).toString())
      .toBe(links[0].cid.toString())
    })

    it('puts `previous` & `root` on the first link only', async () => {
      const previous = await cidOf({ v: 1 })
      const links = await encodeSpot({
        uuid: uuidV7(), previous, contains: await wide(10_000),
      })
      expect((decoded(links[0].bytes).previous as CID).toString())
      .toBe(previous.toString())

      const rooted = await encodeSpot({
        uuid: uuidV7(), root: true, contains: await wide(10_000),
      })
      expect(decoded(rooted[0].bytes)).toMatchObject({ root: true })
      expect(decoded(rooted[0].bytes)).not.toHaveProperty('previous')
      expect(decoded(rooted[1].bytes)).not.toHaveProperty('root')
    })

    it('throws a 400 for an entry too large for any block', async () => {
      const target = await cidOf({ child: 1 })
      await expect(encodeSpot(
        {
          uuid: uuidV7(),
          contains: [{ uuid: uuidV7(), path: 'x'.repeat(1_100_000), target }],
        },
        '#12',
      ))
      .rejects.toMatchObject({
        status: 400,
        body: { message: 'An entry of Spot #12 is too large to publish.' },
      })
    })
  })
})

describe('encodeContent', () => {
  it('encodes blobs sorted by key, with their links', async () => {
    const cid = await cidOf({ file: 1 })
    const uuids = [uuidV7(), uuidV7()]
    const [link] = await encodeContent({
      uuid: uuidV7(),
      blobs: [
        { uuid: uuids[1], cid, size: 3, type: 'text/plain' },
        { tombstone: uuids[0] },
      ],
    })
    const { blobs } = decoded(link.bytes) as { blobs: Array<Record<string, unknown>> }
    expect(blobs[0]).toEqual({ tombstone: uuids[0] })
    expect((blobs[1].cid as CID).toString()).toBe(cid.toString())
  })

  it('throws a 400 for an entry too large for any block', async () => {
    const cid = await cidOf({ file: 1 })
    await expect(encodeContent(
      {
        uuid: uuidV7(),
        blobs: [{ uuid: uuidV7(), cid, size: 3, type: 'x'.repeat(1_100_000) }],
      },
      '#5',
    ))
    .rejects.toMatchObject({
      status: 400,
      body: { message: 'An entry of Content #5 is too large to publish.' },
    })
  })
})

describe('signing', () => {
  const unsigned = async (): Promise<Signed> => ({
    device: uuidV7(),
    sequence: 2,
    spots: await cidOf({ spots: 1 }),
    contents: await cidOf({ contents: 1 }),
    previous: await cidOf({ previous: 1 }),
  })

  it('builds the typed data in contracts/documents.md', async () => {
    const signed = await unsigned()
    expect(typedDataFor(signed)).toEqual({
      domain: { name: 'Mïmis Graph', version: '1' },
      primaryType: 'Update',
      types: {
        Update: [
          { name: 'device', type: 'string' },
          { name: 'sequence', type: 'uint64' },
          { name: 'spots', type: 'string' },
          { name: 'contents', type: 'string' },
          { name: 'previous', type: 'string' },
        ],
      },
      message: {
        device: signed.device,
        sequence: 2n,
        spots: signed.spots.toString(),
        contents: signed.contents.toString(),
        previous: signed.previous!.toString(),
      },
    })
  })

  it('signs an empty `previous` for a first Update', async () => {
    const first = without({ ...await unsigned(), sequence: 1 }, 'previous') as unknown as Signed
    expect(typedDataFor(first).message.previous).toBe('')
  })

  it('recovers the signer’s lowercased address (SC-005)', async () => {
    const account = testAccount()
    const update = await sign(account, await unsigned())
    expect(await authorOf(update)).toBe(account.address.toLowerCase())
  })

  it.each([
    ['device', () => uuidV7()],
    ['sequence', () => 3],
    ['spots', () => cidOf({ other: 1 })],
    ['contents', () => cidOf({ other: 2 })],
    ['previous', () => cidOf({ other: 3 })],
  ])('changes the author when `%s` is altered', async (field, value) => {
    const account = testAccount()
    const update = await sign(account, await unsigned())
    const altered = { ...update, [field]: await value() }
    expect(await authorOf(altered)).not.toBe(account.address.toLowerCase())
  })

  it.each([
    ['createdAt', '1999-12-31T23:59:59.000Z'],
    ['comment', 'hats'],
  ])('keeps the author when unsigned `%s` is altered', async (field, value) => {
    const account = testAccount()
    const update = await sign(account, await unsigned())
    expect(await authorOf({ ...update, [field]: value }))
    .toBe(account.address.toLowerCase())
  })

  it('digests the typed data as EIP-712 does', async () => {
    const update = await sign(testAccount(), await unsigned())
    expect(digestOf(update)).toBe(hashTypedData(typedDataFor(update)))
  })
})

describe('encodeUpdate & validateUpdate', () => {
  const update = async (overrides: Partial<Signed> = {}) => {
    const first = (overrides.sequence ?? 1) === 1
    return sign(testAccount(), {
      device: uuidV7(),
      sequence: 1,
      spots: await cidOf({ spots: 1 }),
      contents: await cidOf({ contents: 1 }),
      ...(first ? {} : { previous: await cidOf({ previous: 1 }) }),
      ...overrides,
    })
  }
  const roundTrip = async (value: Update) => (
    dagCBOR.decode((await encodeUpdate(value)).bytes)
  )

  it('leaves out an absent `previous` & `comment`', async () => {
    expect(Object.keys(await roundTrip(await update()) as object).sort())
    .toEqual(['contents', 'createdAt', 'device', 'sequence', 'signature', 'spots'])
  })

  it('validates a decoded Update', async () => {
    const original = { ...await update({ sequence: 2 }), comment: 'hats' }
    const valid = await validateUpdate(await roundTrip(original))
    expect(valid.device).toBe(original.device)
    expect(valid.previous?.toString()).toBe(original.previous?.toString())
    expect(valid.comment).toBe('hats')
    expect(await authorOf(valid)).toBe(await authorOf(original))
  })

  it('gets one CID for one Update', async () => {
    const value = await update()
    const { bytes, cid } = await encodeUpdate(value)
    expect(cid.toString()).toBe((await cidFor(bytes)).toString())
  })

  const malformed: Array<[string, (u: Update) => unknown, string]> = [
    ['a missing field', (u) => without(u, 'spots'), 'spots is missing'],
    ['a wrong type', (u) => ({ ...u, device: 5 }), 'device isn’t a string'],
    ['a CID as a string', (u) => ({ ...u, contents: u.contents.toString() }), 'contents isn’t a CID'],
    ['a 64-byte signature', (u) => ({ ...u, signature: u.signature.slice(1) }), 'signature isn’t 65 bytes'],
    ['sequence 0', (u) => ({ ...u, sequence: 0 }), 'sequence isn’t a positive integer'],
    ['sequence 1.5', (u) => ({ ...u, sequence: 1.5 }), 'sequence isn’t a positive integer'],
    ['not a map', () => 'Update', 'the Update isn’t a map'],
  ]

  it.each(malformed)('rejects %s', async (_, alter, reason) => {
    await expect(validateUpdate(alter(await update())))
    .rejects.toThrow(`Malformed Update: ${reason}.`)
  })

  it('rejects `previous` with sequence 1', async () => {
    const first = await update()
    await expect(validateUpdate({ ...first, previous: first.spots }))
    .rejects.toThrow('Malformed Update: previous is present with sequence 1.')
  })

  it('rejects a missing `previous` with sequence 2', async () => {
    const second = without(await update({ sequence: 2 }), 'previous')
    await expect(validateUpdate(second))
    .rejects.toThrow('Malformed Update: previous is missing with sequence 2.')
  })

  it('rejects an unrecoverable signature', async () => {
    const signature = new Uint8Array(65)
    signature[64] = 27
    await expect(validateUpdate({ ...await update(), signature }))
    .rejects.toThrow('Malformed Update: signature can’t be recovered.')
  })
})
