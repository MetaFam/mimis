import gremlin from 'gremlin'
import { error } from '@sveltejs/kit'
import { compareBytes } from '#lib/mst.js'
import type { Kind } from '#lib/server/edits.js'
import {
  edgeId, ownersOf, type GraphTraversalSource, type Id,
} from '#lib/server/janusgraph.js'

const { statics: __ } = gremlin.process

/**
 * A Spot’s layer mounts have an `order`; a proxy Content’s one doesn’t.
 * A link `MOUNT` names the link it mounts by `uuid`, & lists as `path`.
 */
export type Fields =
  | { kind: 'CONTAINS', path: string, child: string }
  | { kind: 'MOUNT', target: string, creator?: string, order?: number }
  | { kind: 'MOUNT', target: string, creator?: string, uuid: string, path: string }
  | { kind: 'AS', content: string, type: string, after?: string }
  | { kind: 'IS', uuid: string, cid: string, size: number, previous?: string }

/**
 * An entry as published, to compare with its edge later. A link’s
 * leaves out the child’s version: republishing the child doesn’t
 * change the link. A first version’s leaves out `previous`, so
 * representations published before versions existed stay published.
 */
export const fingerprint = (fields: Fields) => JSON.stringify(
  fields.kind === 'CONTAINS' ? [fields.path, fields.child]
  : fields.kind === 'MOUNT' ? [
    fields.target,
    fields.creator ?? null,
    ...('path' in fields ? [fields.path]
    : fields.order == null ? [] : [fields.order]),
  ]
  : fields.kind === 'AS' ? [fields.content, fields.after ?? null, fields.type]
  : [
    fields.uuid,
    fields.cid,
    fields.size,
    ...(fields.previous == null ? [] : [fields.previous]),
  ]
)

export interface Entry {
  edge: string
  kind: Kind
  key: string
  /** The edge’s in-vertex. */
  to: Id
  /** For a link, the child’s latest version, if it has one. */
  toCid?: string
  /** For a link `MOUNT`, its lower link’s `path` when it was made. */
  base?: string
  fields: Fields
  fingerprint: string
  /** The edge’s own mark. */
  published?: string
  /** What readers hold under `key`: the edge’s mark, or a marker’s. */
  baseline?: string
  pending: boolean
}

export interface Marker {
  id: string
  kind: Kind
  key: string
  published: string
  to: Id
  /** Not cancelled out or replaced by an edge with its key. */
  pending: boolean
}

interface Holder {
  id: Id
  uuid: string
  cid?: string
  entries: Array<Entry>
  markers: Array<Marker>
}
export interface SpotState extends Holder {
  staged: boolean
  /** The Contents it holds through `AS`. */
  contents: Array<Id>
}
export interface ContentState extends Holder { type: string }

export interface PendingSpot {
  id: Id
  uuid: string
  path: Array<string>
  isNew: boolean
  staged: boolean
  added: number
  removed: number
}

export const isPending = (holder: Holder) => (
  holder.cid == null
  || holder.entries.some(({ pending }) => pending)
  || holder.markers.some(({ pending }) => pending)
)

/**
 * Whether a Spot is only files: it holds Content, but no Spots or
 * mounts. Both listings (`listing`, `fsEntries`) show any other Spot
 * as a folder.
 */
export const isFile = (spot: SpotState) => (
  spot.contents.length > 0
  && !spot.entries.some(({ kind }) => kind === 'CONTAINS' || kind === 'MOUNT')
)

/**
 * A pending link to a folder that has never been published. It goes
 * out only in the same Update as that folder, which gives it a version
 * to point at, so it’s the folder’s change rather than its parent’s.
 * A new file comes along with its parent instead (FR-030).
 */
export const awaitsChild = (entry: Entry, spots: Map<Id, SpotState>) => {
  if(!entry.pending || entry.kind !== 'CONTAINS' || entry.toCid != null) {
    return false
  }
  const child = spots.get(entry.to)
  return !(child && isFile(child))
}

export const spotIsPending = (
  spot: SpotState,
  { spots, contents }: {
    spots: Map<Id, SpotState>
    contents: Map<Id, ContentState>
  },
) => (
  spot.cid == null
  || spot.entries.some((entry) => entry.pending && !awaitsChild(entry, spots))
  || spot.markers.some(({ pending }) => pending)
  || spot.contents.some((id) => isPending(contents.get(id)!))
)

