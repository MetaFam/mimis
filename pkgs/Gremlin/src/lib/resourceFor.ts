import gremlin from 'gremlin'
import { spotId } from '#lib/remotes/spotId.remote.js'
import { g } from '#lib/server/janusgraph.js'
import { throwError } from '#lib'
import { mimeFor, viewable } from '#lib/mimetypes.js'

const { statics: __ } = gremlin.process

export async function resourceAt({
  containerId, type,
}: {
  containerId: number
  type: string
}) {
  const { value = null } = await (
    g().V(containerId)
    .outE('REPRESENTATION')
    .inV()
    .has('type', type)
    .not(__.inE('PREVIOUS'))
    .values('cid')
    .next()
  )
  return value as string | null
}

export async function resourceFor(
  { path, ifMissing = 'image/svg+xml', onlyViewable = false }:
  { path: Array<string>, ifMissing?: string, onlyViewable?: boolean }
) {
  let containerId = throwError(await spotId({ path }))

  let type = mimeFor(path.at(-1))
  if(type == null) {
    type = ifMissing
  }

  if(onlyViewable && !viewable(type)) return null

  if(containerId == null) {
    containerId ??= throwError(await spotId({ path: path.slice(0, -1) }))
    if(containerId == null) return null
  }

  const cid = await resourceAt({ containerId, type })
  if(cid == null) return null

  return { cid, type }
}