import {
  isPending, spotIsPending, treeOf,
  type ContentState, type Entry, type Marker, type SpotState,
} from '#lib/server/changes.js'
import type { GraphTraversalSource, Id } from '#lib/server/janusgraph.js'

export type Reason = 'staged' | 'new' | 'connect' | 'move'

export interface Selected {
  id: Id
  uuid: string
  cid?: string
  /** The user’s root’s first version, which is marked as the root. */
  root: boolean
  /** A Content’s type. */
  type?: string
  reason: Reason
  /** Pending entries it publishes. */
  entries: Array<Entry>
  /** Pending markers it publishes as tombstones. */
  markers: Array<Marker>
  /** Markers cancelled out, or replaced by an entry it publishes. */
  consumed: Array<Marker>
  /** Unmarked edges readers already hold as they are. */
  settled: Array<Entry>
}

/**
 * What an Update publishes: the staged Spots’ changes, closed under
 * research.md R3’s rules, per Spot & Content. `clean` is the staged
 * Spots with nothing to publish.
 */
export async function select(
  { source, address, staged }:
  { source: GraphTraversalSource, address: string, staged?: Array<Id> },
) {
  const tree = await treeOf({ source, address })
  const { root, spots, contents } = tree
  staged ??= [...spots.values()].filter(({ staged }) => staged).map(({ id }) => id)

  const chosen = { spots: new Map<Id, Selected>(), contents: new Map<Id, Selected>() }
  const clean: Array<Id> = []
  const queue: Array<Selected> = []

  const take = (
    { holder, kind, reason, entries, markers }:
    {
      holder: SpotState | ContentState
      kind: keyof typeof chosen
      reason: Reason
      entries: Array<Entry>
      markers: Array<Marker>
    },
  ) => {
    let selected = chosen[kind].get(holder.id)
    const created = !selected
    if(!selected) {
      selected = {
        id: holder.id,
        uuid: holder.uuid,
        cid: holder.cid,
        root: kind === 'spots' && holder.id === root && holder.cid == null,
        ...('type' in holder ? { type: holder.type } : {}),
        reason,
        entries: [],
        markers: [],
        consumed: [],
        settled: [],
      }
      chosen[kind].set(holder.id, selected)
    }
    const fresh = entries.filter((entry) => !selected.entries.includes(entry))
    selected.entries.push(...fresh)
    selected.markers.push(...markers.filter((marker) => !selected.markers.includes(marker)))
    if(created || fresh.length > 0) queue.push(selected)
    return selected
  }
  const pendingOf = (holder: SpotState | ContentState) => ({
    entries: holder.entries.filter(({ pending }) => pending),
    markers: holder.markers.filter(({ pending }) => pending),
  })
  const takeAll = (
    holder: SpotState | ContentState, kind: keyof typeof chosen, reason: Reason,
  ) => (
    take({ holder, kind, reason, ...pendingOf(holder) })
  )

  for(const id of staged) {
    const spot = spots.get(id)
    if(!spot) continue
    if(!spotIsPending(spot, contents)) {
      clean.push(id)
      continue
    }
    takeAll(spot, 'spots', 'staged')
    for(const content of spot.contents.map((held) => contents.get(held)!)) {
      if(isPending(content)) takeAll(content, 'contents', 'staged')
    }
  }

  const incoming = new Map<Id, Array<{ from: SpotState, entry: Entry }>>()
  for(const from of spots.values()) {
    for(const entry of from.entries) {
      if(entry.kind !== 'CONTAINS') continue
      if(!incoming.has(entry.to)) incoming.set(entry.to, [])
      incoming.get(entry.to)!.push({ from, entry })
    }
  }

  /**
   * A new Spot needs a link in the Update, unless readers have one to it
   * already: its oldest pending one, which, with v7 uuids, is the one
   * with the lowest uuid.
   */
  const connect = (selected: Selected) => {
    if(selected.id === root || selected.cid != null) return
    const links = incoming.get(selected.id) ?? []
    const connected = links.some(({ from, entry }) => (
      entry.baseline != null
      || chosen.spots.get(from.id)?.entries.includes(entry)
    ))
    if(connected) return
    const [oldest] = (
      links.filter(({ entry }) => entry.pending)
      .sort((a, b) => (a.entry.key < b.entry.key ? -1 : 1))
    )
    if(oldest) {
      take({
        holder: oldest.from,
        kind: 'spots',
        reason: 'connect',
        entries: [oldest.entry],
        markers: [],
      })
    }
  }

  // A move’s two halves, the old parent’s marker & the new parent’s
  // entry, share a kind & key, & always travel together.
  const moved = (kind: string, key: string) => JSON.stringify([kind, key])
  const halves = {
    entries: new Map<string, Array<{ holder: SpotState, entry: Entry }>>(),
    markers: new Map<string, Array<{ holder: SpotState, marker: Marker }>>(),
  }
  const index = <T>(map: Map<string, Array<T>>, at: string, item: T) => {
    if(!map.has(at)) map.set(at, [])
    map.get(at)!.push(item)
  }
  for(const holder of spots.values()) {
    for(const entry of holder.entries) {
      if(entry.pending && (entry.kind === 'CONTAINS' || entry.kind === 'AS')) {
        index(halves.entries, moved(entry.kind, entry.key), { holder, entry })
      }
    }
    for(const marker of holder.markers) {
      if(marker.pending && (marker.kind === 'CONTAINS' || marker.kind === 'AS')) {
        index(halves.markers, moved(marker.kind, marker.key), { holder, marker })
      }
    }
  }
  const pair = (selected: Selected) => {
    for(const { kind, key } of selected.markers) {
      for(const { holder, entry } of halves.entries.get(moved(kind, key)) ?? []) {
        take({ holder, kind: 'spots', reason: 'move', entries: [entry], markers: [] })
      }
    }
    for(const { kind, key } of selected.entries) {
      for(const { holder, marker } of halves.markers.get(moved(kind, key)) ?? []) {
        take({ holder, kind: 'spots', reason: 'move', entries: [], markers: [marker] })
      }
    }
  }

  while(queue.length > 0) {
    const selected = queue.shift()!
    if(!spots.has(selected.id)) continue
    connect(selected)
    pair(selected)
    for(const { kind, to } of selected.entries) {
      if(kind === 'CONTAINS') {
        const child = spots.get(to)
        if(child && child.cid == null && !chosen.spots.has(to)) {
          takeAll(child, 'spots', 'new')
        }
      } else if(kind === 'AS') {
        const content = contents.get(to)!
        if(content.cid == null && !chosen.contents.has(to)) {
          takeAll(content, 'contents', 'new')
        }
      }
    }
  }

  const holders = { spots, contents } as const
  for(const kind of ['spots', 'contents'] as const) {
    for(const selected of chosen[kind].values()) {
      const holder = holders[kind].get(selected.id)!
      for(const marker of holder.markers.filter(({ pending }) => !pending)) {
        const live = holder.entries.find(({ kind, key }) => (
          kind === marker.kind && key === marker.key
        ))!
        if(selected.entries.includes(live) || !live.pending) {
          selected.consumed.push(marker)
        }
      }
      selected.settled.push(...holder.entries.filter(({ pending, published }) => (
        !pending && published == null
      )))
    }
  }

  return { ...chosen, clean, root, pathOf: tree.pathOf }
}
