import gremlin from 'gremlin'
import { error } from '@sveltejs/kit'
import { CID } from 'multiformats/cid'
import { hexToBytes, type Hex } from 'viem'
import { build } from '#lib/mst.js'
import {
  authorOf, encodeContent, encodeSpot, encodeUpdate, typedDataFor,
  type Block, type TypedData, type Update,
} from '#lib/updates.js'
import { seal, unseal } from '#lib/server/auth.js'
import { putAll, type Blocks } from '#lib/server/blocks.js'
import { comparePaths } from '#lib/server/changes.js'
import type { Kind } from '#lib/server/edits.js'
import {
  edgeAt, edgeId, writeAll,
  type GraphTraversal, type GraphTraversalSource, type Id,
} from '#lib/server/janusgraph.js'
import { recordUpdate } from '#lib/server/received.js'
import { select, type Reason, type Selected } from '#lib/server/selection.js'

const { statics: __ } = gremlin.process
type Transaction = ReturnType<GraphTraversalSource['tx']>

const EXPIRY = 10 * 60_000
const LOST = 'Another publish finished first; publish again.'
const INVALID = 'That publish plan isn’t valid.'

interface Plan {
  address: string
  expires: number
  device: { id: Id, uuid: string }
  sequence: number
  previous?: string
  spots: string
  contents: string
  createdAt: string
  comment?: string
  /** Each versioned Spot & Content, & its newest version. */
  vertices: Array<[Id, string]>
  /** Each entry edge published: `[edge, out, in, kind, key, fingerprint]`. */
  edges: Array<[string, Id, Id, Kind, string, string]>
  /** Markers the publish uses up: `[marker, out, kind, key]`. */
  consumed: Array<[string, Id, Kind, string]>
  /** Spots to unstage. */
  clean: Array<Id>
}

export type Prepared =
  | { nothing: true, clean: Array<Id> }
  | {
    nothing: false
    typedData: Omit<TypedData, 'message'> & {
      message: Omit<TypedData['message'], 'sequence'> & { sequence: string }
    }
    plan: string
    included: Array<{ path: Array<string>, reason: Reason }>
    counts: { spots: number, contents: number }
  }

const tombstones = (selected: Selected, kind: Kind) => (
  [...new Set(
    selected.markers.filter((marker) => marker.kind === kind).map(({ key }) => key)
  )]
  .map((tombstone) => ({ tombstone }))
)

/** Children before the Spots containing them, as their versions link them. */
function childrenFirst(spots: Array<Selected>) {
  const byId = new Map(spots.map((spot) => [spot.id, spot]))
  const state = new Map<Id, 'visiting' | 'done'>()
  const ordered: Array<Selected> = []
  const visit = (spot: Selected) => {
    if(state.get(spot.id) === 'done') return
    if(state.get(spot.id) === 'visiting') {
      throw error(400, `CONTAINS cycle at Spot #${spot.id}.`)
    }
    state.set(spot.id, 'visiting')
    for(const { kind, to } of spot.entries) {
      const child = kind === 'CONTAINS' ? byId.get(to) : undefined
      if(child) visit(child)
    }
    state.set(spot.id, 'done')
    ordered.push(spot)
  }
  spots.forEach(visit)
  return ordered
}

/**
 * Encodes & stores, unpinned, everything the staged Spots publish, &
 * the typed data for the wallet to sign. Nothing in the graph changes.
 */
