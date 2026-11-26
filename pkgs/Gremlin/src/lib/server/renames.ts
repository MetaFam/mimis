import gremlin from 'gremlin'
import { v7 as uuidV7 } from 'uuid'
import { error } from '@sveltejs/kit'
import { validName } from '#lib/names.js'
import { comparePaths, rootOf } from '#lib/server/changes.js'
import { retire, spotAt } from '#lib/server/edits.js'
import {
  assertOwned, edgeAt, edgeId, layerOf, ownersOf, writeAll,
  type GraphTraversalSource, type Id,
} from '#lib/server/janusgraph.js'
import { layerRows, resolveSpots, visibleLinks } from '#lib/server/listing.js'

const { statics: __, P } = gremlin.process

interface Where {
  source: GraphTraversalSource
  address: string
  path: Array<string>
}

const shown = (path: Array<string>) => `/${path.map((name) => `${name}/`).join('')}`

/**
 * The uuid of the Spot that holds the link `edge` names: its own
 * holder, or, for a mount of it, the `parent` that mount records.
 */
const parentOf = (edge: string) => (
  edgeAt(edge).coalesce(__.values('parent'), __.outV().values('uuid'))
)

/** The links the user sees at `path`, highest layer first. */
async function linksAt({ source, address, path }: Where) {
  const starts = await resolveSpots({ source, from: layerOf(address, source), path })
  return visibleLinks(await layerRows({ source, starts }))
}

/**
 * Renames what the user sees as `from` at `path` to `to`. A link in a
 * Spot of the user’s own gets the new `path` in place (FR-003). Any
 * other is mounted in the user’s own Spot at `path`, made if need be,
 * under the new name, so their tree is never written (FR-004). That
 * Spot mustn’t already hold `to` (FR-006).
 */
export async function renameSpot(
  { source, address, path, from, to, now }:
  Where & { from: string, to: string, now: string },
) {
  const name = validName(to)
  const renamed = { path: [...path, name] }
  if(name === from) return renamed

  const links = await linksAt({ source, address, path })
  const named = links.filter((link) => link.name === from)
  if(named.length === 0) error(404, `No entry named “${from}” at ${shown(path)}`)
  if(links.some((link) => link.own && link.name === name)) {
    error(409, `${shown(path)} already contains “${name}”`)
  }
  const owned = new Map<Id, Promise<boolean>>()
  const isOwn = (spot: Id) => {
    if(!owned.has(spot)) {
      owned.set(spot, ownersOf({ source, spot }).then((owners) => owners.includes(address)))
    }
    return owned.get(spot)!
  }
  const writes = []
  let own: Id | undefined
  for(const link of named) {
    if(await isOwn(link.layer)) {
      writes.push(edgeAt(link.edge).property('path', name))
      continue
    }
    if(link.uuid == null) throw new Error(`Link ${link.edge} has no uuid.`)
    own ??= await spotAt({ source, address, path, now })
    writes.push(
      __.V(own).addE('MOUNT').to(__.V(link.id))
      .property('uuid', link.uuid)
      .property('path', name)
      .property('base', from)
      // A mount of a mount tracks the link that one mounts.
      .property('parent', parentOf(link.edge))
      .property('createdAt', now)
    )
  }
  await writeAll(source, writes)
  return renamed
}

/** What a user is told when the owner of a link they mounted moves it. */
export interface Notice {
  /** The user’s link `MOUNT`, by edge id. */
  mount: string
  /** The mounted link’s uuid. */
  uuid: string
  /** The mount’s `path`, as the user sees it. */
  name: string
  /** The user’s view path of the mount’s Spot. */
  from: Array<string>
  /** The user’s view path of the link’s new parent, if they can see it. */
  to: Array<string> | null
  /** The new parent’s path in the owner’s tree. */
  ownerPath: Array<string>
  owner: string
}

const MAX_STEPS = 20

/** The shortest walk up from `spot` by `step` to where `done`, as names. */
async function walkUp(
  { source, spot, step, done }:
  {
    source: GraphTraversalSource
    spot: Id
    step: ReturnType<typeof __.inE>
    done: ReturnType<typeof __.in_>
  },
) {
  const { value } = await (
    source.V(spot)
    .emit(done)
    .repeat(step.outV().simplePath())
    .times(MAX_STEPS)
    .limit(1)
    .path()
    .by(__.coalesce(__.values('path'), __.constant('')))
    .next()
  )
  if(value == null) return null
  return ((value as { objects: Array<string> }).objects).filter(Boolean).reverse()
}

/**
 * `spot`’s path as the user sees it: the shortest walk up through
 * links & layer mounts to their root, within 20 steps, or `null`.
 */
export const viewPathOf = (
  { source, address, spot }:
  { source: GraphTraversalSource, address: string, spot: Id },
) => (
  walkUp({
    source,
    spot,
    step: __.inE('CONTAINS', 'MOUNT'),
    done: __.in_('WRITES').has('User', 'address', address),
  })
)

