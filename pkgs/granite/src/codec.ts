import * as dagCbor from '@ipld/dag-cbor'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { MalformedDocumentError } from './errors.ts'

export type Address = `0x${string}`

export type EdgeDoc = {
  props?: Record<string, unknown>,
  child: CID,
}

export type NodeMountDoc = {
  source: CID | Address,
  path?: string,
  order: number,
}

export type NodeDoc = {
  data?: Record<string, unknown>,
  edges: Record<string, EdgeDoc>,
  mounts: NodeMountDoc[],
}

export type UpdateDoc = {
  granite: 1,
  publisher: Address,
  root: CID,
  prev?: CID,
  at: number,
}

export const addressPattern = /^0x[0-9a-f]{40}$/

export const isAddress = (value: unknown): value is Address => (
  typeof value === 'string' && addressPattern.test(value)
)

export const encode = (value: unknown): Uint8Array => (
  dagCbor.encode(value)
)

export const decode = (bytes: Uint8Array): unknown => (
  dagCbor.decode(bytes)
)

export const cidOf = async (bytes: Uint8Array): Promise<CID> => (
  CID.createV1(dagCbor.code, await sha256.digest(bytes))
)

const isPlainMap = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object'
  && value !== null
  && !Array.isArray(value)
  && !CID.asCID(value)
  && !(value instanceof Uint8Array)
)

const onlyKeys = (
  cid: string, field: string, value: Record<string, unknown>, allowed: string[],
) => {
  for(const key of Object.keys(value)) {
    if(!allowed.includes(key)) {
      throw new MalformedDocumentError(cid, `${field}.${key}`, 'unexpected key')
    }
  }
}

const asEdge = (cid: string, name: string, value: unknown): EdgeDoc => {
  if(!isPlainMap(value)) {
    throw new MalformedDocumentError(cid, `edges.${name}`, 'edge must be a map')
  }
  onlyKeys(cid, `edges.${name}`, value, ['props', 'child'])
  const child = CID.asCID(value.child)
  if(!child) {
    throw new MalformedDocumentError(cid, `edges.${name}.child`, 'must be a CID link')
  }
  if('props' in value && !isPlainMap(value.props)) {
    throw new MalformedDocumentError(cid, `edges.${name}.props`, 'must be a map')
  }
  return value as EdgeDoc
}

const asNodeMount = (cid: string, index: number, value: unknown): NodeMountDoc => {
  const field = `mounts[${index}]`
  if(!isPlainMap(value)) {
    throw new MalformedDocumentError(cid, field, 'mount must be a map')
  }
  onlyKeys(cid, field, value, ['source', 'path', 'order'])
  const source = CID.asCID(value.source) ?? value.source
  if(!CID.asCID(source) && !isAddress(source)) {
    throw new MalformedDocumentError(
      cid, `${field}.source`, 'must be a CID link or lowercase 0x address',
    )
  }
  if('path' in value) {
    if(!isAddress(source)) {
      throw new MalformedDocumentError(
        cid, `${field}.path`, 'path mounts require an address source (Spot → Spot is live)',
      )
    }
    if(typeof value.path !== 'string') {
      throw new MalformedDocumentError(cid, `${field}.path`, 'must be a string')
    }
    try {
      splitPath(value.path)
    } catch {
      throw new MalformedDocumentError(cid, `${field}.path`, 'must be a valid /-separated path')
    }
  }
  if(!Number.isInteger(value.order)) {
    throw new MalformedDocumentError(cid, `${field}.order`, 'must be an integer')
  }
  return value as NodeMountDoc
}

export const asNode = (cid: CID, value: unknown): NodeDoc => {
  const id = cid.toString()
  if(!isPlainMap(value)) {
    throw new MalformedDocumentError(id, '(document)', 'node must be a map')
  }
  onlyKeys(id, '(document)', value, ['data', 'edges', 'mounts'])
  if('data' in value && !isPlainMap(value.data)) {
    throw new MalformedDocumentError(id, 'data', 'must be a map')
  }
  const edges: Record<string, EdgeDoc> = {}
  if('edges' in value) {
    if(!isPlainMap(value.edges)) {
      throw new MalformedDocumentError(id, 'edges', 'must be a map of name → edge')
    }
    for(const [name, edge] of Object.entries(value.edges)) {
      if(name === '' || name.includes('/')) {
        throw new MalformedDocumentError(
          id, `edges.${name}`, 'edge names must be non-empty and must not contain "/"',
        )
      }
      edges[name] = asEdge(id, name, edge)
    }
  }
  const mounts: NodeMountDoc[] = []
  if('mounts' in value) {
    if(!Array.isArray(value.mounts)) {
      throw new MalformedDocumentError(id, 'mounts', 'must be an array')
    }
    value.mounts.forEach((mount, index) => {
      mounts.push(asNodeMount(id, index, mount))
    })
  }
  return {
    ...(value.data === undefined ? {} : { data: value.data as Record<string, unknown> }),
    edges,
    mounts,
  }
}

export const asUpdate = (cid: CID, value: unknown): UpdateDoc => {
  const id = cid.toString()
  if(!isPlainMap(value)) {
    throw new MalformedDocumentError(id, '(document)', 'update must be a map')
  }
  onlyKeys(id, '(document)', value, ['granite', 'publisher', 'root', 'prev', 'at'])
  if(value.granite !== 1) {
    throw new MalformedDocumentError(id, 'granite', 'format version must be 1')
  }
  if(!isAddress(value.publisher)) {
    throw new MalformedDocumentError(id, 'publisher', 'must be a lowercase 0x address')
  }
  if(!CID.asCID(value.root)) {
    throw new MalformedDocumentError(id, 'root', 'must be a CID link')
  }
  if('prev' in value) {
    if(value.prev === null || !CID.asCID(value.prev)) {
      throw new MalformedDocumentError(id, 'prev', 'must be absent (not null) or a CID link')
    }
  }
  if(!Number.isInteger(value.at)) {
    throw new MalformedDocumentError(id, 'at', 'must be an integer unix timestamp')
  }
  return value as unknown as UpdateDoc
}

export const splitPath = (path: string): string[] => {
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  if(trimmed === '') {
    return []
  }
  const segments = trimmed.split('/')
  for(const segment of segments) {
    if(segment === '') {
      throw new TypeError(`empty segment in path: ${path}`)
    }
  }
  return segments
}

export const joinPath = (segments: string[]): string => (
  `/${segments.join('/')}`
)

export { CID }