export async function prepare(
  { source, blocks, address, comment, now }:
  {
    source: GraphTraversalSource
    blocks: Blocks
    address: string
    comment?: string
    now: string
  },
): Promise<Prepared> {
  const selection = await select({ source, address })
  const versioned = (selected: Selected) => (
    selected.cid == null
    || selected.entries.length > 0
    || selected.markers.length > 0
  )
  const spots = [...selection.spots.values()].filter(versioned)
  const contents = [...selection.contents.values()].filter(versioned)
  if(spots.length === 0 && contents.length === 0) {
    return { nothing: true, clean: selection.clean }
  }

  const last = new Map<Id, CID>()
  const stored: Array<Block> = []
  const keep = (id: Id, links: Array<Block>) => {
    stored.push(...links)
    last.set(id, links.at(-1)!.cid)
  }
  const previous = ({ cid }: Selected) => (
    cid ? { previous: CID.parse(cid) } : {}
  )

  for(const content of contents) {
    keep(content.id, await encodeContent(
      {
        uuid: content.uuid,
        ...previous(content),
        blobs: [
          ...content.entries.flatMap(({ fields }) => (
            fields.kind === 'IS' ? [{
              uuid: fields.uuid,
              cid: CID.parse(fields.cid),
              size: fields.size,
              type: content.type!,
              ...(fields.previous ? { previous: fields.previous } : {}),
            }] : []
          )),
          ...tombstones(content, 'IS'),
        ],
        mounts: [
          ...content.entries.flatMap(({ fields }) => (
            fields.kind === 'MOUNT' ? [{
              target: fields.target,
              ...(fields.creator ? { creator: fields.creator } : {}),
            }] : []
          )),
          ...tombstones(content, 'MOUNT'),
        ],
      },
      `#${content.id}`,
    ))
  }

  for(const spot of childrenFirst(spots)) {
    const fieldsOf = (kind: Kind) => (
      spot.entries.filter((entry) => entry.kind === kind)
    )
    keep(spot.id, await encodeSpot(
      {
        uuid: spot.uuid,
        ...previous(spot),
        ...(spot.root ? { root: true } : {}),
        contains: [
          ...fieldsOf('CONTAINS').map(({ key, fields, to, toCid }) => ({
            uuid: key,
            path: (fields as { path: string }).path,
            target: last.get(to) ?? (toCid ? CID.parse(toCid) : undefined)!,
          })),
          ...tombstones(spot, 'CONTAINS'),
        ],
        mounts: [
          ...fieldsOf('MOUNT').map(({ fields }) => {
            const { target, creator, order } = fields as Extract<typeof fields, { kind: 'MOUNT' }>
            return { target, ...(creator ? { creator } : {}), order: order! }
          }),
          ...tombstones(spot, 'MOUNT'),
        ],
        contents: [
          ...fieldsOf('AS').map(({ fields }) => {
            const { content, type, after } = fields as Extract<typeof fields, { kind: 'AS' }>
            return { uuid: content, type, ...(after ? { after } : {}) }
          }),
          ...tombstones(spot, 'AS'),
        ],
      },
      `#${spot.id}`,
    ))
  }

  await putAll(blocks, stored)
  const indexOf = (selected: Array<Selected>) => build(
    selected.map(({ id, uuid }) => [uuid, last.get(id)!]), blocks,
  )
  const spotsRoot = await indexOf(spots.filter(({ cid, root }) => cid != null || root))
  const contentsRoot = await indexOf(contents)

  const { value: found } = await (
    source.V().has('User', 'address', address)
    .out('USES').hasLabel('Device')
    .order().by(__.coalesce(__.values('createdAt'), __.constant('')))
    .limit(1)
    .project('id', 'uuid', 'sequence', 'head')
    .by(__.id())
    .by('uuid')
    .by(__.coalesce(__.values('sequence'), __.constant(0)))
    .by(__.values('head').fold())
    .next()
  )
  if(!found) throw new Error(`${address} has no Device.`)
  const device = found as Map<string, unknown>
  const sequence = (device.get('sequence') as number) + 1
  const [head] = device.get('head') as Array<string>
  const uuid = device.get('uuid') as string

  const typedData = typedDataFor({
    device: uuid,
    sequence,
    spots: spotsRoot,
    contents: contentsRoot,
    ...(head ? { previous: CID.parse(head) } : {}),
  })
  const everything = [...selection.spots.values(), ...selection.contents.values()]
  const plan: Plan = {
    address,
    expires: Date.parse(now) + EXPIRY,
    device: { id: device.get('id') as Id, uuid },
    sequence,
    previous: head,
    spots: spotsRoot.toString(),
    contents: contentsRoot.toString(),
    createdAt: now,
    comment,
    vertices: [...spots, ...contents].map(({ id }) => [id, last.get(id)!.toString()]),
    edges: everything.flatMap(({ id, entries, settled }) => (
      [...entries, ...settled].map(({ edge, to, kind, key, fingerprint }) => (
        [edge, id, to, kind, key, fingerprint] as Plan['edges'][number]
      ))
    )),
    consumed: everything.flatMap(({ id, markers, consumed }) => (
      [...markers, ...consumed].map(({ id: marker, kind, key }) => (
        [marker, id, kind, key] as Plan['consumed'][number]
      ))
    )),
    clean: [
      ...[...selection.spots.values()]
      .filter(({ reason }) => reason === 'staged')
      .map(({ id }) => id),
      ...selection.clean,
    ],
  }

  return {
    nothing: false,
    typedData: {
      ...typedData,
      message: { ...typedData.message, sequence: String(sequence) },
    },
    plan: await seal(JSON.stringify(plan)),
    included: (
      [...selection.spots.values()]
      .filter(({ reason }) => reason !== 'staged')
      .map(({ id, reason }) => ({ path: selection.pathOf(id), reason }))
      .sort((a, b) => comparePaths(a.path, b.path))
    ),
    counts: { spots: spots.length, contents: contents.length },
  }
}

