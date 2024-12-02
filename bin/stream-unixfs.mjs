#!/usr/bin/env node

import { CarWriter } from '@ipld/car'
import * as UnixFS from '@ipld/unixfs'
import * as Rabin from '@ipld/unixfs/file/chunker/rabin'
import * as Trickle from '@ipld/unixfs/file/layout/trickle'
import { CAREncoderStream } from 'ipfs-car'
import * as RawLeaf from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import fs from 'node:fs'

export const UnixFSLeaf = {
  code: UnixFS.code,
  name: UnixFS.name,
  encode: UnixFS.encodeFileChunk,
}

export const UnixFSRawLeaf = {
  code: UnixFS.code,
  name: UnixFS.name,
  encode: UnixFS.encodeRaw,
}


const EMPTY_CID = (
  'bafybeif7ztnhq65lumvvtr4ekcwd2ifwgm3awq4zfr3srh462rwyinlb4y'
)

console.info('Main: Starting CAR Creation…')

const {
  readable: transformReadable,
  writable: transformWritable,
} = new TransformStream()
const unixFSWriter = UnixFS.createWriter({
  writable: transformWritable,
  settings: {
    chunker: await Rabin.create(),
    fileLayout: Trickle.configure({ maxDirectLeaves: 100 }),
    // fileChunkEncoder: RawLeaf,
    // smallFileEncoder: RawLeaf,
    fileEncoder: UnixFS,
    hasher: sha256,
  },
})

console.info('Main: Created UnixFS Writer…')

const blocks = []
transformReadable.pipeTo(new WritableStream({
  write(chunk) { blocks.push(chunk) },
}))

console.info('Main: Created Transform Readable…')

const dir = UnixFS.createDirectoryWriter(unixFSWriter)

const range = [...Array(10).keys()].map((i) => (i + 1))

console.info({ 'Main: Iterating Over': range })

for(const i of range) {
  console.info(`Main: Writing hello #${i}…`)
  const content = `Hello, ${i} World!`
  const file = UnixFS.createFileWriter(unixFSWriter)
  await file.write(new TextEncoder().encode(content))
  console.info(`Main: Wrote Content: ${content}`)
  const link = await file.close()
  console.debug({ link })
  console.debug({ 'Main: CID': link.cid })
  const name = `hello #${i}.txt`
  dir.set(name, link)
  console.info(`Main: Wrote ${name} with CID ${link.cid}.`)
}
const root = await dir.close()
await unixFSWriter.ready
await unixFSWriter.close()

console.info({ 'Final CID': root })

const blockStream = new ReadableStream({
  pull(controller) {
    if(blocks.length > 0) {
      controller.enqueue(blocks.shift())
    } else {
      controller.close()
    }
  }
})

const filename = 'stream.car'
const car = fs.createWriteStream(filename)
await (
  blockStream
  .pipeThrough(new CAREncoderStream([root.cid]))
  .pipeTo(new WritableStream({
    write(chunk) { car.write(chunk) },
    close() { car.end() },
  }))
)

console.info(`Main: Created CAR File: ${filename}`)
