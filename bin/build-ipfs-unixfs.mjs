#!/usr/bin/env node

import { create as ipfsClient } from 'kubo-rpc-client'
import { prepare, encode } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { sha256 } from 'multiformats/hashes/sha2'

const max = 25
const ipfs = ipfsClient('http://localhost:5001')

try {
  const links = []

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
    const start = await ipfs.block.put(fileBytes, { format: 'dag-pb' })
    links.push({ Hash: start, Name: `hello #${i}.txt`, Tsize: Number(file.fileSize()) })
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
  const final  = await ipfs.block.put(dirBytes, { format: 'dag-pb' })
  console.info(`Final CID: ${final}`)
} catch(error) {
  console.error(`Error: ${error.message}`)
  console.error(error.stack)
}
