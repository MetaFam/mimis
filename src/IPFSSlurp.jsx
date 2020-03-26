import React, { useState } from 'react'
import { Button, Alert, Input } from 'antd'
import useIPFSFactory from './useIPFSFactory'
import { useDB } from 'react-pouchdb'
import { reject } from '@evidentpoint/readium-js'

const mimetype = (filename) => {
  switch(filename.split('.').pop()) {
    case 'jpg': case 'jpeg': return 'image/jpeg'
    case 'svg': return 'image/svg+xml'
    case 'gif': return 'image/gif'
    case 'html': case 'htm': return 'text/html'
    case 'xhtml': return 'application/html+xml'
    case 'epub': return 'application/epub+zip'
    default: return 'unknown/unknown'
  }
}

export default (props) => {
  let count = 0  // total number imported
  let queue = [] // objects to insert
  let objFor = {}  //visited hashes
  const log = props.log || console.debug
  // queue is currently unbounded b/c indexDb is choking on successive puts
  const MAX_SIZE = Number.MAX_SAFE_INTEGER // size of a bulk post
  const { ipfs } = useIPFSFactory({ commands: ['id', 'ls', 'get'] })
  const [key, setKey] = useState(props.hash)
  const defText = 'Intake:'
  const [text, setText] = useState(defText)
  const db = useDB()

  const flushQueue = () => {
    const copy = [...queue]
    queue = []
    return db.bulkDocs(copy)
  }
  const enque = (obj) => {
    count++
    queue.push(obj)
    log(`Queued ${count} (${queue.length}): ${obj.type}: ${obj._id}`)
    if(queue.length >= MAX_SIZE) {
      console.log('Flushing Queue')
      return flushQueue()
    } else {
      return Promise.resolve()
    }
  }

  const processList = (list, path) => (
    Promise.allSettled(
      list.map((entry) => {
        const fullpath = [...path, decodeURIComponent(entry.name)]
        const name = fullpath.join('/')

        switch(entry.type) {
        case 'dir':
          log(`Dir: "${name}/": Recursing`)
          return queueDir(entry.hash, fullpath)
        case 'file':
          log(`Adding File: ${entry.name}`)
          return enque({
            _id: fullpath.join('/'), type: 'file',
            path: fullpath, ipfs_id: entry.hash,
            mimetype: mimetype(entry.name),
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

  const fsToObj = (key) => (
    ipfs.ls(key)
    .then((list) => {
      let out = {}
      const promises = list.map((file) => {
        switch(file.type) {
          case 'dir':
            return fsToObj(file.hash).then(o => out[file.name] = o)
          case 'file':
            out[file.name] = file.hash
            return Promise.resolve()
        }
      })
      return Promise.allSettled(promises).then(() => out)
    })
  )

  const queueDir = (key, path = []) => (
    ipfs.ls(key)
    .then(async (list) => {
      if(path.length === 0) path.push(key) // the root

      const names = list.map(e => e.name)
      let isContent = false

      // book covers content dir
      isContent = (
        isContent || names.filter(k => k === 'covers').length > 0
      )
      isContent = isContent || !!list.find(f => f.type === 'file')
      isContent = isContent || names.length === 0

      if(isContent && path.length > 1) {
        if(!objFor[key]) {
          objFor[key] = await fsToObj(key)
        }
        await enque({
          _id: path.join('/') + '/', type: 'dir',
          path: path, ipfs_id: key, contents: objFor[key],
        })
      } else {
        await processList(list, path)
      }
    })
  )

  const startWith = async (hash) => {
    try {
      setText('Loading:')
      log('Queuing…')
      await queueDir(hash)
      log(`Queued ${queue.length}, Writing…`)
      await flushQueue()
      log('Done')
      setText(defText)
    } catch(err) {
      log(err.message)
    }
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
      onPressEnter={evt => startWith(key)}
      style={{width: '60ex'}}
    />
  </React.Fragment>
}