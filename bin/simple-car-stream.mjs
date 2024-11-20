#!/usr/bin/env node

import { createFileEncoderStream, CAREncoderStream } from 'ipfs-car'
import fs from 'fs/promises'

const file = new Blob(['¡Hello `ipfs-car`!'])
const blocks = []

await createFileEncoderStream(file)
  .pipeTo(new WritableStream({
    write(b) { blocks.push(b) },
  }))

const rootCID = blocks.at(-1).cid
const blockStream = new ReadableStream({
  pull(controller) {
    if(blocks.length > 0) {
      controller.enqueue(blocks.shift())
    } else {
      controller.close()
    }
  }
})
const chunks = []
await (
  blockStream
  .pipeThrough(new CAREncoderStream([rootCID]))
  .pipeTo(new WritableStream({
    write(chunk) { chunks.push(chunk) },
  }))
)

const blob = new Blob(chunks)
const filename = 'simple.car'
await fs.writeFile(
  filename,
  new Uint8Array(await blob.arrayBuffer())
)

console.info(`Wrote ipfs://${rootCID} to ${filename}.`)