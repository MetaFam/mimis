import * as dagCBOR from '@ipld/dag-cbor'
import * as v from 'valibot'
import { error } from '@sveltejs/kit'
import { CID } from 'multiformats/cid'
import { create as createDigest } from 'multiformats/hashes/digest'
import { sha256 } from 'multiformats/hashes/sha2'
import { bytesToHex, hashTypedData, recoverTypedDataAddress } from 'viem'
import { compareBytes } from '#lib/mst.js'

// Kubo 0.43 accepts 2 MiB blocks, but older peers & gateways still
// refuse anything over 1 MiB, so a block larger than this can’t be
// fetched everywhere.
export const MAX_BLOCK = 1_048_576

export interface Link { uuid: string, path: string, target: CID }
export interface Mounting { target: string, creator?: string, order: number }
/** A mount of the link `uuid`, listed as `path`. */
export interface Linking { uuid: string, path: string, target: string, creator?: string }
/** `after`: the Content it’s ranked after; absent for the first. */
export interface Holding { uuid: string, type: string, after?: string }
/** `previous`: the representation it replaced, by its uuid. */
export interface Representation {
  uuid: string, cid: CID, size: number, type: string, previous?: string
}
/** A proxy’s Content, & its owner when outside the publisher’s tree. */
export interface Proxying { target: string, creator?: string }
export interface Tombstone { tombstone: string }

export interface SpotVersion {
  uuid: string
  previous?: CID
  root?: true
  contains?: Array<Link | Tombstone>
  mounts?: Array<Mounting | Linking | Tombstone>
  contents?: Array<Holding | Tombstone>
}

export interface ContentVersion {
  uuid: string
  previous?: CID
  blobs?: Array<Representation | Tombstone>
  mounts?: Array<Proxying | Tombstone>
}

export interface Signed {
  device: string
  sequence: number
  spots: CID
  contents: CID
  previous?: CID
}

export interface Update extends Signed {
  signature: Uint8Array
  createdAt: string
  comment?: string
}

export interface Block { bytes: Uint8Array, cid: CID }

export const cidFor = async (bytes: Uint8Array) => (
  CID.create(1, dagCBOR.code, await sha256.digest(bytes))
)

const utf8 = new TextEncoder()
const defined = <T extends object>(value: T) => (
  Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined)
  ) as T
)
const keyOf = (entry: Record<string, unknown>) => (
  (entry.tombstone ?? entry.uuid ?? entry.target) as string
)

const sortByKey = (field: string, entries: Array<object> = []) => {
  const keyed = entries.map((entry) => ({
    entry: entry as Record<string, unknown>,
    key: utf8.encode(keyOf(entry as Record<string, unknown>)),
  }))
  keyed.sort((a, b) => compareBytes(a.key, b.key))
  for(let i = 1; i < keyed.length; i++) {
    if(compareBytes(keyed[i - 1].key, keyed[i].key) === 0) {
      throw new Error(
        `Two ${field} entries have the key “${keyOf(keyed[i].entry)}”.`
      )
    }
  }
  return keyed.map(({ entry }) => entry)
}

const ANY_CID = CID.create(
  1, dagCBOR.code, createDigest(sha256.code, new Uint8Array(32)),
)

/** A version, split into a chain of blocks if it won’t fit in one. */
async function chain(
  { version, fields, label }:
  {
    version: { uuid: string, previous?: CID, root?: true }
    fields: Array<string>
    label: string
  },
) {
  const { uuid, previous, root } = version
  const arrays = fields.map((field) => [
    field,
    sortByKey(field, (version as unknown as Record<string, Array<object>>)[field]),
  ] as const)
  const budget = (
    MAX_BLOCK
    - dagCBOR.encode({
      uuid,
      previous: ANY_CID,
      root: true,
      ...Object.fromEntries(fields.map((field) => [field, []])),
    }).length
    // An array’s header grows from one byte to at most five.
    - 4 * fields.length
  )

  const links: Array<Block> = []
  let part: Record<string, Array<object>> = {}
  let used = 0
  const flush = async () => {
    const before = links.at(-1)?.cid ?? previous
    const bytes = dagCBOR.encode({
      uuid,
      ...(before ? { previous: before } : {}),
      ...(links.length === 0 && root ? { root } : {}),
      ...part,
    })
    if(bytes.length > MAX_BLOCK) {
      throw new Error(`A version of ${label} encoded to ${bytes.length} bytes.`)
    }
    links.push({ bytes, cid: await cidFor(bytes) })
    part = {}
    used = 0
  }
  for(const [field, entries] of arrays) {
    for(const entry of entries) {
      const size = dagCBOR.encode(entry).length
      if(size > budget) {
        throw error(400, `An entry of ${label} is too large to publish.`)
      }
      if(used + size > budget) await flush()
      ;(part[field] ??= []).push(entry)
      used += size
    }
  }
  await flush()
  return links
}

