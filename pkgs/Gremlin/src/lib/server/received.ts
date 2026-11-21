import gremlin from 'gremlin'
import * as dagCBOR from '@ipld/dag-cbor'
import { error } from '@sveltejs/kit'
import { CID } from 'multiformats/cid'
import {
  authorOf, digestOf, MalformedUpdate, validateUpdate,
} from '#lib/updates.js'
import type { Blocks } from '#lib/server/blocks.js'
import { mergeDevice, type GraphTraversalSource } from '#lib/server/janusgraph.js'

const { statics: __ } = gremlin.process

const malformed = (reason: string) => (
  error(400, `That Update is malformed: ${reason}.`)
)

/**
 * Records the Update at `cid` under its author’s `User` → `Device` →
 * `Updates`, unless that Device already has one with its digest.
 */
export async function recordUpdate(
  { source, blocks, cid, now }:
  {
    source: GraphTraversalSource
    blocks: Pick<Blocks, 'get'>
    cid: string
    now: string
  },
) {
  let parsed: CID
  try {
    parsed = CID.parse(cid)
  } catch {
    throw error(400, `“${cid}” isn’t a CID.`)
  }
  let bytes: Uint8Array
  try {
    bytes = await blocks.get(parsed)
  } catch(err) {
    throw error(504, `Fetching Update ${cid} failed: ${(err as Error).message}`)
  }
  let value: unknown
  try {
    value = dagCBOR.decode(bytes)
  } catch {
    throw malformed('it isn’t DAG-CBOR')
  }
  let update
  try {
    update = await validateUpdate(value)
  } catch(err) {
    if(err instanceof MalformedUpdate) throw malformed(err.reason)
    throw err
  }

  const author = await authorOf(update)
  const digest = digestOf(update)
  const { device, sequence } = update
  const updates = await mergeDevice({ source, address: author, device, now })
  const { value: added } = await (
    source.V(updates)
    .as('updates')
    .coalesce(
      __.out('SPANS').has('Update', 'digest', digest).constant(false),
      (
        __.addV('Update')
        .property('cid', cid)
        .property('sequence', sequence)
        .property('digest', digest)
        .property('createdAt', now)
        .addE('SPANS')
        .from_('updates')
        .property('createdAt', now)
        .constant(true)
      ),
    )
    .next()
  )
  return { recorded: added === true, author, device, sequence }
}
