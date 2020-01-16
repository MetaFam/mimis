import React from 'react'
import { Button } from 'antd'
import useIPFSFactory from './useIPFSFactory'
import { isEqual } from 'lodash'

export default () => {
  const { ipfs, ipfsInitError } = useIPFSFactory({ commands: ['id', 'ls', 'get'] })

  const listDir = async (key, path = []) => {
    const list = await ipfs.ls(key)
    list.forEach(async (entry) => {
      const name = `${path.join('/')}/${entry.name}`
      switch(entry.type) {
        case 'dir':
          console.log(`Dir: "${name}": Recursing`)
          listDir(`${key}/${entry.name}`, [...path, entry.name])
          break
        case 'file':
          console.log(`File: "${name}": ${entry.hash}`)
          break
        default:
          const block = await ipfs.block.get(entry.hash)
          if(block.data[0] === 10) {
            console.log(`Link: "${name}": ${block.data.slice(6)}`)
          } else {
            console.log(`Unknown: "${name}": ${block.data}`)
          }
          break
      }
    })
  }

  const key = 'QmZ19Nu2sC7WXrczA4wyo7jGbGZr1p9jyxm1SNpTLZUuH2'

  return <Button type='primary' onClick={() => listDir(key)}>Intake Dir</Button>
}