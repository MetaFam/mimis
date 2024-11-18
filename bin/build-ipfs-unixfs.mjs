#!/usr/bin/env node

import { create as ipfsClient } from 'kubo-rpc-client'
import { prepare, encode } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { sha256 } from 'multiformats/hashes/sha2'

const ipfs = ipfsClient('http://localhost:5001')

try {
  const content = 'Hello, World!'
  const file = new UnixFS({
    type: 'file',
    data: (
      typeof content === 'string' ? (new TextEncoder().encode(content)) : (content)
    ),
    hashType: BigInt(sha256.code),
    mtime: new Date(),
    mode: 0o644,
  })
  const fileNode = prepare({ Data: encode(file.data), Links: [] })
  console.debug({ file, fileNode })
  const fileBytes = encode(fileNode)
  const start = await ipfs.block.put(fileBytes, { format: 'dag-pb' })
  console.info(`Start CID: ${start.toString()}`)

  const dir = new UnixFS({
    type: 'directory',
    mtime: new Date(),
    mode: 0o755,  
  })
  const dirNode = (
    prepare({
      Data: dir.marshal(),
      Links: [{ Hash: start, Name: 'hello.txt', Tsize: Number(file.fileSize()) }],
    })
  )
  const dirBytes = encode(dirNode)
  const final  = await ipfs.add(dirBytes, { format: 'dag-pb' })
  console.info(`Final CID: ${final.cid.toString()}`)
} catch(error) {
  console.error(`Error: ${error.message}`)
  console.error(error.stack)
}
