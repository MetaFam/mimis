import React, { useState } from 'react'
import { Button, Alert, Input } from 'antd'
import useIPFSFactory from './useIPFSFactory'
import { debounce } from 'lodash'
import { useDB } from 'react-pouchdb'

export default () => {
  const { ipfs } = useIPFSFactory({ commands: ['id', 'ls', 'get'] })
  const [message, setMessage] = useState(null)
  const [key, setKey] = useState('QmVm1ySxJSAgGAeKfeJbUs1LMZNXuzKCaNRQqyvyPDgpQb')
  const defText = 'Intake:'
  const [text, setText] = useState(defText)
  const db = useDB()

  const log = debounce(
    (msg) => setMessage(msg),
    50
  )

  let queue = [] // objects to insert
  const MAX_SIZE = 50000 // size of a bulk post
  const flushQueue = () => {
    const copy = [...queue]
    queue = []
    return db.bulkDocs(copy)
  }
  const enque = (obj) => {
    queue.push(obj)
    if(queue.length >= MAX_SIZE) {
      return flushQueue()
    } else {
      return Promise.resolve()
    }
  }

  const processList = (list, path) => (
    Promise.allSettled(
      list.map((entry) => {
        const fullpath = [...path, entry.name]
        const name = fullpath.join('/')

        switch(entry.type) {
        case 'dir':
          log(`Dir: "${name}": Recursing`)
          return listDir(entry.hash, fullpath)
        case 'file':
          log(`Adding File: ${entry.name}`)
          return enque({
            _id: fullpath.join('/'), type: 'file',
            path: fullpath, ipfs_id: entry.hash,
          }).catch((err) => {
            if(err.status === 409) {
              console.warn('Conflict', err)
            } else {
              console.error(err)
            }
          })
        default:
          return ipfs.block.get(entry.hash)
          .then((block) => {
            if(block.data[0] === 10) {
              log(`ToDo: Link: "${name}": ${block.data.slice(6)}`)
            } else {
              const msg = `Unknown: "${name}":`
              console.error(msg, block)
              log(msg)
            }
          })
        }
      })
    )
  )

  const listDir = (key, path = []) => (
    ipfs.ls(key)
    .then(async (list) => {
      console.log('listDir', path)

      if(path.length === 0) path.push(key) // the root

      const parent = path.slice(-1)[0]
      const keys = list.map(e => e.path)
      if(keys.includes(`${key}/${parent}.txt`)) { // Gutenberg content dir
        await enque({
          _id: path.join('/') + '/', type: 'dir',
          path: path, ipfs_id: key,
        })
        await listDir(key)
      } else {
        await processList(list, path)
      }
    })
  )

  const startWith = async (hash) => {
    setText('Loading:')
    console.log(1)
    await listDir(hash)
    console.log(2)
    await flushQueue()
    console.log(3)
    log('Done')
    setText(defText)
  }

  return <React.Fragment>
    <Button
      type='primary'
      onClick={() => startWith(key)}
      disabled={text !== defText}
    >{text}</Button>
    <Input
      value={key}
      onChange={evt => setKey(evt.target.value)}
      style={{width: '60ex'}}
    />
    {message && <Alert message={message}/>}
  </React.Fragment>
}