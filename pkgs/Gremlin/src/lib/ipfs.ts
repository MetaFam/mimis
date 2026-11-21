import type { Version } from 'multiformats'
import { create as ipfsFactory } from 'kubo-rpc-client'
import { addFiles as filesToSpot } from '#lib/remotes/addFiles.remote.js'
import settings from '#lib/settings.svelte.js'

export interface Spot {
  cid: string
  title: string
  type: string
}

export function getIPFS() {
  const url = settings.ipfsAPI.replace(/\/+$/, '')
  return ipfsFactory(url)
}

export async function kuboUpload(
  { files, progress }:
  { files: Array<File>, progress?: (bytes: number) => void }
) {
  const options = {
    chunker: 'buzhash',
    cidVersion: 1 as Version,
    progress,
    timeout: settings.ipfsTimeout,
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

export async function addFiles(
  { files, path }: {
  files: Array<File>,
  path: Array<string>,
}) {
  const cids = await kuboUpload({ files }) as Array<Spot>
  const entries = cids.map((entry, idx) => {
    if(entry.cid == null) throw new Error('No CID.')
    const { name, size } = files[idx]
    return { ...entry, cid: entry.cid, name, size }
  })
  if(settings.debugging) console.debug({ entries, path } )
  return await filesToSpot({ path, files: entries })
}
