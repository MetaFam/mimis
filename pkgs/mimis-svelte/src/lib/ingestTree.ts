import { CarWriter } from '@ipld/car'
import * as UnixFS from '@ipld/unixfs'
import * as Rabin from '@ipld/unixfs/file/chunker/rabin'
import * as Trickle from '@ipld/unixfs/file/layout/trickle'
import { CAREncoderStream } from 'ipfs-car'
import * as RawLeaf from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import type { Node } from '../types'

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

export const ingestTree = async (
  { root, onStatusUpdate }:
  { root: Node, onStatusUpdate: (m: string) => void }
) => {
  const {
    readable: unixfsReadable,
    writable: unixfsWritable,
  } = new TransformStream()
  const writer = UnixFS.createWriter({
    writable: unixfsWritable,
    // settings: {
    //   chunker: await Rabin.create(),
    //   fileLayout: Trickle.configure({ maxDirectLeaves: 100 }),
    //   fileChunkEncoder: UnixFSLeaf,
    //   smallFileEncoder: UnixFSLeaf,
    //   fileEncoder: UnixFS,
    //   hasher: sha256,
    // },
  })
  const blocks = []
  unixfsReadable.pipeTo(new WritableStream({
    write(chunk) { blocks.push(chunk) },
  }))
  onStatusUpdate?.('Ingesting Tree…')
  await ingest(root)

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
    .pipeThrough(new CAREncoderStream([blocks.at(-1).cid]))
    .pipeTo(new WritableStream({
      write(chunk) { chunks.push(chunk) },
    }))
  )

  return {
    root,
    car: URL.createObjectURL(new Blob(chunks)),
  }

  async function ingest(node: Node) {
    onStatusUpdate?.(`Ingesting Directory: ${node.title}`)
    if(node.type !== 'directory') {
      throw new Error(`Not A Directory: ${node.title}`)
    }
    if(!node.children) {
      throw new Error(`No Children: ${node.title}`)
    }
    const dir = writer.createDirectoryWriter()
    for(const child of node.children) {
      if(child.type === 'directory') {
        await writer.ready
        dir.set(child.title, await ingest(child))
      } else {
        const file = writer.createFileWriter()
        const handle = await child.handle?.getFile()
        if(!handle) {
          throw new Error(
            `Invalid File Handle: ${child.title}`
          )
        }
        await writer.ready
        onStatusUpdate?.(`Ingesting File: ${child.title}`)
        await handle.stream().pipeTo(new WritableStream({
          async write(chunk) {
            await file.write(chunk)
          },
        }))
        const link = await file.close()
        child.cid = link.cid.toString()
        await writer.ready
        dir.set(child.title, link)
      }
    }
    await writer.ready
    const link = await dir.close()
    node.cid = link.cid.toString()
    return link
  }
}