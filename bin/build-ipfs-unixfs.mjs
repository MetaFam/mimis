#!/usr/bin/env node

import { create as ipfsClient } from 'kubo-rpc-client'
import { prepare, encode, code as pbCode } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import { CarWriter } from '@ipld/car'
import { Readable } from 'node:stream'
import fs from 'node:fs/promises'

const max = 25
const ipfs = ipfsClient('http://localhost:5001')
const genCAR = true
const doInsert = false
const outFile = await fs.open('output.car', 'w')

try {
  const links = [], blocks = []

  for(const i of Array.from({ length: max }).map((_, i) => (i + 1))) {
    const content = `Hello, ${i} World!`
    const file = new UnixFS({
      type: 'raw',
      data: new TextEncoder().encode(content),
      hashType: BigInt(sha256.code),
      // mtime: new Date(),
      mode: 0o644,
    })
    const fileNode = prepare({ Data: file.marshal(), Links: [] })
    const fileBytes = encode(fileNode)
    let cid
    if(doInsert) {
      cid = await ipfs.block.put(fileBytes, { format: 'dag-pb' })
    }
    if(!cid) {
      const hash = await sha256.digest(fileBytes)
      cid = CID.createV1(pbCode, hash)
    }
    blocks.push({ bytes: fileBytes, cid })
    links.push({ Hash: cid, Name: `hello #${i}.txt`, Tsize: Number(file.fileSize()) })
  }

  const dir = new UnixFS({
    type: 'directory',
    // mtime: new Date(),
    mode: 0o755,  
  })
  const dirNode = (
    prepare({
      Data: dir.marshal(),
      Links: links,
    })
  )
  const dirBytes = encode(dirNode)
  let cid
  if(doInsert) {
    cid = await ipfs.block.put(dirBytes, { format: 'dag-pb' })
  }
  if(!cid) {
    const hash = await sha256.digest(dirBytes)
    cid = CID.createV1(pbCode, hash)
  }
  blocks.push({ bytes: dirBytes, cid })

  if(genCAR) {
    const { writer, out } = await CarWriter.create([cid])
    const writeable = outFile.createWriteStream()
    
    const readable = Readable.from(out)
    const writePromise = new Promise((resolve, reject) => {
      writeable.on('finish', resolve)
      writeable.on('error', reject)
    })
    readable.pipe(writeable)

    for (const block of blocks) {
      await writer.put(block)
    }

    console.debug({ Close: await writer.close() })
    await writePromise
    await outFile.close()
  }

  console.info(`Final CID: ${cid}`)
} catch(error) {
  console.error(`Error: ${error.message}`)
  console.error(error.stack)
}
