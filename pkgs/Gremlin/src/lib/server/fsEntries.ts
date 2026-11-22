import gremlin from 'gremlin'
import { error } from '@sveltejs/kit'
import { extFor, nameFor, splitName, typeForName } from '#lib/mimetypes.js'
import { rank } from '#lib/rank.js'
import { release, unlinkSpot } from '#lib/server/edits.js'
import {
  assertOwned, edgeId, g, layerOf,
  type GraphTraversal, type GraphTraversalSource, type Id,
} from '#lib/server/janusgraph.js'
import { currentBlob, resolvePath, withMounts } from '#lib/server/listing.js'

const { statics: __ } = gremlin.process

export interface FSEntry {
  name: string
  kind: 'directory' | 'file'
  size?: number
  ctime?: number
  mtime?: number
  type?: string
  cid?: string
}

interface Rep {
  type: string
  cid: string
  size: number
  createdAt: string
  /** The Spot holding it. */
  spot: Id
  /** The `AS` edge it’s held by. */
  holding: unknown
}

interface Where {
  source?: GraphTraversalSource
  address: string
  path: Array<string>
}

/** The incoming Spot’s `Content`s, each with its current Blob. */
const currentReps = () => (
  __.outE('AS')
  .as('holding')
  .inV()
  .hasLabel('Content')
  .has('type')
  .project('uuid', 'after', 'type', 'proxy', 'blob', 'spot', 'holding')
  .by('uuid')
  .by(__.select('holding').values('after').fold())
  .by('type')
  .by(__.outE('MOUNT').count())
  .by(
    currentBlob()
    .project('cid', 'size', 'createdAt')
    .by('cid')
    .by(__.coalesce(__.values('size'), __.constant(0)))
    .by(__.coalesce(__.values('createdAt'), __.constant('')))
    .fold()
  )
  .by(__.select('holding').outV().id())
  .by(__.select('holding').id())
  .fold()
)

/**
 * A Spot’s best Content of each type, as a file is named by its type
 * (FR-019). Proxies are left out, since writes can’t version them.
 */
const bestOfEachType = (rows: Array<Map<string, unknown>>) => {
  const types = new Set<string>()
  return rank(rows.map((row) => {
    const [after] = row.get('after') as Array<string>
    return {
      uuid: row.get('uuid') as string,
      ...(after == null ? {} : { after }),
      row,
    }
  }))
  .flatMap(({ row }): Array<Rep> => {
    const type = row.get('type') as string
    const [blob] = row.get('blob') as Array<Map<string, unknown>>
    if(!blob || Number(row.get('proxy')) > 0 || types.has(type)) return []
    types.add(type)
    return [{
      type,
      cid: blob.get('cid') as string,
      size: Number(blob.get('size')),
      createdAt: blob.get('createdAt') as string,
      spot: row.get('spot') as Id,
      holding: row.get('holding'),
    }]
  })
}

const repsAt = async (traversal: GraphTraversal) => (
  ((await traversal.map(currentReps()).toList()) as Array<Array<Map<string, unknown>>>)
  .flatMap(bestOfEachType)
)

const times = (createdAt?: string) => {
  const stamp = createdAt ? Date.parse(createdAt) : NaN
  const time = Number.isNaN(stamp) ? 0 : stamp
  return { ctime: time, mtime: time }
}

/** The Spots `path` resolves to, through mounts, as the app resolves it. */
const spotTraversal = ({ source = g(), address, path }: Where) => (
  resolvePath({ from: layerOf(address, source), path })
)

/** Those Spots & the layers they mount, whose entries they list. */
const layersAt = (where: Where) => (
  withMounts({ traversal: spotTraversal(where), label: 'listed', maxDepth: 10 })
)

/**
 * The Spot & representation type a filename resolves to, following
 * the conventions of `addFiles`: `title.ext` is the `title` Spot’s
 * representation typed by `ext`’s MIME type, & `ext.ext` names a
 * representation on the containing Spot itself.
 */
export function fileTarget(path: Array<string>) {
  const name = path.at(-1)
  if(name == null) throw error(400, 'Empty path names no file.')
  const { title, ext } = splitName(name)
  const spotPath = (
    title === ext ? path.slice(0, -1) : [...path.slice(0, -1), title]
  )
  return { name, title, ext, spotPath, type: typeForName(name) }
}

/**
 * The current representation a file path names: an exact MIME-type
 * match by extension, falling back to a lone representation whose
 * stored type doesn’t round-trip through the filename.
 */
export async function findRep({ path, ...where }: Where) {
  const { spotPath, type } = fileTarget(path)
  const reps = await repsAt(spotTraversal({ ...where, path: spotPath }))
  return (
    reps.find((rep) => rep.type === type)
    ?? (reps.length === 1 ? reps[0] : null)
  )
}

