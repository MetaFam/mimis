import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  asNode,
  asUpdate,
  cidOf,
  decode,
  encode,
  splitPath,
  CID,
} from '#lib/codec.ts'
import { MalformedDocumentError } from '#lib/errors.ts'

const publisher = `0x${'ab'.repeat(20)}` as const

const someCid = await cidOf(encode({ edges: {} }))

const roundTrip = async (document: unknown) => {
  const bytes = encode(document)
  const cid = await cidOf(bytes)
  return {
    cid,
    value: decode(bytes),
  }
}

describe('codec round trips', () => {
  it('encodes and validates a node with data, edges, and mounts', async () => {
    const { cid, value } = await roundTrip({
      data: { title: 'Dune' },
      edges: { books: { props: { type: 'shelf' }, child: someCid } },
      mounts: [{ source: publisher, order: 0 }],
    })
    const node = asNode(cid, value)
    assert.equal(node.data?.title, 'Dune')
    assert.ok(node.edges.books.child.equals(someCid))
    assert.equal(node.mounts[0].order, 0)
  })

  it('encodes and validates an update, prev optional', async () => {
    const first = await roundTrip({
      granite: 1,
      publisher,
      root: someCid,
      at: 1_750_000_000,
    })
    const update = asUpdate(first.cid, first.value)
    assert.equal(update.prev, undefined)
    const second = await roundTrip({
      granite: 1,
      publisher,
      root: someCid,
      prev: first.cid,
      at: 1_750_000_001,
    })
    assert.ok(asUpdate(second.cid, second.value).prev?.equals(first.cid))
  })

  it('derives identical CIDs for identical content', async () => {
    const a = await cidOf(encode({ edges: { x: { child: someCid } } }))
    const b = await cidOf(encode({ edges: { x: { child: someCid } } }))
    const c = await cidOf(encode({ edges: { y: { child: someCid } } }))
    assert.ok(a.equals(b))
    assert.ok(!a.equals(c))
  })
})

describe('codec shape guards (FR-012)', () => {
  const rejects = async (document: unknown, guard: typeof asNode | typeof asUpdate) => {
    const { cid, value } = await roundTrip(document)
    assert.throws(
      () => guard(cid, value),
      MalformedDocumentError,
    )
  }

  it('rejects unexpected keys', async () => {
    await rejects({ edges: {}, extra: true }, asNode)
    await rejects({ granite: 1, publisher, root: someCid, at: 1, bonus: 2 }, asUpdate)
  })

  it('rejects edge names containing "/" and empty names', async () => {
    await rejects({ edges: { 'a/b': { child: someCid } } }, asNode)
    await rejects({ edges: { '': { child: someCid } } }, asNode)
  })

  it('rejects edges without a CID child', async () => {
    await rejects({ edges: { a: { child: 'bafy-not-a-link' } } }, asNode)
    await rejects({ edges: { a: {} } }, asNode)
  })

  it('rejects malformed mounts', async () => {
    await rejects({ mounts: [{ source: 'not-an-address', order: 0 }] }, asNode)
    await rejects({ mounts: [{ source: publisher, order: 1.5 }] }, asNode)
    await rejects({ mounts: [{ source: publisher }] }, asNode)
  })

  it('rejects null prev (absent-not-null) and bad publishers', async () => {
    await rejects({ granite: 1, publisher, root: someCid, prev: null, at: 1 }, asUpdate)
    await rejects({ granite: 1, publisher: publisher.toUpperCase(), root: someCid, at: 1 }, asUpdate)
    await rejects({ granite: 2, publisher, root: someCid, at: 1 }, asUpdate)
    await rejects({ granite: 1, publisher, root: someCid, at: 1.5 }, asUpdate)
  })

  it('identifies the offending CID and field', async () => {
    const { cid, value } = await roundTrip({ edges: { a: {} } })
    try {
      asNode(cid, value)
      assert.fail('should have thrown')
    } catch(error) {
      assert.ok(error instanceof MalformedDocumentError)
      assert.equal(error.cid, cid.toString())
      assert.match(error.field, /edges\.a/)
    }
  })
})

describe('paths', () => {
  it('splits and rejects empty segments', () => {
    assert.deepEqual(splitPath('/books/dune'), ['books', 'dune'])
    assert.deepEqual(splitPath('/'), [])
    assert.deepEqual(splitPath(''), [])
    assert.throws(() => splitPath('/a//b'), TypeError)
  })
})

describe('CID re-export', () => {
  it('parses its own string form', () => {
    assert.ok(CID.parse(someCid.toString()).equals(someCid))
  })
})