/** Marks a plan’s changes published, as of the versions it encoded. */
async function apply(
  { source, plan, now }:
  { source: GraphTraversalSource, plan: Plan, now: string },
) {
  const existing = new Set<string>()
  const ids = plan.edges.map(([edge]) => edge)
  for(let start = 0; start < ids.length; start += 500) {
    for(const id of await source.E(...ids.slice(start, start + 500)).id().toList()) {
      existing.add(edgeId(id))
    }
  }

  const marks: Array<GraphTraversal> = plan.vertices.map(([id, cid]) => (
    __.V(id).property('cid', cid)
  ))
  const gone = new Set<string>()
  const removals: Array<GraphTraversal> = []
  for(const [edge, out, to, kind, key, fingerprint] of plan.edges) {
    if(existing.has(edge)) {
      marks.push(edgeAt(edge).property('published', fingerprint))
    } else {
      // Removed while the publish ran: readers now hold `fingerprint`
      // under `key`, so the removal still has to be published.
      gone.add(JSON.stringify([out, kind, key]))
      removals.push(
        __.V(out)
        .coalesce(
          __.outE('REMOVED').has('kind', kind).has('entry', key),
          (
            __.addE('REMOVED')
            .to(__.V(to))
            .property('kind', kind)
            .property('entry', key)
            .property('createdAt', now)
          ),
        )
        .property('published', fingerprint)
      )
    }
  }
  const drops = [
    ...plan.consumed
    .filter(([, out, kind, key]) => !gone.has(JSON.stringify([out, kind, key])))
    .map(([marker]) => edgeAt(marker).drop()),
    ...plan.clean.map((id) => __.V(id).properties('staged').drop()),
  ]
  await writeAll(source, marks)
  await writeAll(source, removals)
  await writeAll(source, drops)
}

/**
 * Stores & pins the signed Update, then applies its plan, guarded by
 * the Device’s sequence. Every graph change is in `source`, so it
 * commits or rolls back with the caller’s transaction.
 */
export async function commit(
  { source, blocks, address, plan: token, signature, now }:
  {
    source: GraphTraversalSource
    blocks: Blocks
    address: string
    plan: string
    signature: string
    now: string
  },
) {
  const payload = await unseal(token)
  if(payload == null) throw error(400, INVALID)
  const plan = JSON.parse(payload) as Plan
  if(plan.address !== address) throw error(400, INVALID)
  if(Date.parse(now) > plan.expires) {
    throw error(410, 'That publish expired; publish again.')
  }

  const update: Update = {
    device: plan.device.uuid,
    sequence: plan.sequence,
    spots: CID.parse(plan.spots),
    contents: CID.parse(plan.contents),
    ...(plan.previous ? { previous: CID.parse(plan.previous) } : {}),
    signature: hexToBytes(signature as Hex),
    createdAt: plan.createdAt,
    ...(plan.comment ? { comment: plan.comment } : {}),
  }
  let author: string
  try {
    author = await authorOf(update)
  } catch {
    throw error(400, 'That signature can’t be recovered.')
  }
  if(author !== address) {
    throw error(403, `The signature is from ${author}, not ${address}.`)
  }

  const { bytes, cid } = await encodeUpdate(update)
  try {
    await blocks.put(bytes)
    await blocks.pin(cid, update.previous)
  } catch(err) {
    throw error(502, `Storing the Update failed: ${(err as Error).message}`)
  }

  try {
    const { value: guarded } = await (
      source.V(plan.device.id)
      .where(
        __.coalesce(__.values('sequence'), __.constant(0))
        .is(plan.sequence - 1)
      )
      .property('sequence', plan.sequence)
      .property('head', cid.toString())
      .id()
      .next()
    )
    if(guarded == null) throw error(409, LOST)
    await apply({ source, plan, now })
    await recordUpdate({ source, blocks, cid: cid.toString(), now })
  } catch(err) {
    await blocks.unpin(cid)
    throw err
  }
  return { cid: cid.toString(), sequence: plan.sequence, previous: update.previous }
}

// How BerkeleyDB JE & JanusGraph’s locks fail the loser when two
// publishes advance one Device: a deadlock while they both run, or a
// failed lock check when the second commits.
const LOST_RACE = /Could not commit transaction|Deadlock was detected|Expected value mismatch/

/**
 * `commit` in `tx`, committed or rolled back. Once the new Update has
 * landed, its predecessor’s pin is dropped, since the new one covers
 * the whole history.
 */
export async function commitInTransaction(
  { tx, blocks, ...args }:
  { tx: Transaction, blocks: Blocks } & Omit<Parameters<typeof commit>[0], 'source' | 'blocks'>,
) {
  let result: Awaited<ReturnType<typeof commit>> | undefined
  try {
    result = await commit({ source: tx.begin(), blocks, ...args })
    await tx.commit()
  } catch(err) {
    if(result) await blocks.unpin(CID.parse(result.cid))
    // A failed transaction may already be closed, so this only makes sure.
    await tx.rollback().catch(() => {})
    if(LOST_RACE.test(String((err as Error)?.message))) throw error(409, LOST)
    throw err
  }
  if(result.previous) {
    await blocks.unpin(result.previous).catch((err) => {
      console.warn({ 'Unpinning a superseded Update failed': err })
    })
  }
  return { cid: result.cid, sequence: result.sequence }
}
