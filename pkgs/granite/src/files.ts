import { createReadStream } from 'node:fs'
import { extname } from 'node:path'
import { create as createKubo } from 'kubo-rpc-client'
import type { CID } from './codec.ts'

export type Kubo = ReturnType<typeof createKubo>

export const kuboClient = (url: string): Kubo => (
  createKubo({ url })
)

// research.md R1: raw leaves keep leaf CIDs content-pure; Rabin's
// content-defined boundaries let partially changed files keep sharing
// their unchanged chunks (fixed-size chunking would shift every
// boundary after an insertion).
// pin: false — per-entry pinning costs ~¼s each in Kubo; the archive
// assembly takes one recursive pin on the finished update instead,
// covering the whole closure in a single pinset commit (SC-001).
const importOptions = {
  cidVersion: 1,
  rawLeaves: true,
  chunker: 'rabin',
  pin: false,
} as const

// One streamed RPC for the whole selection (SC-001: a thousand files
// must not mean a thousand round trips). Entries are keyed by index so
// no UnixFS wrapper directories are created server-side, and streams
// are lazy generators so only the part being serialized holds an open
// file descriptor.
export const importFiles = async (
  kubo: Kubo,
  paths: string[],
): Promise<Map<string, CID>> => {
  const source = paths.map((path, index) => ({
    path: String(index),
    content: (async function* () {
      yield* createReadStream(path)
    })(),
  }))
  const contents = new Map<string, CID>()
  for await(const added of kubo.addAll(source, importOptions)) {
    const index = Number(added.path)
    if(Number.isInteger(index) && paths[index] !== undefined) {
      contents.set(paths[index], added.cid)
    }
  }
  return contents
}

export const catFile = async (kubo: Kubo, content: CID): Promise<Uint8Array> => {
  const chunks: Uint8Array[] = []
  for await(const chunk of kubo.cat(content)) {
    chunks.push(chunk)
  }
  const bytes = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0))
  let offset = 0
  for(const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

const mimeTypes: Record<string, string> = {
  css: 'text/css',
  csv: 'text/csv',
  gif: 'image/gif',
  gz: 'application/gzip',
  html: 'text/html',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'text/javascript',
  json: 'application/json',
  md: 'text/markdown',
  mjs: 'text/javascript',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
  tar: 'application/x-tar',
  txt: 'text/plain',
  wasm: 'application/wasm',
  webm: 'video/webm',
  webp: 'image/webp',
  xml: 'application/xml',
  zip: 'application/zip',
}

export const mimeOf = (name: string): string | undefined => (
  mimeTypes[extname(name).slice(1).toLowerCase()]
)

// The file-leaf convention (contracts/archive.md): an ordinary Node whose
// data map carries the content link — no new document schema.
export const fileLeaf = (
  content: CID, size: number, name: string,
): Record<string, unknown> => {
  const type = mimeOf(name)
  return {
    content,
    size,
    ...(type ? { type } : {}),
  }
}
