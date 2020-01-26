import React, { useState } from 'react'
import { Button, Alert, Input } from 'antd'
import useIPFSFactory from './useIPFSFactory'
import { debounce } from 'lodash'
import { useDB } from 'react-pouchdb'

export default (props) => {
  let count = 0  // total number imported
  let queue = [] // objects to insert
  // queue is currently unbounded b/c indexDb is choking on successive puts
  const MAX_SIZE = Number.MAX_SAFE_INTEGER // size of a bulk post
  const { ipfs } = useIPFSFactory({ commands: ['id', 'ls', 'get'] })
  const [message, setMessage] = useState(null)
  const [key, setKey] = useState(props.hash)
  const defText = 'Parse:'
  const [text, setText] = useState(defText)
  const db = useDB()

  const log = debounce(setMessage, 100)

  const enque = (obj) => {
    queue.push(obj)
    log(`Queued ${count} (${queue.length}): ${obj.type}: ${obj._id}`)
    console.log(`Queued ${queue.length}: ${obj}`)
  }

  const processList = (list, path) => (
    Promise.allSettled(
      list.map((entry) => {
        const fullpath = [...path, entry.name]
        const name = fullpath.join('/')

        switch(entry.type) {
        case 'dir':
          log(`Dir: "${name}/": Recursing`)
          return listFiles(entry.hash, fullpath)
        case 'file':
          log(`Adding File: ${entry.name}`)
          return enque(fullpath)
          .catch((err) => {
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

  const listFiles = (key, path = []) => (
    ipfs.ls(key)
    .then(async (list) => {
      if(path.length === 0) path.push(key) // the root

      await processList(list, path)
    })
  )

  const startWith = async (hash) => {
    setText('Loading:')

    const files = await listFiles(hash)

    console.log('Queued:', [...queue])

    const entries = await Promise.allSettled(
      queue.map((file) => {
        const filename = file.join('/')
        log(`Loading: ${filename}`)
        return ipfs.cat(filename)
        .then((data) => JSON.parse(data))
        .then((entries) => {
          log(`Loaded: ${entries.length} entries`)
          return entries
        })
      })
    )
    .then(out => out.map(d => d.value))
    .then(data => data.flat())

    log(`Got: ${entries.length} Entries: Writing…`)

    await db.bulkDocs(entries)

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
      style={{width: '55ex'}}
    />
    {message && <Alert message={message}/>}
  </React.Fragment>
}