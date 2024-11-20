#!/usr/bin/env node

import { CarWriter } from '@ipld/car'
import * as UnixFS from '@ipld/unixfs'
import * as Rabin from '@ipld/unixfs/file/chunker/rabin'
import * as Trickle from '@ipld/unixfs/file/layout/trickle'
import { CAREncoderStream } from 'ipfs-car'
import * as RawLeaf from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import fs from 'node:fs'
import { Writable } from 'node:stream'

const EMPTY_CID = (
  'bafybeif7ztnhq65lumvvtr4ekcwd2ifwgm3awq4zfr3srh462rwyinlb4y'
)

const iterate = async function* (stream) {
  const reader = stream.getReader()
  for(;;) {
    const next = await reader.read()
    if(next.done) {
      return
    } else {
      yield next.value
    }
  }
}

const pipe = async (source, writer) => {
  for await (const item of source) {
    writer.write(item)
  }
  return await writer.close()
}

const encodeCAR = (blocks, rootCID) => {
  const { writer, out } = CarWriter.create([rootCID])
  pipe(iterate(blocks), {
    write: ({ cid, bytes }) => writer.put({ cid, bytes }),
    close: () => writer.close(),
  })
  return out
}

const streamToBlob = async (
  stream, type = 'application/octet-stream',
) => {
  const chunks = []
  const reader = stream.getReader()

  try {
    for(;;) {
      const { done, value } = await reader.read()
      if(done) break
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const length = chunks.reduce(
    (total, chunk) => total + chunk.length, 0,
  )
  const concatenated = new Uint8Array(length)

  let offset = 0
  for(const chunk of chunks) {
    concatenated.set(chunk, offset)
    offset += chunk.length
  }

  return new Blob([concatenated], { type })
}

const buildCAR = async (blocks, rootCID, filename) => {
  const car = encodeCAR(transformReadable, EMPTY_CID)
  const blob = await streamToBlob(
    car, 'application/vnd.ipld.car',
  )
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fs.promises.writeFile(filename, buffer)
  console.info(`CAR file written to ${filename}.`)
}


const main = async () => {
  console.info('Main: Starting CAR Creation…')

  const {
    readable: transformReadable,
    writable: transformWritable,
  } = new TransformStream()
  const unixFSWriter = UnixFS.createWriter({
    writable: transformWritable,
    settings: {
      fileChunker: await Rabin.create(),
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

  return root.cid
}

main()
.then((cid) => console.debug({ Got: cid }))
.catch((error) => {
  console.error(`Error: ${error.message}`)
  console.error(error.stack)
})
