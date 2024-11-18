#!/usr/bin/env node

import { create as ipfsClient } from 'kubo-rpc-client'
import * as dagPB from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { names } from 'multihashes'

const ipfs = ipfsClient('http://localhost:5001')

try {
  const content = '¡Hello, World!'
  const file = new UnixFS({
    type: 'file',
    data: (
      typeof content === 'string' ? (
        new TextEncoder().encode(content)
      ) : (content)
    ),
    hashType: names['sha2-256'],
    mode: 0o644,
    mtime: new Date(),
  })
  const fileNode = dagPB.prepare({
    Data: file.marshal(),
    Links: [],
  })
  console.debug({ marshal: file.marshal(), file, fileNode })
  const fileBytes = dagPB.encode(fileNode)
  const start = {
    one: await ipfs.block.put(file.marshal(), { format: 'dag-pb' }),
    two: await ipfs.block.put(fileBytes, { format: 'dag-pb' }),
    tre: (await ipfs.add(fileBytes, { cidVersion: 1 })).cid,
  }

  console.debug({ start })

  const dir = new UnixFS({
    type: 'directory',
    hashType: names['sha2-256'],
    mode: 0o755,
    mtime: new Date(),
    // blockSizes: [file.fileSize()],
  })
  console.debug({ fileSize: file.fileSize(), length: file.data.length })
  const dirNode = (
    dagPB.prepare({
      Data: dir.marshal(),
      Links: [{
        Hash: start.tre, Name: 'hello.txt', Tsize: Number(file.fileSize()),
      }],
    })
  )
  console.dir({ dirNode }, { depth: 4 })
  const dirBytes = dagPB.encode(dirNode)
  const final  = await ipfs.block.put(dirBytes, { format: 'dag-pb', cidVersion: 1 })
  console.info(`Final CID: ${final.toString()}`)
} catch(error) {
  console.error(`Error: ${error.message}`)
  console.error(error.stack)
}
