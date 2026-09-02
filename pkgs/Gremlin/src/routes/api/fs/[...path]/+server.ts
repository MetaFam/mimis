import * as v from 'valibot'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getSessionAddress } from '$lib/server/auth'
import {
  fileTarget, findRep, listEntries, renameEntry, statEntry,
} from '$lib/server/fsEntries'
import { addBytes, catBytes, pin } from '$lib/server/ipfs'
import { addFiles } from '$lib/remotes/addFiles.remote'
import { spotId } from '$lib/remotes/spotId.remote'

const segments = (path: string) => (
  path.split('/').filter(Boolean)
)

const CommitSchema = v.object({
  entries: v.array(v.object({
    path: v.string(),
    cid: v.string(),
    type: v.string(),
    size: v.number(),
  })),
})

const RenameSchema = v.object({ to: v.string() })

export const GET: RequestHandler = async ({ params, url }) => {
  const address = (await getSessionAddress({ throw: true }))!
  const path = segments(params.path)
  const op = url.searchParams.get('op')

  switch(op) {
    case 'stat': {
      const entry = await statEntry({ address, path })
      if(entry == null) throw error(404, `Nothing at “${params.path}”.`)
      return json(entry)
    }
    case 'list': {
      if(await statEntry({ address, path }) == null) {
        throw error(404, `No directory at “${params.path}”.`)
      }
      return json(await listEntries({ address, path }))
    }
    case null: {
      // Raw bytes: either an explicitly staged CID, or the file’s
      // current representation.
      const cid = url.searchParams.get('cid')
      if(cid != null) {
        return new Response(await catBytes(cid) as BodyInit)
      }
      const rep = await findRep({ address, path })
      if(rep == null) throw error(404, `No file at “${params.path}”.`)
      return new Response(await catBytes(rep.cid) as BodyInit, {
        headers: { 'Content-Type': rep.type },
      })
    }
    default: {
      throw error(400, `Unknown operation: “${op}”.`)
    }
  }
}

/**
 * Stages content: the bytes land in IPFS (unpinned), but the graph
 * is untouched until a `?op=commit` references the returned CID.
 */
export const PUT: RequestHandler = async ({ params, request }) => {
  const address = (await getSessionAddress({ throw: true }))!
  const path = segments(params.path)
  const { cid, size } = await addBytes(
    new Uint8Array(await request.arrayBuffer())
  )
  const type = (
    (await findRep({ address, path }))?.type
    ?? fileTarget(path).type
  )
  return json({ cid, size, type })
}

export const POST: RequestHandler = async ({ params, request, url }) => {
  const address = (await getSessionAddress({ throw: true }))!
  const path = segments(params.path)
  const op = url.searchParams.get('op')

  switch(op) {
    case 'commit': {
      const { entries } = v.parse(CommitSchema, await request.json())
      const byDir = Map.groupBy(entries, ({ path }) => (
        segments(path).slice(0, -1).join('/')
      ))
      const results: Record<string, unknown> = {}
      for(const [dir, staged] of byDir) {
        const ids = await addFiles({
          path: segments(dir),
          files: staged.map(({ path, cid, type, size }) => (
            { cid, type, size, name: segments(path).at(-1)! }
          )),
        })
        staged.forEach(({ path, cid }, idx) => {
          const id = ids[idx]
          if(id != null && typeof id === 'object' && 'error' in id) {
            throw error(500, `Committing “${path}”: ${id.error}`)
          }
          results[path] = { id, cid }
        })
      }
      await Promise.allSettled(entries.map(({ cid }) => pin(cid)))
      return json(results)
    }
    case 'mkdir': {
      const id = await spotId({ path, create: true })
      return json({ id })
    }
    case 'rename': {
      const { to } = v.parse(RenameSchema, await request.json())
      await renameEntry({ address, from: path, to: segments(to) })
      return json({ renamed: to })
    }
    default: {
      throw error(400, `Unknown operation: “${op}”.`)
    }
  }
}

export const DELETE: RequestHandler = async () => {
  throw error(
    405,
    'Deletion is unsupported: the Mïmis graph is append-only.',
  )
}
