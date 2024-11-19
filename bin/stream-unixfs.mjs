#!/usr/bin/env node

import { CarWriter } from '@ipld/car'
import * as UnixFS from '@ipld/unixfs'
import * as Rabin from '@ipld/unixfs/file/chunker/rabin'
import * as Trickle from '@ipld/unixfs/file/layout/trickle'
import * as RawLeaf from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import fs from 'node:fs/promises'

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

const saveBlobToFile = async (blob, filename) => {
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fs.writeFile(filename, buffer)
}

const main = async () => {
  console.info('Starting CAR Creation…')

  const {
    readable: transformReadable,
    writable: transformWritable,
  } = new TransformStream()
  const unixFSWriter = UnixFS.createWriter({
    writable: transformWritable,
    settings: {
      fileChunker: await Rabin.create(),
      fileLayout: Trickle.configure({ maxDirectLeaves: 100 }),
      fileChunkEncoder: RawLeaf,
      smallFileEncoder: RawLeaf,
      fileEncoder: UnixFS,
      hasher: sha256,
    },
  })

  console.info('Created UnixFS Writer…')

  const dir = UnixFS.createDirectoryWriter(unixFSWriter)

  const range = [...Array(10).keys()].map((i) => (i + 1))

  console.info({ 'Iterating Over': range })

  for(const i of range) {
    console.info(`Writing hello #${i}…`)
    const content = `Hello, ${i} World!`
    const file = UnixFS.createFileWriter(unixFSWriter)
    file.write(new TextEncoder().encode(content))
    console.info(`Wrote Content: ${content}`)
    const { cid } = await file.close()
    console.debug({ cid })
    const name = `hello #${i}.txt`
    dir.set(name, cid)
    console.info(`Wrote ${name} with CID ${cid}.`)
  }
  const root = await dir.close()
  await unixFSWriter.close()

  const car = encodeCAR(transformReadable, root)
  const blob = await streamToBlob(
    car, 'application/vnd.ipld.car',
  )
  const filename = 'output.car'
  await saveBlobToFile(blob, filename)

  console.info(`CAR file written to ${filename}.`)
  console.info({ 'Final CID': root })

  return root.cid
}

main()
.then((cid) => console.debug({ Got: cid }))
.catch((error) => {
  console.error(`Error: ${error.message}`)
  console.error(error.stack)
})
