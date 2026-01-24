import type { Version } from 'multiformats'
import { create as ipfsFactory } from 'kubo-rpc-client'
import settings from '$lib/settings.svelte.ts'

export interface Spot {
  cid: string
  title: string
  type: string
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
  const url = settings.ipfsAPI.replace(/\/+$/, '')
  if(settings.debugging) console.debug({ 'IPFS API URL': url })
  const ipfs = ipfsFactory(url)
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