export async function listEntries(where: Where) {
  interface Row {
    name: string
    children: number
    created: string
    reps: Array<Map<string, unknown>>
  }
  const children = layersAt(where)
  const rows = (
    (await children
    .outE('CONTAINS')
    .as('contains')
    .values('path').as('name')
    .select('contains')
    .inV().as('child')
    .project('name', 'children', 'created', 'reps')
    .by(__.select('name'))
    .by(__.select('child').outE('CONTAINS', 'MOUNT').count())
    .by(__.select('child').coalesce(__.values('createdAt'), __.constant('')))
    .by(__.select('child').map(currentReps()))
    .dedup()
    .toList()) as Array<Map<keyof Row, unknown>>
  ).map((row) => Object.fromEntries(row) as unknown as Row)

  const entries: Array<FSEntry> = []
  for(const { name, children, created, reps } of rows) {
    const files = bestOfEachType(reps)
    if(Number(children) > 0 || files.length === 0) {
      entries.push({ name, kind: 'directory', ...times(created) })
    }
    for(const rep of files) {
      entries.push({
        name: nameFor({ title: name, type: rep.type }),
        kind: 'file',
        size: Number(rep.size),
        type: rep.type,
        cid: rep.cid,
        ...times(rep.createdAt),
      })
    }
  }

  // Representations on the listed Spot itself appear as `ext.ext`
  // files, mirroring how `addFiles` handles context-free names.
  for(const rep of await repsAt(spotTraversal(where))) {
    const ext = extFor(rep.type)
    if(ext == null) continue
    entries.push({
      name: `${ext}.${ext}`,
      kind: 'file',
      size: Number(rep.size),
      type: rep.type,
      cid: rep.cid,
      ...times(rep.createdAt),
    })
  }

  const seen = new Set<string>()
  return entries.filter(({ name, kind }) => {
    const key = `${kind}:${name}`
    if(seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function statEntry(where: Where) {
  const { path } = where
  if(path.length === 0) {
    return { name: '', kind: 'directory' } as FSEntry
  }

  const { value: created } = await (
    spotTraversal(where)
    .coalesce(__.values('createdAt'), __.constant(''))
    .next()
  )
  if(created != null) {
    return {
      name: path.at(-1)!,
      kind: 'directory',
      ...times(created as string),
    } as FSEntry
  }

  const rep = await findRep(where)
  if(rep == null) return null
  return {
    name: path.at(-1)!,
    kind: 'file',
    size: Number(rep.size),
    type: rep.type,
    cid: rep.cid,
    ...times(rep.createdAt),
  } as FSEntry
}

/**
 * The `CONTAINS` link `path` names, from its parent or a layer the
 * parent mounts, & whether the Spot it leads to holds anything.
 */
async function linkAt({ path, ...where }: Where) {
  const { value } = await (
    layersAt({ ...where, path: path.slice(0, -1) })
    .outE('CONTAINS')
    .has('path', path.at(-1)!)
    .project('from', 'what', 'held')
    .by(__.outV().id())
    .by(__.inV().id())
    .by(__.inV().outE('CONTAINS', 'MOUNT', 'AS').limit(1).count())
    .next()
  )
  if(value == null) return null
  const row = value as Map<'from' | 'what' | 'held', unknown>
  return {
    from: row.get('from') as Id,
    what: row.get('what') as Id,
    empty: Number(row.get('held')) === 0,
  }
}

/**
 * Deletes what `path` names in the user’s own tree. A directory is
 * its Spot, taken out of its parent. A file is a Content, taken off
 * its Spot, & a `title.ext` file’s `title` Spot goes too once that
 * leaves it empty, rather than linger as an empty directory.
 */
export async function deleteEntry(
  { recursive = false, now, ...where }:
  Where & { recursive?: boolean, now: string },
) {
  const { source = g(), address, path } = where
  if(path.length === 0) throw error(400, 'The root can’t be deleted.')
  const name = path.at(-1)!

  const directory = await linkAt(where)
  if(directory) {
    if(!recursive && !directory.empty) {
      throw error(400, `“${name}” isn’t empty.`)
    }
    await assertOwned({ source, ids: { directory: directory.from }, address })
    const { from, what } = directory
    await unlinkSpot({ source, from, what, name, now })
    return
  }

  const rep = await findRep(where)
  if(rep == null) throw error(404, `Nothing at “/${path.join('/')}”.`)
  await assertOwned({ source, ids: { file: rep.spot }, address })
  await release({ source, edge: edgeId(rep.holding), now })

  const { title, ext, spotPath } = fileTarget(path)
  if(title === ext) return
  const holder = await linkAt({ ...where, path: spotPath })
  if(holder?.what === rep.spot && holder.empty) {
    const { from, what } = holder
    await unlinkSpot({ source, from, what, name: title!, now })
  }
}

/**
 * Renames a Spot within its parent by relabeling the `CONTAINS`
 * edge’s `path`. Filenames rename their underlying title Spot, so
 * the extension (& thereby MIME type) must be preserved.
 */
export async function renameEntry(
  { address, from, to }: {
    address: string
    from: Array<string>
    to: Array<string>
  }
) {
  if(from.slice(0, -1).join('/') !== to.slice(0, -1).join('/')) {
    throw error(400, 'Moving between directories isn’t supported here — drag & drop in the Mïmis app instead.')
  }

  const [source, destination] = [from, to].map((path) => path.at(-1)!)
  const [splitFrom, splitTo] = [source, destination].map(splitName)
  let [edgeFrom, edgeTo] = [source, destination]
  if(splitFrom.ext != null || splitTo.ext != null) {
    if(splitFrom.ext !== splitTo.ext) {
      throw error(400, 'Changing a file’s extension would change its representation type — unsupported.')
    }
    if(splitFrom.title === splitFrom.ext) {
      throw error(400, 'Context-free names (like `md.md`) label their parent Spot & can’t be renamed.')
    }
    ;[edgeFrom, edgeTo] = [splitFrom.title!, splitTo.title!]
  }

  const { value } = await (
    spotTraversal({ address, path: from.slice(0, -1) })
    .outE('CONTAINS')
    .has('path', edgeFrom)
    .property('path', edgeTo)
    .id()
    .next()
  )
  if(value == null) {
    throw error(404, `No entry named “${source}” to rename.`)
  }
}
