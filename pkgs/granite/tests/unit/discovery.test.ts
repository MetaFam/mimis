import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { decode, encode } from '#lib/codec.ts'
import { UnreachableNodeError } from '#lib/errors.ts'
import { decodeAndVerify, maxAnnouncementBytes } from '#lib/announce.ts'
import { addressOf, generateKey } from '#lib/keys.ts'
import { network, tick } from './harness.ts'
import type { HistoryEntry } from '#lib/index.ts'

describe('history (US3, FR-011)', () => {
  it('walks the full chain newest → oldest', async () => {
    const net = network()
    const { granite, address } = net.publisher()
    const first = await granite.publish({ data: { v: 1 } })
    const second = await granite.publish({ data: { v: 2 } })
    const third = await granite.publish({ data: { v: 3 } })
    const entries: HistoryEntry[] = []
    for await(const entry of net.reader().history(address)) {
      entries.push(entry)
    }
    assert.equal(entries.length, 3)
    assert.ok(entries[0].update.equals(third.update))
    assert.ok(entries[1].update.equals(second.update))
    assert.ok(entries[2].update.equals(first.update))
    assert.equal(entries[2].prev, undefined)
    assert.equal(entries[0].publisher, address)
  })

  it('yields what it reached, then throws on a broken chain', async () => {
    const net = network()
    const { granite, address } = net.publisher()
    await granite.publish({ data: { v: 1 } })
    const second = await granite.publish({ data: { v: 2 } })
    const third = await granite.publish({ data: { v: 3 } })
    net.store.delete(second.update)
    const entries: HistoryEntry[] = []
    await assert.rejects(
      (async () => {
        for await(const entry of net.reader().history(address)) {
          entries.push(entry)
        }
      })(),
      (error: UnreachableNodeError) => (
        error instanceof UnreachableNodeError && error.cid === second.update.toString()
      ),
    )
    assert.equal(entries.length, 1)
    assert.ok(entries[0].update.equals(third.update))
  })

  it('treats a never-published address as absence, not an error', async () => {
    const net = network()
    const nobody = addressOf(generateKey())
    assert.equal(await net.reader().latest(nobody), undefined)
    const entries: HistoryEntry[] = []
    for await(const entry of net.reader().history(nobody)) {
      entries.push(entry)
    }
    assert.deepEqual(entries, [])
  })
})

describe('announcement verification (contracts/messages.md)', () => {
  const captured = async () => {
    const net = network()
    let bytes: Uint8Array | undefined
    await net.announcer.for().subscribe((message) => {
      bytes = message
    })
    const { granite, address } = net.publisher()
    const { update } = await granite.publish({ edges: {} })
    await tick()
    assert.ok(bytes)
    return {
      bytes: bytes!,
      address,
      update,
    }
  }

  it('accepts a valid first-publish announcement (prev absent)', async () => {
    const { bytes, address, update } = await captured()
    const verified = await decodeAndVerify(bytes)
    assert.ok(verified.ok)
    assert.equal(verified.announcement.publisher, address)
    assert.ok(verified.announcement.root.equals(update))
    assert.equal(verified.announcement.prev, undefined)
  })

  it('drops a tampered root (recovered signer mismatch)', async () => {
    const { bytes } = await captured()
    const payload = decode(bytes) as Record<string, unknown>
    const root = new Uint8Array(payload.root as Uint8Array)
    root[root.length - 1] ^= 0xff
    const tampered = encode({ ...payload, root })
    const verified = await decodeAndVerify(tampered)
    assert.ok(!verified.ok)
    assert.match(verified.reason, /≠ publisher/)
  })

  it('drops wrong-shape payloads without throwing', async () => {
    for(const junk of [
      encode({ foo: 1 }),
      encode('not a map'),
      encode({ granite: 2, publisher: '0x', root: new Uint8Array(), at: 0, sig: new Uint8Array() }),
      new Uint8Array([0xff, 0x00, 0x13]),
    ]) {
      const verified = await decodeAndVerify(junk)
      assert.ok(!verified.ok)
    }
  })

  it('drops oversize messages without decoding', async () => {
    const oversize = encode({ blob: new Uint8Array(maxAnnouncementBytes + 1) })
    const verified = await decodeAndVerify(oversize)
    assert.ok(!verified.ok)
    assert.match(verified.reason, /oversize/)
  })
})

describe('follow (US3, FR-008)', () => {
  it('delivers verified announcements and supports unsubscribe', async () => {
    const net = network()
    const reader = net.reader()
    const heard: string[] = []
    const unsubscribe = reader.follow(({ root }) => {
      heard.push(root.toString())
    })
    await tick()
    const { granite } = net.publisher()
    const first = await granite.publish({ data: { n: 1 } })
    await tick()
    unsubscribe()
    await tick()
    await granite.publish({ data: { n: 2 } })
    await tick()
    assert.deepEqual(heard, [first.update.toString()])
  })
})
