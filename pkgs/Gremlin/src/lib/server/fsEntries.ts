import gremlin from 'gremlin'
import { error } from '@sveltejs/kit'
import {
  connect as connectJanusGraph, connectToG, mergeSpotRoot,
  type GraphTraversal,
} from './janusgraph'
import { extFor, nameFor, splitName, typeForName } from '$lib/mimetypes'

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
}

/**
 * Walks `CONTAINS` edges for each path segment, resolving union
 * `MOUNT`s along the way — the same walk `searchFor` performs.
 */
function walkMounts(
  { traversal, path, maxDepth = 10 }:
  { traversal: GraphTraversal, path: Array<string>, maxDepth?: number }
) {
  for(const element of path) {
    traversal = (
      traversal
      .simplePath()
      .until(
        __.not(__.outE('MOUNT'))
        .or().loops().is(maxDepth)
      )
      .repeat(
        __.outE('MOUNT')
        .order()
        .by('order')
        .inV()
      )
      .outE('CONTAINS')
      .has('path', element)
      .inV()
    )
  }
  return traversal
}

/** Current (unsuperseded) representations of the incoming vertex. */
const currentReps = () => (
  __.outE('REPRESENTATION')
  .inV()
  .not(__.inE('PREVIOUS'))
  .project('type', 'cid', 'size', 'createdAt')
  .by(__.values('type'))
  .by(__.values('cid'))
  .by(__.coalesce(__.values('size'), __.constant(0)))
  .by(__.coalesce(__.values('createdAt'), __.constant('')))
)

const repFromMap = (map: Map<keyof Rep, unknown>) => (
  Object.fromEntries(map) as unknown as Rep
)

const times = (createdAt?: string) => {
  const stamp = createdAt ? Date.parse(createdAt) : NaN
  const time = Number.isNaN(stamp) ? 0 : stamp
  return { ctime: time, mtime: time }
}

async function spotTraversal(
  { connection, address, path }: {
    connection: ReturnType<typeof connectJanusGraph>
    address: string
    path: Array<string>
  }
) {
  const traversal = await mergeSpotRoot({
    traversal: connectToG(connection), address, create: false,
  })
  return walkMounts({ traversal, path })
}

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
export async function findRep(
  { address, path }: { address: string, path: Array<string> }
) {
  const { spotPath, type } = fileTarget(path)
  const connection = connectJanusGraph()
  try {
    const traversal = await spotTraversal({ connection, address, path: spotPath })
    const reps = (
      (await traversal.flatMap(currentReps()).toList()) as
      Array<Map<keyof Rep, unknown>>
    ).map(repFromMap)
    return (
      reps.find((rep) => rep.type === type)
      ?? (reps.length === 1 ? reps[0] : null)
    )
  } finally {
    await connection.close()
  }
}

export async function listEntries(
  { address, path }: { address: string, path: Array<string> }
) {
  const connection = connectJanusGraph()
  try {
    interface Row {
      name: string
      children: number
      created: string
      reps: Array<Map<keyof Rep, unknown>>
    }
    const children = await spotTraversal({ connection, address, path })
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
      .by(__.select('child').flatMap(currentReps()).fold())
      .dedup()
      .toList()) as Array<Map<keyof Row, unknown>>
    ).map((row) => Object.fromEntries(row) as unknown as Row)

    const entries: Array<FSEntry> = []
    for(const { name, children, created, reps } of rows) {
      const files = reps.map(repFromMap)
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
    const own = await spotTraversal({ connection, address, path })
    const ownReps = (
      (await own.flatMap(currentReps()).toList()) as
      Array<Map<keyof Rep, unknown>>
    ).map(repFromMap)
    for(const rep of ownReps) {
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
  } finally {
    await connection.close()
  }
}

export async function statEntry(
  { address, path }: { address: string, path: Array<string> }
) {
  if(path.length === 0) {
    return { name: '', kind: 'directory' } as FSEntry
  }

  const connection = connectJanusGraph()
  try {
    const traversal = await spotTraversal({ connection, address, path })
    const { value: created } = await (
      traversal
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
  } finally {
    await connection.close()
  }

  const rep = await findRep({ address, path })
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

  const connection = connectJanusGraph()
  try {
    const parent = await spotTraversal({
      connection, address, path: from.slice(0, -1),
    })
    const { value } = await (
      parent
      .outE('CONTAINS')
      .has('path', edgeFrom)
      .property('path', edgeTo)
      .id()
      .next()
    )
    if(value == null) {
      throw error(404, `No entry named “${source}” to rename.`)
    }
  } finally {
    await connection.close()
  }
}
