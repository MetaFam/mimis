import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cidOf, encode, CID, type Address } from '#lib/codec.ts'
import { MalformedDocumentError, UnreachableNodeError } from '#lib/errors.ts'
import { validateArchive, type LoadPorts } from '#lib/car.ts'
import { memoryStore, type MemoryStore } from '../fakes.ts'

const publisher: Address = `0x${'ab'.repeat(20)}`

// Fake LoadPorts: dag-cbor documents live in a memoryStore; UnixFS file
// content is a separate name → block-count map, mirroring how the kubo
// adapter answers with offline refs -r.
const ports = (store: MemoryStore, content = new Map<string, number>()): LoadPorts => ({
  getBlock: (cid) => (
    store.get(cid)
  ),
  hasContent: async (cid) => {
    const blocks = content.get(cid.toString())
    if(blocks === undefined) {
      throw new UnreachableNodeError(cid.toString())
    }
    return blocks
  },
})

const put = (store: MemoryStore, value: unknown) => (
  store.put(encode(value))
)

// update → root dir → file leaf → content (1 block)
const archive = async (store: MemoryStore) => {
  const content = await cidOf(encode('file bytes stand-in'))
  const file = await put(store, {
    data: { content, size: 14, type: 'text/plain' },
    edges: {},
  })
  const dir = await put(store, {
    edges: { 'hello.txt': { child: file } },
  })
  const update = await put(store, {
    granite: 1,
    publisher,
    root: dir,
    at: 1,
  })
  return {
    content,
    file,
    dir,
    update,
    contents: new Map([[content.toString(), 1]]),
  }
}

describe('validateArchive (US2, FR-008, SC-004)', () => {
  it('accepts a complete archive and counts its closure', async () => {
    const store = memoryStore()
    const { update, dir, file, contents } = await archive(store)
    const result = await validateArchive(ports(store, contents), update)
    assert.equal(result.update.publisher, publisher)
    assert.ok(result.update.root.equals(dir))
    assert.equal(result.blocks, 4)
    assert.deepEqual(
      [...result.nodes.keys()].sort(),
      [dir.toString(), file.toString()].sort(),
    )
  })

  it('rejects a root that is not a granite Update, naming it', async () => {
    const store = memoryStore()
    const { dir } = await archive(store)
    await assert.rejects(
      validateArchive(ports(store), dir),
      (error: MalformedDocumentError) => (
        error instanceof MalformedDocumentError && error.cid === dir.toString()
      ),
    )
  })

  it('rejects a missing root block, naming it', async () => {
    const store = memoryStore()
    const absent = await cidOf(encode('never stored'))
    await assert.rejects(
      validateArchive(ports(store), absent),
      (error: UnreachableNodeError) => (
        error instanceof UnreachableNodeError && error.cid === absent.toString()
      ),
    )
  })

  it('rejects a missing tree node, naming the first offender', async () => {
    const store = memoryStore()
    const { update, file, contents } = await archive(store)
    store.delete(file)
    await assert.rejects(
      validateArchive(ports(store, contents), update),
      (error: UnreachableNodeError) => (
        error instanceof UnreachableNodeError && error.cid === file.toString()
      ),
    )
  })

  it('rejects missing file content, naming the content root', async () => {
    const store = memoryStore()
    const { update, content } = await archive(store)
    await assert.rejects(
      validateArchive(ports(store), update),
      (error: UnreachableNodeError) => (
        error instanceof UnreachableNodeError && error.cid === content.toString()
      ),
    )
  })

  it('rejects a malformed node document, naming it', async () => {
    const store = memoryStore()
    const bad = await put(store, { edges: 5 })
    const update = await put(store, {
      granite: 1,
      publisher,
      root: bad,
      at: 1,
    })
    await assert.rejects(
      validateArchive(ports(store), update),
      (error: MalformedDocumentError) => (
        error instanceof MalformedDocumentError && error.cid === bad.toString()
      ),
    )
  })

  it('rejects bytes that are not dag-cbor, naming the block', async () => {
    const store = memoryStore()
    const garbage = await store.put(new Uint8Array([0xff, 0xff, 0xff]))
    const update = await put(store, {
      granite: 1,
      publisher,
      root: garbage,
      at: 1,
    })
    await assert.rejects(
      validateArchive(ports(store), update),
      (error: MalformedDocumentError) => (
        error instanceof MalformedDocumentError && error.cid === garbage.toString()
      ),
    )
  })

  it('allows an absent prev target (partial-snapshot rules)', async () => {
    const store = memoryStore()
    const { dir, contents } = await archive(store)
    const prev = await cidOf(encode('an earlier update, elsewhere'))
    const update = await put(store, {
      granite: 1,
      publisher,
      root: dir,
      prev,
      at: 2,
    })
    const result = await validateArchive(ports(store, contents), update)
    assert.ok(result.update.prev?.equals(prev))
  })

  it('recurses through CID mounts and skips live address mounts', async () => {
    const store = memoryStore()
    const missing = await cidOf(encode('mounted but absent'))
    const mounted = await put(store, {
      edges: {},
      mounts: [
        { source: publisher, order: 0 },
        { source: missing, order: 1 },
      ],
    })
    const update = await put(store, {
      granite: 1,
      publisher,
      root: mounted,
      at: 1,
    })
    await assert.rejects(
      validateArchive(ports(store), update),
      (error: UnreachableNodeError) => (
        error instanceof UnreachableNodeError && error.cid === missing.toString()
      ),
    )
  })

  it('counts shared subtrees once (dedup-friendly, FR-005)', async () => {
    const store = memoryStore()
    const content = await cidOf(encode('shared bytes'))
    const file = await put(store, {
      data: { content, size: 12 },
      edges: {},
    })
    const dir = await put(store, {
      edges: {
        'a.txt': { child: file },
        'b.txt': { child: file },
      },
    })
    const update = await put(store, {
      granite: 1,
      publisher,
      root: dir,
      at: 1,
    })
    const result = await validateArchive(
      ports(store, new Map([[content.toString(), 1]])),
      update,
    )
    assert.equal(result.blocks, 4)
  })
})
