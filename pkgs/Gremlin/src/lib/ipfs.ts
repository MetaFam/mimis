import type { Version } from 'multiformats'
import { create as ipfsFactory } from 'kubo-rpc-client'
import { CAREncoderStream } from 'ipfs-car'
import settings from '$lib/settings.svelte.ts'

export interface Spot {
  cid: string
  title: string
  type: string
}

export function getIPFS() {
  const url = settings.ipfsAPI.replace(/\/+$/, '')
  if(settings.debugging) console.debug({ 'IPFS API URL': url })
  return ipfsFactory(url)
}

export async function kuboUpload(
  { files, progress }:
  { files: Array<File>, progress?: (bytes: number) => void }
) {
  const options = {
    chunker: 'rabin',
    cidVersion: 1 as Version,
    progress,
    timeout: 60_000,
  }
  const total = (
    files.reduce((acc: number, { size }: File) => acc + size, 0)
  )
  if(settings.debugging) {
    console.debug({ Adding: files, 'Total Size': total, options })
  }
  const infos: Array<Spot> = []
  let idx = 0
  const ipfs = getIPFS()
  for await (const { cid } of ipfs.addAll(files, options)) {
    if(settings.debugging) {
      console.debug({ 'Added Local': { cid, file: files[idx].name } })
    }
    infos.push({
      cid: cid.toString(),
      title: (
        files[idx].name.replace(/\.[^.]*$/, '')
      ),
      type: files[idx].type,
    })
    idx++
  }
  return infos
}

export async function blocksToCAR(
  blocks: Array<Block>,
  { log = null }: { log?: Logger } = {}
) {
  log?.('Generating CAR URL…')

  const blks = [...blocks]
  const blockStream = new ReadableStream({
    pull(controller) {
      if(blks.length > 0) {
        controller.enqueue(blks.shift())
      } else {
        controller.close()
      }
    }
  })

  if(!blks || blks.length === 0) {
    throw new Error('No blocks generated.')
  }

  const rootBlock = blks.at(-1)
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

  return {
    url: URL.createObjectURL(new Blob(chunks)),
    cid: rootBlock.cid,
  }
}