/** A link `MOUNT` & the link it mounts, wherever that is now. */
async function mountAt(
  { source, address, mount }:
  { source: GraphTraversalSource, address: string, mount: string },
) {
  const { value } = await (
    source.E(mount)
    .hasLabel('MOUNT')
    .has('path')
    .project('spot', 'uuid', 'name', 'base', 'parent', 'target', 'links')
    .by(__.outV().id())
    .by('uuid')
    .by('path')
    .by(__.values('base').fold())
    .by(__.values('parent').fold())
    .by(__.inV().id())
    .by(
      __.as('mount')
      .inV()
      .inE('CONTAINS')
      .where(P.eq('mount')).by('uuid')
      .project('holder', 'uuid', 'name')
      .by(__.outV().id())
      .by(__.outV().values('uuid'))
      .by('path')
      .fold()
    )
    .next()
  )
  if(value == null) error(404, `There’s no mounted link ${mount}.`)
  const row = value as Map<string, unknown>
  const spot = row.get('spot') as Id
  await assertOwned({ source, ids: { mount: spot }, address })
  const [link] = (row.get('links') as Array<Map<string, unknown>>).map((found) => ({
    holder: found.get('holder') as Id,
    uuid: found.get('uuid') as string,
    name: found.get('name') as string,
  }))
  const [parent] = row.get('parent') as Array<string>
  const [base] = row.get('base') as Array<string>
  const from = await viewPathOf({ source, address, spot })
  if(from == null) throw new Error(`The user can’t see their own Spot #${spot}.`)
  return {
    mount,
    spot,
    uuid: row.get('uuid') as string,
    name: row.get('name') as string,
    base: base ?? (row.get('name') as string),
    target: row.get('target') as Id,
    link,
    from,
    moved: link != null && link.uuid !== parent,
  }
}
type Mounted = Awaited<ReturnType<typeof mountAt>>

const noticeOf = async (
  { source, address, mounted }:
  { source: GraphTraversalSource, address: string, mounted: Mounted & { link: object } },
): Promise<Notice> => {
  const { mount, uuid, name, from, link } = mounted
  const ownerPath = await walkUp({
    source, spot: link.holder, step: __.inE('CONTAINS'), done: __.in_('WRITES'),
  })
  const [owner] = await ownersOf({ source, spot: link.holder })
  if(ownerPath == null || owner == null) {
    throw new Error(`No one’s tree holds Spot #${link.holder}.`)
  }
  return {
    mount,
    uuid,
    name,
    from,
    to: await viewPathOf({ source, address, spot: link.holder }),
    ownerPath,
    owner,
  }
}

/**
 * A notice for each of the user’s link `MOUNT`s whose link its owner
 * has moved since it was mounted, by `from`, then `name` (FR-022).
 */
export async function noticesFor(
  { source, address }: { source: GraphTraversalSource, address: string },
) {
  const mounts = await (
    source.V(await rootOf({ source, address }))
    .emit()
    .repeat(__.out('CONTAINS').dedup())
    .dedup()
    .outE('MOUNT')
    .has('path')
    .id()
    .toList()
  )
  const notices: Array<Notice> = []
  for(const mount of mounts) {
    const mounted = await mountAt({ source, address, mount: edgeId(mount) })
    if(mounted.moved) {
      notices.push(await noticeOf({ source, address, mounted: mounted as Mounted & { link: object } }))
    }
  }
  return notices.sort((a, b) => (
    comparePaths(a.from, b.from) || comparePaths([a.name], [b.name])
  ))
}

interface Resolving {
  source: GraphTraversalSource
  address: string
  mount: string
  now: string
}

/**
 * Takes the mount out, so the link it mounted lists under its owner’s
 * name wherever it is. Where it was, & where its link is, if the user
 * sees it.
 */
export async function removeMount({ source, address, mount, now }: Resolving) {
  const { link, from, name } = await mountAt({ source, address, mount })
  const at = link && await viewPathOf({ source, address, spot: link.holder })
  await retire({ source, edge: mount, now })
  return { from: [...from, name], to: at ? [...at, link.name] : null }
}

/**
 * Moves the mount to the user’s own Spot at its link’s new place,
 * keeping its uuid & name.
 */
export async function followMount({ source, address, mount, now }: Resolving) {
  const mounted = await mountAt({ source, address, mount })
  const { link, from, name, uuid, base, target } = mounted
  if(!mounted.moved || !link) error(409, 'That link hasn’t moved.')
  const notice = await noticeOf({ source, address, mounted: { ...mounted, link } })
  if(notice.to == null) {
    error(
      400,
      `${notice.owner} moved “${link.name}” where you can’t follow it, to ${shown(notice.ownerPath)} in their tree.`,
    )
  }
  const there = await linksAt({ source, address, path: notice.to })
  if(there.some((other) => other.own && other.name === name)) {
    error(409, `${shown(notice.to)} already contains “${name}”`)
  }
  const spot = await spotAt({ source, address, path: notice.to, now })
  await (
    source.V(spot).addE('MOUNT').to(__.V(target))
    .property('uuid', uuid)
    .property('path', name)
    .property('base', base)
    .property('parent', __.V(link.holder).values('uuid'))
    .property('createdAt', now)
    .next()
  )
  await retire({ source, edge: mount, now })
  return { from: [...from, name], to: [...notice.to, name] }
}

/**
 * Replaces the mount with a link of the user’s own, under its name,
 * that no longer tracks the moved one.
 */
export async function keepMount({ source, address, mount, now }: Resolving) {
  const { spot, target, from, name } = await mountAt({ source, address, mount })
  // Not a CONTAINS straight to their Spot: that would make the user one
  // of its owners. A Spot of the user’s own mounting it lists the same.
  await (
    source.addV('Spot')
    .property('uuid', uuidV7())
    .property('createdAt', now)
    .as('kept')
    .addE('MOUNT').to(__.V(target))
    .property('order', 0)
    .property('createdAt', now)
    .select('kept')
    .addE('CONTAINS').from_(__.V(spot))
    .property('path', name)
    .property('uuid', uuidV7())
    .property('createdAt', now)
    .next()
  )
  await retire({ source, edge: mount, now })
  return { from: [...from, name], to: [...from, name] }
}
