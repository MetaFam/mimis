import { hexToBytes, recoverTypedDataAddress, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { create as createKubo } from 'kubo-rpc-client'
import {
  CID,
  decode,
  encode,
  isAddress,
  type Address,
} from './codec.ts'

export const topic = '/granite/1/announce'
export const maxAnnouncementBytes = 1024

export type Announcement = {
  publisher: Address,
  root: CID,
  prev?: CID,
  at: number,
}

export type Announcer = {
  publish(bytes: Uint8Array): Promise<void>,
  subscribe(handler: (bytes: Uint8Array) => void): Promise<() => Promise<void>>,
}

const domain = {
  name: 'granite',
  version: '1',
} as const

const types = {
  Announcement: [
    { name: 'publisher', type: 'address' },
    { name: 'root', type: 'bytes' },
    { name: 'prev', type: 'bytes' },
    { name: 'at', type: 'uint64' },
  ],
} as const

const typedData = ({ publisher, root, prev, at }: Announcement) => ({
  domain,
  types,
  primaryType: 'Announcement' as const,
  message: {
    publisher,
    root: toHex(root.bytes),
    prev: prev ? toHex(prev.bytes) : ('0x' as `0x${string}`),
    at: BigInt(at),
  },
})

export const signAnnouncement = async (
  key: `0x${string}`, announcement: Announcement,
): Promise<Uint8Array> => {
  const account = privateKeyToAccount(key)
  const signature = await account.signTypedData(typedData(announcement))
  return hexToBytes(signature)
}

export const encodeAnnouncement = (
  announcement: Announcement, sig: Uint8Array,
): Uint8Array => (
  encode({
    granite: 1,
    publisher: announcement.publisher,
    root: announcement.root.bytes,
    ...(announcement.prev ? { prev: announcement.prev.bytes } : {}),
    at: announcement.at,
    sig,
  })
)

export type Verified =
  | { ok: true, announcement: Announcement }
  | { ok: false, reason: string }

// Gossip input is expected to be dirty: every failure is a drop with a
// reason, never a throw (contrast with FR-012 for content a reader chose
// to fetch).
export const decodeAndVerify = async (bytes: Uint8Array): Promise<Verified> => {
  if(bytes.length > maxAnnouncementBytes) {
    return { ok: false, reason: `oversize message (${bytes.length} bytes)` }
  }
  let value: unknown
  try {
    value = decode(bytes)
  } catch {
    return { ok: false, reason: 'payload is not dag-cbor' }
  }
  if(typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, reason: 'payload is not a map' }
  }
  const map = value as Record<string, unknown>
  const allowed = ['granite', 'publisher', 'root', 'prev', 'at', 'sig']
  for(const key of Object.keys(map)) {
    if(!allowed.includes(key)) {
      return { ok: false, reason: `unexpected key ${key}` }
    }
  }
  if(map.granite !== 1) {
    return { ok: false, reason: 'unsupported protocol version' }
  }
  if(!isAddress(map.publisher)) {
    return { ok: false, reason: 'publisher is not a lowercase 0x address' }
  }
  if(!(map.root instanceof Uint8Array)) {
    return { ok: false, reason: 'root is not bytes' }
  }
  if('prev' in map && !(map.prev instanceof Uint8Array)) {
    return { ok: false, reason: 'prev is not bytes' }
  }
  if(!Number.isInteger(map.at)) {
    return { ok: false, reason: 'at is not an integer' }
  }
  if(!(map.sig instanceof Uint8Array) || map.sig.length !== 65) {
    return { ok: false, reason: 'sig is not a 65-byte signature' }
  }
  let root: CID
  let prev: CID | undefined
  try {
    root = CID.decode(map.root)
    prev = 'prev' in map ? CID.decode(map.prev as Uint8Array) : undefined
  } catch {
    return { ok: false, reason: 'root/prev bytes do not decode to CIDs' }
  }
  const announcement: Announcement = {
    publisher: map.publisher,
    root,
    ...(prev ? { prev } : {}),
    at: map.at as number,
  }
  let recovered: string
  try {
    recovered = await recoverTypedDataAddress({
      ...typedData(announcement),
      signature: toHex(map.sig),
    })
  } catch {
    return { ok: false, reason: 'signature recovery failed' }
  }
  if(recovered.toLowerCase() !== announcement.publisher) {
    return { ok: false, reason: `signer ${recovered.toLowerCase()} ≠ publisher` }
  }
  return { ok: true, announcement }
}

export const kuboAnnouncer = (url: string): Announcer => {
  const kubo = createKubo({ url })
  return {
    publish: async (bytes) => {
      await kubo.pubsub.publish(topic, bytes)
    },
    subscribe: async (handler) => {
      const onMessage = (message: { data: Uint8Array }) => {
        handler(message.data)
      }
      await kubo.pubsub.subscribe(topic, onMessage)
      return async () => {
        await kubo.pubsub.unsubscribe(topic, onMessage)
      }
    },
  }
}
