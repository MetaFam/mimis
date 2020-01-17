import React, { useState } from 'react'
import { Button, Alert, Input } from 'antd'
import useIPFSFactory from './useIPFSFactory'
import { debounce } from 'lodash'
import { useDB } from 'react-pouchdb'

export default () => {
  const { ipfs } = useIPFSFactory({ commands: ['id', 'ls', 'get'] })
  const [message, setMessage] = useState(null)
  const [key, setKey] = useState('QmWFWHYQg7mFvMtHaXHjXLFL4RKBQPef3L4iPJ4Eva2tQr')
  const defText = 'Intake:'
  const [text, setText] = useState(defText)
  const db = useDB()

  const log = debounce(
    (msg) => setMessage(msg),
    50
  )

  const startWith = async (hash) => {
    setText('Loading:')
    await listDir(hash)
    setText('Loaded:')
  }

  const listDir = async (key, path = []) => {
    const list = await ipfs.ls(key)

    if(path.length === 0) path.push(key) // the root

    list.forEach(async (entry) => {
      const name = `${path.join('/')}/${entry.name}`
      const fullpath = [...path, entry.name]
      switch(entry.type) {
        case 'dir':
          log(`Dir: "${name}": Recursing`)
          listDir(`${key}/${entry.name}`, fullpath)
          break
        case 'file':
          try {
            await db.post({
              _id: fullpath.join('/'),
              path: fullpath,
              ipfs_id: entry.hash,
            })
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
          const block = await ipfs.block.get(entry.hash)
          if(block.data[0] === 10) {
            log(`ToDo: Link: "${name}": ${block.data.slice(6)}`)
          } else {
            const msg = `Unknown: "${name}":`
            console.error(msg, block)
            log(msg)
          }
          break
      }
    })
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