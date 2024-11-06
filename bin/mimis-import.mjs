#!/usr/bin/env node

// import { create } from 'ipfs-core'
import { CarWriter as CARWriter } from '@ipld/car'
import { encode, code as dagCborCode } from '@ipld/dag-cbor'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { File } from 'node:buffer'
import fs from 'node:fs'
import { Readable } from 'node:stream'

const cidFor = async (bytes) => {
  const hash = await sha256.digest(bytes)
  return CID.create(1, dagCborCode, hash)
}

async function createTreeNode(name, children = []) {
  const nodeData = {
    name: name,
    Links: children,
  }

  const bytes = encode(nodeData)
  const cid = await cidFor(bytes)

  console.debug(`Created node ${name} with CID ${cid.toString()}`)

  return { cid, bytes }
}

async function writeWithPromise(out) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream('test.car')
    const readable = Readable.from(out)

    writeStream.on('finish', () => {
      console.log('Write completed')
      resolve()
    })
    writeStream.on('error', reject)
    readable.on('error', reject)

    readable.pipe(writeStream)
  })
}

async function createTree() {
  console.debug('Creating tree…')
  const leafs = [
    await createTreeNode(
      'leaf-1',
      [{
        name: 'README.md',
        Hash: await sha256.digest(
          await new File(fs.readFileSync('README.md'), 'README.md').bytes()
        ),
      }],
    ),
    await createTreeNode(
      'leaf-2',
      [{
        name: 'package.json',
        Hash: await sha256.digest(
          await new File(fs.readFileSync('package.json'), 'package.json').bytes()
        ),
      }],
),
  ]

  console.debug('Leafs created…')

  const branch = await createTreeNode('branch', [
    { Name: 'leaf-one', Hash: leafs[0].cid },
    { Name: 'leaf-two', Hash: leafs[1].cid },
  ])

  console.debug('Branch created…')

  const root = await createTreeNode('root', [
    { Name: 'branch', Hash: branch.cid },
  ])

  console.debug('Root created…')

  const { writer, out } = await (
    CARWriter.create([root.cid])
  )

  const output = writeWithPromise(out)

  console.debug('Writing:', { root }, '…')
  await writer.put(root)
  console.debug('Writer written…')
  await writer.put(branch)
  console.debug('Writer written…')
  await writer.put(leafs[0])
  console.debug('Writer written…')
  await writer.put(leafs[1])
  console.debug('Writer written…')

  await writer.close()

  console.debug('Writer closed…')

  await output

  console.debug(`CID: ${root.cid}`)

  return root.cid
}

async function main() {
  const rootCid = await createTree()
  console.info(`Root CID: ${rootCid.toString()}`)
}

main()
.then(() => console.log('Done.'))
.catch((err) => console.error({ msg: err.message }))
