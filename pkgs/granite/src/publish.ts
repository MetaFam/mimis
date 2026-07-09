import {
  asNode,
  asUpdate,
  cidOf,
  decode,
  encode,
  CID,
  type Address,
  type NodeMountDoc,
} from './codec.ts'
import { addressOf } from './keys.ts'
import { encodeAnnouncement, signAnnouncement, type Announcer } from './announce.ts'
import type { Blockstore } from './store.ts'
import type { Registry } from './registry.ts'

// Trees are partial snapshots (FR-013): publish only the paths being
// asserted — older layers of the chain keep serving everything else.
export type Tree = {
  data?: Record<string, unknown>,
  edges?: Record<string, { props?: Record<string, unknown>, child: Tree | CID }>,
  mounts?: NodeMountDoc[],
}

export type PublishPorts = {
  store: Blockstore,
  registry: Registry,
  announcer: Announcer,
  key: `0x${string}`,
}

export type Published = {
  update: CID,
  root: CID,
  prev?: CID,
}

const writeValidated = async (
  store: Blockstore,
  document: unknown,
  validate: (cid: CID, value: unknown) => unknown,
): Promise<CID> => {
  const bytes = encode(document)
  const cid = await cidOf(bytes)
  validate(cid, decode(bytes))
  return await store.put(bytes)
}

export const writeTree = async (store: Blockstore, tree: Tree): Promise<CID> => {
  const edges: Record<string, unknown> = {}
  for(const [name, edge] of Object.entries(tree.edges ?? {})) {
    const child = CID.asCID(edge.child) ?? await writeTree(store, edge.child as Tree)
    edges[name] = {
      ...(edge.props ? { props: edge.props } : {}),
      child,
    }
  }
  const document = {
    ...(tree.data ? { data: tree.data } : {}),
    edges,
    ...(tree.mounts?.length ? { mounts: tree.mounts } : {}),
  }
  return await writeValidated(store, document, asNode)
}

export const publishTree = async (
  { store, registry, announcer, key }: PublishPorts,
  tree: Tree,
): Promise<Published> => {
  const publisher: Address = addressOf(key)
  const prev = await registry.latest(publisher)
  const root = await writeTree(store, tree)
  const at = Math.floor(Date.now() / 1000)
  const update = await writeValidated(
    store,
    {
      granite: 1,
      publisher,
      root,
      ...(prev ? { prev } : {}),
      at,
    },
    asUpdate,
  )
  await registry.publish(update)
  const announcement = {
    publisher,
    root: update,
    ...(prev ? { prev } : {}),
    at,
  }
  const sig = await signAnnouncement(key, announcement)
  await announcer.publish(encodeAnnouncement(announcement, sig))
  return {
    update,
    root,
    ...(prev ? { prev } : {}),
  }
}
