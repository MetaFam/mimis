import * as dagCBOR from '@ipld/dag-cbor'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'

interface Entry { p: number, k: Uint8Array, v: CID, t: CID | null }
interface Node { l: CID | null, e: Array<Entry> }
type Item = { key: Uint8Array, value: CID, layer: number }

const utf8 = new TextEncoder()

export const compareBytes = (a: Uint8Array, b: Uint8Array) => {
  for(let i = 0; i < Math.min(a.length, b.length); i++) {
    if(a[i] !== b[i]) return a[i] - b[i]
  }
  return a.length - b.length
}

const sharedPrefix = (a: Uint8Array, b: Uint8Array) => {
  let i = 0
  while(i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/** Half the leading zero bits of the key’s SHA-256: fanout 4. */
export async function layerOf(key: string | Uint8Array) {
  const bytes = typeof key === 'string' ? utf8.encode(key) : key
  const { digest } = await sha256.digest(bytes)
  let zeros = 0
  for(const byte of digest) {
    zeros += byte === 0 ? 8 : Math.clz32(byte) - 24
    if(byte !== 0) break
  }
  return Math.floor(zeros / 2)
}

/** The root of atproto’s MST (v3) holding `entries`. */
export async function build(
  entries: Array<[string, CID]>,
  blocks: { put(bytes: Uint8Array): Promise<CID> },
) {
  const items: Array<Item> = await Promise.all(entries.map(
    async ([key, value]) => ({
      key: utf8.encode(key), value, layer: await layerOf(key),
    })
  ))
  items.sort((a, b) => compareBytes(a.key, b.key))
  for(let i = 1; i < items.length; i++) {
    if(compareBytes(items[i - 1].key, items[i].key) === 0) {
      const key = new TextDecoder().decode(items[i].key)
      throw new Error(`Duplicate MST key “${key}”.`)
    }
  }

  const node = async (run: Array<Item>, layer: number): Promise<CID> => {
    const subtree = async (part: Array<Item>) => (
      part.length === 0 ? null : node(part, layer - 1)
    )
    const at = run.flatMap((item, i) => item.layer === layer ? [i] : [])
    const data: Node = { l: await subtree(run.slice(0, at[0] ?? run.length)), e: [] }
    let previous: Uint8Array = new Uint8Array()
    for(const [n, i] of at.entries()) {
      const { key, value } = run[i]
      const p = sharedPrefix(previous, key)
      data.e.push({
        p, k: key.slice(p), v: value, t: await subtree(run.slice(i + 1, at[n + 1])),
      })
      previous = key
    }
    return blocks.put(dagCBOR.encode(data))
  }

  return node(items, Math.max(0, ...items.map(({ layer }) => layer)))
}

/** The value under `key`, or `null` if the tree hasn’t got it. */
export async function get(
  root: CID,
  key: string,
  blocks: { get(cid: CID): Promise<Uint8Array> },
): Promise<CID | null> {
  const wanted = utf8.encode(key)
  const { l, e } = dagCBOR.decode<Node>(await blocks.get(root))
  let below = l
  let previous: Uint8Array = new Uint8Array()
  for(const { p, k, v, t } of e) {
    const full = new Uint8Array([...previous.slice(0, p), ...k])
    const order = compareBytes(wanted, full)
    if(order === 0) return v
    if(order < 0) break
    below = t
    previous = full
  }
  return below ? get(below, key, blocks) : null
}

/** Every key & value in the tree, in key order. */
export async function list(
  root: CID,
  blocks: { get(cid: CID): Promise<Uint8Array> },
): Promise<Array<[string, CID]>> {
  const { l, e } = dagCBOR.decode<Node>(await blocks.get(root))
  const found = l ? await list(l, blocks) : []
  let previous: Uint8Array = new Uint8Array()
  for(const { p, k, v, t } of e) {
    const key = new Uint8Array([...previous.slice(0, p), ...k])
    found.push([new TextDecoder().decode(key), v])
    if(t) found.push(...await list(t, blocks))
    previous = key
  }
  return found
}
