import { createHash } from 'node:crypto'
import {
  splitPath,
  CID,
  type Address,
  type NodeMountDoc,
  type UpdateDoc,
} from './codec.ts'

export type Mount = {
  source: CID | Address,
}

// The structure needed to walk: edge names to child CIDs, plus node mounts.
// Edge props and node data are not needed for traversal — the winning
// document is fetched from the DAG at the end (FR-015).
export type TraversalNode = {
  edges: Record<string, CID>,
  mounts: NodeMountDoc[],
}

export type ResolverDeps = {
  node(cid: CID): Promise<TraversalNode>,
  update(cid: CID): Promise<UpdateDoc>,
  latest(publisher: Address): Promise<CID | undefined>,
  maxMountDepth: number,
}

export type Resolution = {
  node: CID,
  via: CID,
}

// Stack identity: recomputable by anyone holding the ordered mount list,
// stable across cache wipes — unlike database element ids.
export const stackKey = (mounts: Mount[]): string => (
  createHash('sha256')
  .update(mounts.map(({ source }) => source.toString().toLowerCase()).join('\n'))
  .digest('hex')
)

type Layer = {
  root: CID,
  via: CID,
}

// A publisher's effective graph is their whole chain, newest shadowing
// oldest (FR-013). Walked lazily: deeper layers are only touched when
// nearer ones fall through (FR-015). A broken prev link throws (via the
// store) — absence cannot be asserted across a break.
async function* chainLayers(
  deps: ResolverDeps, publisher: Address,
): AsyncGenerator<Layer> {
  let next = await deps.latest(publisher)
  while(next) {
    const update = await deps.update(next)
    yield {
      root: update.root,
      via: next,
    }
    next = update.prev
  }
}

// Stack mounts name Updates (by CID) or publishers (⇒ their chain).
async function* updateLayers(
  deps: ResolverDeps, source: CID | Address,
): AsyncGenerator<Layer> {
  const cid = CID.asCID(source)
  if(cid) {
    const update = await deps.update(cid)
    yield {
      root: update.root,
      via: cid,
    }
  } else {
    yield* chainLayers(deps, source as Address)
  }
}

type Hit = {
  child: CID,
  via: CID,
}

// Spot → Spot between users' graphs (FR-014): resolve `segments` within
// the publisher's effective graph, yielding the mounted spot. Live — reads
// through the publisher's current chain every time. Shares the caller's
// depth budget so cross-user mount cycles terminate.
const findSpot = async (
  deps: ResolverDeps, publisher: Address, segments: string[], depth: number,
): Promise<Hit | undefined> => {
  const [first, ...rest] = segments
  let current: Hit | undefined
  for await(const layer of chainLayers(deps, publisher)) {
    current = await findInNode(deps, layer.root, first, depth, layer.via)
    if(current) {
      break
    }
  }
  for(const segment of rest) {
    if(!current) {
      return undefined
    }
    current = await findInNode(deps, current.child, segment, depth, current.via)
  }
  return current
}

// The effective edge named `name` at a node: the node's own edges shadow
// mounted content; mounts shadow each other by declared order; traversal
// is bounded by maxMountDepth so cycles terminate (FR-014). Node mounts
// name Nodes (by CID) or publishers (⇒ chain of update roots).
const findInNode = async (
  deps: ResolverDeps, nodeCid: CID, name: string, depth: number, via: CID,
): Promise<Hit | undefined> => {
  const node = await deps.node(nodeCid)
  const child = node.edges[name]
  if(child) {
    return {
      child,
      via,
    }
  }
  if(depth <= 0) {
    return undefined
  }
  const mounts = [...node.mounts].sort((a, b) => b.order - a.order)
  for(const mount of mounts) {
    const source = CID.asCID(mount.source)
    if(source) {
      const hit = await findInNode(deps, source, name, depth - 1, via)
      if(hit) {
        return hit
      }
    } else {
      const segments = splitPath(mount.path ?? '')
      if(segments.length > 0) {
        const spot = await findSpot(deps, mount.source as Address, segments, depth - 1)
        if(spot) {
          const hit = await findInNode(deps, spot.child, name, depth - 1, spot.via)
          if(hit) {
            return hit
          }
        }
      } else {
        for await(const layer of chainLayers(deps, mount.source as Address)) {
          const hit = await findInNode(deps, layer.root, name, depth - 1, layer.via)
          if(hit) {
            return hit
          }
        }
      }
    }
  }
  return undefined
}

// Union-mount resolution over an ordered stack: later mounts shadow
// earlier ones, whole-edge (an edge name won by a layer is that layer's
// child entirely — properties and subtree are never merged across layers).
export const resolveStack = async (
  deps: ResolverDeps, mounts: Mount[], path: string,
): Promise<Resolution | undefined> => {
  const segments = splitPath(path)
  const prioritized = [...mounts].reverse()
  if(segments.length === 0) {
    for(const mount of prioritized) {
      for await(const layer of updateLayers(deps, mount.source)) {
        return {
          node: layer.root,
          via: layer.via,
        }
      }
    }
    return undefined
  }
  const [first, ...rest] = segments
  let current: Hit | undefined
  for(const mount of prioritized) {
    for await(const layer of updateLayers(deps, mount.source)) {
      current = await findInNode(deps, layer.root, first, deps.maxMountDepth, layer.via)
      if(current) {
        break
      }
    }
    if(current) {
      break
    }
  }
  for(const segment of rest) {
    if(!current) {
      return undefined
    }
    current = await findInNode(deps, current.child, segment, deps.maxMountDepth, current.via)
  }
  if(!current) {
    return undefined
  }
  return {
    node: current.child,
    via: current.via,
  }
}