export const encodeSpot = (version: SpotVersion, label = version.uuid) => (
  chain({
    version, fields: ['contains', 'mounts', 'contents'], label: `Spot ${label}`,
  })
)

export const encodeContent = (
  version: ContentVersion, label = version.uuid,
) => (
  chain({ version, fields: ['blobs', 'mounts'], label: `Content ${label}` })
)

export async function encodeUpdate(update: Update): Promise<Block> {
  const bytes = dagCBOR.encode(defined(update))
  return { bytes, cid: await cidFor(bytes) }
}

const types = {
  Update: [
    { name: 'device', type: 'string' },
    { name: 'sequence', type: 'uint64' },
    { name: 'spots', type: 'string' },
    { name: 'contents', type: 'string' },
    { name: 'previous', type: 'string' },
  ],
} as const

/**
 * What the wallet signs. The domain has no `chainId`: an Update isn’t
 * bound to a chain, & wallets refuse typed data for a chain other than
 * the one they’re on.
 */
export const typedDataFor = (
  { device, sequence, spots, contents, previous }: Signed,
) => ({
  domain: { name: 'Mïmis Graph', version: '1' },
  primaryType: 'Update' as const,
  types,
  message: {
    device,
    sequence: BigInt(sequence),
    spots: spots.toString(),
    contents: contents.toString(),
    previous: previous?.toString() ?? '',
  },
})

export type TypedData = ReturnType<typeof typedDataFor>

export const authorOf = async (update: Update) => (
  (await recoverTypedDataAddress({
    ...typedDataFor(update),
    signature: bytesToHex(update.signature),
  }))
  .toLowerCase()
)

export const digestOf = (signed: Signed) => hashTypedData(typedDataFor(signed))

export class MalformedUpdate extends Error {
  reason: string
  constructor(reason: string) {
    super(`Malformed Update: ${reason}.`)
    this.reason = reason
  }
}

const isCID = (value: unknown) => CID.asCID(value) != null
const positive = 'isn’t a positive integer'
const UpdateSchema = v.object(
  {
    device: v.string('isn’t a string'),
    sequence: v.pipe(
      v.number(positive), v.safeInteger(positive), v.minValue(1, positive),
    ),
    spots: v.custom<CID>(isCID, 'isn’t a CID'),
    contents: v.custom<CID>(isCID, 'isn’t a CID'),
    previous: v.optional(v.custom<CID>(isCID, 'isn’t a CID')),
    signature: v.pipe(
      v.instance(Uint8Array, 'isn’t bytes'), v.length(65, 'isn’t 65 bytes'),
    ),
    createdAt: v.string('isn’t a string'),
    comment: v.optional(v.string('isn’t a string')),
  },
  'isn’t a map',
)

/** `value` as an Update, if it is a well-formed one. */
export async function validateUpdate(value: unknown): Promise<Update> {
  const result = v.safeParse(UpdateSchema, value)
  if(!result.success) {
    const [issue] = result.issues
    const path = v.getDotPath(issue)
    throw new MalformedUpdate(
      path == null ? `the Update ${issue.message}`
      : issue.input === undefined ? `${path} is missing`
      : `${path} ${issue.message}`
    )
  }
  const update = result.output as Update
  if(update.sequence === 1 && update.previous) {
    throw new MalformedUpdate('previous is present with sequence 1')
  }
  if(update.sequence > 1 && !update.previous) {
    throw new MalformedUpdate(
      `previous is missing with sequence ${update.sequence}`
    )
  }
  try {
    await authorOf(update)
  } catch {
    throw new MalformedUpdate('signature can’t be recovered')
  }
  return update
}
