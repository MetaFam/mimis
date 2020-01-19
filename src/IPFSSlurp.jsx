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
      return Promise.resolve(null)
    }
  }

  const listDir = (key, path = [], promises = []) => {
    return ipfs.ls(key)
    .then((list) => {
      console.log('listDir', path)

      if(path.length === 0) path.push(key) // the root

      const dir = path.join('/')
      const parent = path.slice(-1)[0]
      const keys = list.map(e => e.path)
      if(keys.includes(`${key}/${parent}.txt`)) { // Gutenberg content dir
        console.log('Content', dir)
        promises.push(enque({
          _id: dir,
          type: 'dir',
          path: path,
          ipfs_id: key,
        }))
        listDir(key, [], promises)
      } else {
        list.forEach(async (entry) => {
          const name = `${path.join('/')}/${entry.name}`
          const fullpath = [...path, entry.name]
          switch(entry.type) {
            case 'dir':
              log(`Dir: "${name}": Recursing`)
              listDir(entry.hash, fullpath, promises)
              break
            case 'file':
              try {
                log(`Adding File: ${entry.name}`)
                promises.push(enque({
                  _id: fullpath.join('/'),
                  type: 'file',
                  path: fullpath,
                  ipfs_id: entry.hash,
                }))
              } catch(err) {
                if(err.status === 409) {
                  console.warn('Conflict', err)
                } else {
                  console.error(err)
                }
              }
              log(`Added: "${name}": ${entry.hash}`)
              break
            default:
              promises.push(ipfs.block.get(entry.hash)
                .then((block) => {
                  if(block.data[0] === 10) {
                    log(`ToDo: Link: "${name}": ${block.data.slice(6)}`)
                  } else {
                    const msg = `Unknown: "${name}":`
                    console.error(msg, block)
                    log(msg)
                  }
                })
              )
              break
          }
        })
      }
    })
  }

  const startWith = async (hash) => {
    setText('Loading:')
    console.log(1)
    let promises = []
    listDir(hash, [], promises)
    console.log(2, promises)
    promises.push(flushQueue())
    console.log(3)
    await Promise.allSettled(promises)
    setText('Loaded:')
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