import { error } from '@sveltejs/kit'
import { arrange, holdingsOf, proxy, spotAt } from '#lib/server/edits.js'
import {
  layerOf, ownersOf, type GraphTraversalSource, type Id,
} from '#lib/server/janusgraph.js'
import {
  layerContents, layerRows, overlay, resolveSpots, stack, type Content,
} from '#lib/server/listing.js'

interface Where {
  source: GraphTraversalSource
  address: string
  path: Array<string>
}

/** The layers at `path`, & the user’s own Spot there, if it has one. */
async function layersAt({ source, address, path }: Where) {
  const starts = await resolveSpots({ source, from: layerOf(address, source), path })
  const layers = layerContents(await layerRows({ source, starts }))
  const [first] = layers
  const own = (
    first && (await ownersOf({ source, spot: first.id })).includes(address)
    && first.id
  )
  return { layers, own: own || null }
}

/**
 * The Contents at `path`, best first, as listings merge them, each
 * marked with whether it’s in the user’s own tree.
 */
export async function rankingAt(where: Where) {
  const { layers } = await layersAt(where)
  const owned = new Map<Id, Promise<boolean>>()
  const isOwn = (spot: Id) => {
    if(!owned.has(spot)) {
      owned.set(spot, ownersOf({ source: where.source, spot }).then((owners) => (
        owners.includes(where.address)
      )))
    }
    return owned.get(spot)!
  }
  return Promise.all(
    stack(layers.map(({ contents }) => contents))
    .map(async (content) => ({ ...content, own: await isOwn(content.spot) }))
  )
}

/**
 * Moves `content` to `index` in the user’s view of `path`. Only the
 * user’s own Spot there changes, & is made if need be: it gets proxies
 * for the other layers’ Contents the move passes over, so every other
 * Content keeps its place (FR-014).
 */
export async function placeContent(
  { content, index, now, ...where }:
  Where & { content: Id, index: number, now: string },
) {
  const { layers, own } = await layersAt(where)
  const mine = layers.find(({ id }) => id === own)?.contents ?? []
  const below = stack(layers.filter(({ id }) => id !== own).map(({ contents }) => contents))
  const shown = overlay(mine, below)
  const from = shown.findIndex(({ id }) => id === content)
  if(from < 0) throw error(404, `Content #${content} isn’t at /${where.path.join('/')}.`)
  if(!Number.isSafeInteger(index) || index < 0 || index >= shown.length) {
    throw error(400, `There’s no place ${index} among ${shown.length} Contents.`)
  }
  const wanted = [...shown]
  wanted.splice(index, 0, ...wanted.splice(from, 1))

  const ours = new Set(mine.map(({ id }) => id))
  const placeholders = new Set<Content>()
  const attempt = (proxied: Array<Content>) => {
    const targets = new Set(proxied.map(({ id }) => id))
    const plan = wanted.flatMap((shownAt) => {
      if(ours.has(shownAt.id)) return [shownAt]
      if(!targets.has(shownAt.id)) return []
      const placeholder = { ...shownAt, id: `proxy of ${shownAt.id}`, mounts: shownAt.id }
      placeholders.add(placeholder)
      return [placeholder]
    })
    const result = overlay(plan, below)
    const same = result.length === wanted.length && result.every((at, idx) => (
      placeholders.has(at) ? at.mounts === wanted[idx].id : at.id === wanted[idx].id
    ))
    return same ? plan : null
  }
  const theirs = (contents: Array<Content>) => contents.filter(({ id }) => !ours.has(id))
  const plan = (
    attempt(theirs(wanted.slice(Math.min(from, index), Math.max(from, index) + 1)))
    ?? attempt(theirs(wanted))
  )
  if(!plan) throw new Error(`Can’t place Content #${content} at ${index}.`)

  const spot = own ?? await spotAt({ ...where, now })
  const order: Array<string> = []
  for(const planned of plan) {
    if(placeholders.has(planned)) {
      order.push((await proxy({ source: where.source, spot, target: planned.mounts!, now })).uuid)
    } else {
      order.push(planned.uuid)
    }
  }
  const unlisted = (await holdingsOf({ source: where.source, spot })).filter(({ uuid }) => (
    !order.includes(uuid)
  ))
  await arrange({
    source: where.source, spot, order: [...order, ...unlisted.map(({ uuid }) => uuid)],
  })
  return spot
}
