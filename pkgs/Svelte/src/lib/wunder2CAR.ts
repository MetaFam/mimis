// import { CarWriter } from '@ipld/car'
import * as UnixFS from '@ipld/unixfs'
import * as Rabin from '@ipld/unixfs/file/chunker/rabin'
import { CAREncoderStream } from 'ipfs-car'
import * as RawLeaf from 'multiformats/codecs/raw'
// import * as Trickle from '@ipld/unixfs/file/layout/trickle'
import * as Balanced from '@ipld/unixfs/file/layout/balanced'
import { defaults as unixFSDefaults } from '@ipld/unixfs/file'
// import { sha256 } from 'multiformats/hashes/sha2'
import type { CID } from 'multiformats/cid'
import type { WunderbaumNode } from 'wb_node'
import type { Logger } from '../types'

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

export const wunder2CAR = async (
  { root, log }:
  {
    root: WunderbaumNode
    log: Logger
  }
) => {
  const {
    readable: unixfsReadable,
    writable: unixfsWritable,
  } = new TransformStream()
  type Writer = UnixFS.View & { ready: Promise<void> }
  const settings = unixFSDefaults()
  settings.chunker = await Rabin.create()
  settings.fileChunkEncoder = RawLeaf
  settings.smallFileEncoder = RawLeaf
  // fileLayout: Trickle.configure({ maxDirectLeaves: 100 }),
  // fileLayout: Balanced.withWidth(Balanced.defaults.width),
  const writer = UnixFS.createWriter({
    writable: unixfsWritable,
    settings,
  }) as Writer

  type Block = {
    cid: CID
    bytes: Uint8Array
  }
  const blocks: Array<Block> = []
  unixfsReadable.pipeTo(new WritableStream({
    write(block) { blocks.push(block) },
  }))
  log?.('Ingesting Tree…')
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
    log?.(`Ingesting Directory: ${node.title}`)
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
        log?.(`Ingesting File: ${child.title}`)
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