export async function rootOf(
  { source, address }: { source: GraphTraversalSource, address: string },
) {
  const { value } = await (
    source.V().has('User', 'address', address)
    .out('WRITES').hasLabel('Spot').id()
    .next()
  )
  if(value == null) throw new Error(`No root Spot for ${address}.`)
  return value as Id
}

// Ids per request: enough to keep the traversal count low, & few
// enough to stay well under the server’s 64 KiB request limit.
const BATCH = 500
const batches = <T>(items: Array<T>) => (
  Array.from(
    { length: Math.ceil(items.length / BATCH) },
    (_, n) => items.slice(n * BATCH, (n + 1) * BATCH),
  )
)
type Row = Map<string, unknown>
const first = <T>(row: Row, key: string) => (row.get(key) as Array<T>)[0]
const optional = (key: string) => __.values(key).fold()

const vertexRows = (source: GraphTraversalSource, ids: Array<Id>) => (
  source.V(...ids)
  .project('id', 'uuid', 'type', 'cid', 'staged')
  .by(__.id())
  .by(optional('uuid'))
  .by(optional('type'))
  .by(optional('cid'))
  .by(optional('staged'))
  .toList()
) as Promise<Array<Row>>

const edgeRows = (
  source: GraphTraversalSource, ids: Array<Id>, labels: Array<string>,
) => (
  source.V(...ids)
  .outE(...labels)
  .project(
    'edge', 'from', 'label', 'uuid', 'path', 'base', 'order', 'after',
    'published', 'kind', 'entry', 'to', 'toUuid', 'toType', 'toCid', 'toSize',
    'previous',
  )
  .by(__.id())
  .by(__.outV().id())
  .by(__.label())
  .by(optional('uuid'))
  .by(optional('path'))
  .by(optional('base'))
  .by(optional('order'))
  .by(optional('after'))
  .by(optional('published'))
  .by(optional('kind'))
  .by(optional('entry'))
  .by(__.inV().id())
  .by(__.inV().values('uuid').fold())
  .by(__.inV().values('type').fold())
  .by(__.inV().values('cid').fold())
  .by(__.inV().values('size').fold())
  .by(__.inV().out('PREVIOUS').inE('IS').values('uuid').fold())
  .toList()
) as Promise<Array<Row>>

const numeric = (kind: Kind, edge: string, order: unknown) => {
  if(typeof order !== 'number' || !Number.isFinite(order)) {
    throw new Error(`${kind} ${edge} has no numeric order.`)
  }
  return order
}

const required = <T>(value: T | undefined, what: string) => {
  if(value == null) throw new Error(`${what}.`)
  return value
}

/**
 * Each Spot’s entries & markers, & those of the Contents it holds,
 * with whether each is pending. A mount’s `creator` is its target’s
 * owner when that isn’t `address`.
 */
