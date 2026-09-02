import { create as ipfsFactory } from 'kubo-rpc-client'
import type { Version } from 'multiformats'
import settings from '$lib/settings.svelte'

export function getIPFS() {
  const url = settings.ipfsAPI.replace(/\/+$/, '')
  return ipfsFactory({ url })
}

export async function catBytes(cid: string) {
  const ipfs = getIPFS()
  const chunks: Array<Uint8Array> = []
  for await (const chunk of ipfs.cat(cid, { timeout: 60_000 })) {
    chunks.push(chunk)
  }
  const size = chunks.reduce((acc, { length }) => acc + length, 0)
  const bytes = new Uint8Array(size)
  let offset = 0
  for(const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

/** Content is left unpinned until an editor commit references it. */
export async function addBytes(bytes: Uint8Array) {
  const ipfs = getIPFS()
  const { cid, size } = await ipfs.add(bytes, {
    chunker: 'rabin',
    cidVersion: 1 as Version,
    pin: false,
    timeout: 60_000,
  })
  return { cid: cid.toString(), size }
}

export async function pin(cid: string) {
  const ipfs = getIPFS()
  await ipfs.pin.add(cid, { timeout: 60_000 })
}
