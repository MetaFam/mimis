#!/usr/bin/env node

/* eslint-disable no-console */

// Take a .car file and dump its contents into one file per block, with the
// filename being the CID of that block.
// Also prints a DAG-JSON form of the block and its CID to stdout.
// If `--inspect` is supplied, don't write the blocks, just print them to stdout.

import fs from 'node:fs'
import { CarBlockIterator } from '@ipld/car/iterator'


if (!process.argv[2]) {
  console.log('Usage: dump-car.js [--inspect] <path/to/car>')
  process.exit(1)
}

const codecs = {}

const decoders = [
  '@ipld/dag-cbor',
  '@ipld/dag-json',
  '@ipld/dag-pb',
  'multiformats/codecs/json',
  'multiformats/codecs/raw',
]

async function decode(cid, bytes) {
  while(!codecs[cid.code] && decoders.length > 0) {
    const codec = decoders.shift()
    try {
      const { code, decode, name } = await import(codec)
      codecs[code] = { name, decode, lib: codec }
      console.debug(`Imported ${codec} as ${name}.`)
    } catch (e) {
      console.error(`Failed to import ${codec}: ${e.message}`)
    }
  }
  if(!codecs[cid.code]) {
    throw new Error(`Unknown codec code: 0x${cid.code.toString(16)}`)
  }
  return codecs[cid.code].decode(bytes)
}

async function run() {
  const inspect = process.argv.includes('--inspect')
  const files = process.argv.filter((a) => (a !== '--inspect')).slice(2)
  for(let filename of files) {
    const inStream = fs.createReadStream(filename)
    const reader = await CarBlockIterator.fromIterable(inStream)
    console.log(`Version: ${reader.version}`)
    const roots = (
      (await reader.getRoots()).map((r) => (r.toString())).join(', ')
    )
    console.log(`Roots: [${roots}]`)
    console.log('Blocks:')
    let i = 1
    for await (const { cid, bytes } of reader) {
      if (!inspect) {
        await fs.promises.writeFile(cid.toString(), bytes)
      }

      const decoded = await decode(cid, bytes)
      console.log(`#${i++} ${cid} [${codecs[cid.code].name}]`)
      console.dir({ decoded }, { depth: null })
    }
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