export async function entriesOf(
  { source, ids, address }:
  { source: GraphTraversalSource, ids: Array<Id>, address: string },
) {
  const spots = new Map<Id, SpotState>()
  const contents = new Map<Id, ContentState>()
  const owners = new Map<Id, Promise<Array<string>>>()
  const creatorOf = async (target: Id) => {
    if(!owners.has(target)) {
      owners.set(target, ownersOf({ source, spot: target }))
    }
    const found = await owners.get(target)!
    if(found.includes(address)) return undefined
    if(found.length !== 1) {
      throw error(500, `Can’t tell who owns mount target Spot #${target}.`)
    }
    return found[0]
  }

  const entryOf = async (row: Row, ofSpot: boolean): Promise<Entry> => {
    const edge = edgeId(row.get('edge'))
    const kind = row.get('label') as Kind
    const to = row.get('to') as Id
    const toUuid = first<string>(row, 'toUuid')
    const target = () => required(toUuid, `The target of ${kind} ${edge} has no uuid`)
    let fields: Fields
    let key: string
    if(kind === 'CONTAINS') {
      key = required(first<string>(row, 'uuid'), `CONTAINS ${edge} has no uuid`)
      fields = {
        kind,
        path: required(first<string>(row, 'path'), `CONTAINS ${edge} has no path`),
        child: target(),
      }
    } else if(kind === 'MOUNT') {
      const creator = await creatorOf(to)
      const path = first<string>(row, 'path')
      if(path != null) {
        if(first(row, 'order') != null) {
          throw new Error(`MOUNT ${edge} is both a link & a layer.`)
        }
        key = required(first<string>(row, 'uuid'), `MOUNT ${edge} has no uuid`)
        fields = {
          kind, target: target(), ...(creator ? { creator } : {}), uuid: key, path,
        }
      } else {
        key = target()
        fields = {
          kind,
          target: key,
          ...(creator ? { creator } : {}),
          ...(ofSpot ? { order: numeric(kind, edge, first(row, 'order')) } : {}),
        }
      }
    } else if(kind === 'AS') {
      key = target()
      const after = first<string>(row, 'after')
      fields = {
        kind,
        content: key,
        type: required(first<string>(row, 'toType'), `Content #${to} has no type`),
        ...(after == null ? {} : { after }),
      }
    } else {
      key = required(first<string>(row, 'uuid'), `IS ${edge} has no uuid`)
      const previous = row.get('previous') as Array<string>
      if(previous.length > 1) {
        throw new Error(`Blob #${to} replaced ${previous.length} Blobs.`)
      }
      fields = {
        kind,
        uuid: key,
        cid: required(first<string>(row, 'toCid'), `Blob #${to} has no cid`),
        size: required(first<number>(row, 'toSize'), `Blob #${to} has no size`),
        ...(previous.length === 0 ? {} : { previous: previous[0] }),
      }
    }
    return {
      edge,
      kind,
      key,
      to,
      ...(kind === 'CONTAINS' && first(row, 'toCid') ? { toCid: first<string>(row, 'toCid') } : {}),
      ...(kind === 'MOUNT' && first(row, 'base') != null ? { base: first<string>(row, 'base') } : {}),
      fields,
      fingerprint: fingerprint(fields),
      published: first<string>(row, 'published'),
      baseline: first<string>(row, 'published'),
      pending: true,
    }
  }

  const markerOf = (row: Row): Marker => ({
    id: edgeId(row.get('edge')),
    kind: first<Kind>(row, 'kind'),
    key: first<string>(row, 'entry'),
    published: first<string>(row, 'published'),
    to: row.get('to') as Id,
    pending: true,
  })

  const collect = async (
    { ids: some, labels, add, ofSpot }:
    {
      ids: Array<Id>
      labels: Array<string>
      add: (row: Row) => Holder
      ofSpot: boolean
    },
  ) => {
    for(const batch of batches(some)) {
      const held = new Map<Id, Holder>()
      for(const row of await vertexRows(source, batch)) {
        held.set(row.get('id') as Id, add(row))
      }
      for(const row of await edgeRows(source, batch, [...labels, 'REMOVED'])) {
        const holder = held.get(row.get('from') as Id)!
        if(row.get('label') === 'REMOVED') {
          holder.markers.push(markerOf(row))
        } else {
          holder.entries.push(await entryOf(row, ofSpot))
        }
      }
    }
  }

  await collect({
    ids,
    ofSpot: true,
    labels: ['CONTAINS', 'MOUNT', 'AS'],
    add: (row) => {
      const id = row.get('id') as Id
      const spot: SpotState = {
        id,
        uuid: required(first<string>(row, 'uuid'), `Spot #${id} has no uuid`),
        cid: first<string>(row, 'cid'),
        staged: first(row, 'staged') === true,
        entries: [],
        markers: [],
        contents: [],
      }
      spots.set(id, spot)
      return spot
    },
  })

  for(const spot of spots.values()) {
    const mounted = new Set<Id>()
    const linked = new Set<string>()
    for(const { kind, to, key, fields } of spot.entries) {
      if(kind === 'AS') {
        spot.contents.push(to)
      } else if('path' in fields && kind === 'MOUNT') {
        if(linked.has(key)) throw error(409, 'This Spot already mounts that link.')
        linked.add(key)
      } else if(kind === 'MOUNT') {
        if(mounted.has(to)) {
          throw error(400, `Spot #${spot.id} mounts Spot #${to} twice.`)
        }
        mounted.add(to)
      }
    }
  }

  await collect({
    ids: [...new Set([...spots.values()].flatMap(({ contents }) => contents))],
    ofSpot: false,
    labels: ['IS', 'MOUNT'],
    add: (row) => {
      const id = row.get('id') as Id
      const content: ContentState = {
        id,
        uuid: required(first<string>(row, 'uuid'), `Content #${id} has no uuid`),
        type: required(first<string>(row, 'type'), `Content #${id} has no type`),
        cid: first<string>(row, 'cid'),
        entries: [],
        markers: [],
      }
      contents.set(id, content)
      return content
    },
  })

  for(const content of contents.values()) {
    const proxied = content.entries.filter(({ kind }) => kind === 'MOUNT').length
    if(proxied > 1 || (proxied === 1 && content.entries.length > 1)) {
      throw new Error(`Content #${content.id} is neither one file nor one proxy.`)
    }
  }

  for(const holder of [...spots.values(), ...contents.values()]) {
    for(const marker of holder.markers) {
      const live = holder.entries.find(({ kind, key }) => (
        kind === marker.kind && key === marker.key
      ))
      marker.pending = live == null
      if(live && live.baseline == null) live.baseline = marker.published
    }
    for(const entry of holder.entries) {
      entry.pending = entry.baseline !== entry.fingerprint
    }
  }

  return { spots, contents }
}

