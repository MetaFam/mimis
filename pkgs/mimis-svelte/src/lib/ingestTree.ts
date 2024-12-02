import { CarWriter } from '@ipld/car'
import * as UnixFS from '@ipld/unixfs'
import * as Rabin from '@ipld/unixfs/file/chunker/rabin'
import * as Trickle from '@ipld/unixfs/file/layout/trickle'
import { CAREncoderStream } from 'ipfs-car'
import * as RawLeaf from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import type { Node } from '../types'
import type { CID } from 'multiformats'
import type { WunderbaumNode } from 'wb_node'

// export const UnixFSLeaf = {
//   code: UnixFS.code,
//   name: UnixFS.name,
//   encode: UnixFS.encodeFileChunk,
// }

// export const UnixFSRawLeaf = {
//   code: UnixFS.code,
//   name: UnixFS.name,
//   encode: UnixFS.encodeRaw,
// }

export const ingestTree = async (
  { root, selected, onStatusUpdate }:
  {
    root: WunderbaumNode
    onStatusUpdate: (m: string) => void
  }
) => {
  const {
    readable: unixfsReadable,
    writable: unixfsWritable,
  } = new TransformStream()
  type Writer = UnixFS.View & { ready: Promise<void> }
  const writer = UnixFS.createWriter({
    writable: unixfsWritable,
    settings: {
      chunker: await Rabin.create(),
    //   fileLayout: Trickle.configure({ maxDirectLeaves: 100 }),
    //   fileChunkEncoder: UnixFSLeaf,
    //   smallFileEncoder: UnixFSLeaf,
    //   fileEncoder: UnixFS,
    //   hasher: sha256,
    } as UnixFS.EncoderSettings,
  }) as Writer

  type Block = {
    cid: CID
    bytes: Uint8Array
  }
  const blocks: Array<Block> = []
  unixfsReadable.pipeTo(new WritableStream({
    write(block) { blocks.push(block) },
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

  if(!blocks || blocks.length === 0) {
    throw new Error('No blocks generated.')
  }

  const rootBlock = blocks.at(-1)
  if(!rootBlock) {
    throw new Error('No root block found.')
  }

  type Chunk = Uint8Array
  const chunks: Array<Chunk> = []
  await (
    blockStream
    .pipeThrough(new CAREncoderStream([rootBlock.cid]))
    .pipeTo(new WritableStream({
      write(chunk) { chunks.push(chunk) },
    }))
  )

  return URL.createObjectURL(new Blob(chunks))

  async function ingest(node: WunderbaumNode) {
    onStatusUpdate?.(`Ingesting Directory: ${node.title}`)
    if(!node.children) {
      throw new Error(`Not A Directory: ${node.title}`)
    }
    const dir = writer.createDirectoryWriter()
    for(const child of node.children) {
      if(!child.selected && child.getSelectedNodes().length === 0) {
        continue
      }

      if(!!child.children) {
        await writer.ready
        dir.set(child.title, await ingest(child))
      } else {
        const file = writer.createFileWriter()
        const handle = await child.data.handle?.getFile()
        if(!handle) {
          throw new Error(
            `Invalid File Handle: ${child.title}`
          )
        }
        onStatusUpdate?.(`Ingesting File: ${child.title}`)
        await handle.stream().pipeTo(new WritableStream({
          async write(chunk) {
            await writer.ready
            await file.write(chunk)
          },
        }))
        const link = await file.close()
        await writer.ready
        dir.set(child.title, link)
      }
    }
    return dir.close()
  }
}