const utf8 = new TextEncoder()
export const comparePaths = (a: Array<string>, b: Array<string>) => {
  for(let i = 0; i < Math.min(a.length, b.length); i++) {
    const order = compareBytes(utf8.encode(a[i]), utf8.encode(b[i]))
    if(order !== 0) return order
  }
  return a.length - b.length
}

/** Every Spot in `address`’s tree by `CONTAINS`, & its entries. */
export async function treeOf(
  { source, address }: { source: GraphTraversalSource, address: string },
) {
  const root = await rootOf({ source, address })
  const ids = await (
    source.V(root)
    .emit()
    .repeat(__.out('CONTAINS').dedup())
    .dedup()
    .id()
    .toList()
  ) as Array<Id>
  const { spots, contents } = await entriesOf({ source, ids, address })

  // Each Spot’s path follows its lowest-uuid incoming link, which,
  // with v7 uuids, is its oldest.
  const parents = new Map<Id, Entry & { from: Id }>()
  for(const spot of spots.values()) {
    for(const entry of spot.entries) {
      if(entry.kind !== 'CONTAINS') continue
      const known = parents.get(entry.to)
      if(!known || entry.key < known.key) {
        parents.set(entry.to, { ...entry, from: spot.id })
      }
    }
  }
  const paths = new Map<Id, Array<string>>([[root, []]])
  const pathOf = (id: Id, seen = new Set<Id>()): Array<string> => {
    const known = paths.get(id)
    if(known) return known
    if(seen.has(id)) throw error(400, `CONTAINS cycle at Spot #${id}.`)
    seen.add(id)
    const { from, fields } = parents.get(id)!
    const path = [
      ...pathOf(from, seen), (fields as { path: string }).path,
    ]
    paths.set(id, path)
    return path
  }

  return { root, spots, contents, pathOf, parents }
}

/** The pending Spots in `address`’s tree, sorted by path. */
export async function pendingSpots(
  { source, address }: { source: GraphTraversalSource, address: string },
) {
  const { spots, contents, pathOf } = await treeOf({ source, address })
  return (
    [...spots.values()]
    .filter((spot) => spotIsPending(spot, { spots, contents }))
    .map((spot): PendingSpot => {
      const holders = [spot, ...spot.contents.map((id) => contents.get(id)!)]
      return {
        id: spot.id,
        uuid: spot.uuid,
        path: pathOf(spot.id),
        isNew: spot.cid == null,
        staged: spot.staged,
        added: holders.flatMap(({ entries }) => entries).filter((entry) => (
          entry.pending && !awaitsChild(entry, spots)
        )).length,
        removed: holders.flatMap(({ markers }) => markers).filter(({ pending }) => (
          pending
        )).length,
      }
    })
    .sort((a, b) => comparePaths(a.path, b.path))
  )
}
