import React, { useState, useContext } from 'react'
import { Button, Alert, Input } from 'antd'
import IPFSContext from './IPFSContext'
import { useDB } from 'react-pouchdb'
import all from 'it-all'

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
  const [ipfs] = useContext(IPFSContext)
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
    log(`Queued ${count} (${queue.length}): ${obj.type}: ${obj._id.split("/").splice(1).join('/')}`)
    if(queue.length >= MAX_SIZE) {
      console.log('Flushing Queue')
      return flushQueue()
    } else {
      return Promise.resolve()
    }
  }

  const processList = async (list, path) => (
    await Promise.all(list.map(async (entry) => {
      const fullpath = [...path, decodeURIComponent(entry.name)]
      const name = fullpath.join('/')

      switch(entry.type) {
      case 'dir':
        log(`Dir: "${fullpath.slice(1).join('/')}/": Recursing`)
        await queueDir(entry.cid.toString(), fullpath)
      break
      case 'file':
        log(`Adding File: ${entry.name}`)
        enque({
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
      }
    }))
  )

  const fsToObj = async (key, path = []) => {
    if(path.length === 0) path.push(key)

    const list = await all(ipfs.ls(key))
    let out = {}
    await Promise.all(list.map(async (file) => {
      if(file.type === 'dir' && file.name !== 'repo') {
        const obj = await fsToObj(file.cid.toString(), [...path, file.name])
        console.log("Recursed", file.name, obj)
        out[file.name] = obj
      } else {
        out[file.name] = [...path, file.name].join('/')
      }
    }))
    console.log('fsToObj#Listing', key, out)

    return out
  }

  const queueDir = async (key, path = []) => {
    const list = await all(ipfs.ls(key))

    if(path.length === 0) path.push(key) // the root

    const names = list.map(e => e.name)
    let isContent = false

    // book covers content dir
    isContent = (
      isContent || names.filter(k => k === 'covers').length > 0
    )
    isContent = (
      isContent || names.filter(k => k === 'repo').length > 0
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
  }

  const startWith = async (hash) => {
    try {
      setText('Loading:')
      log(`Queuing ${hash}…`)
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
      disabled={text !== defText || ipfs === undefined}
    >{text}</Button>
    <Input
      value={key}
      onChange={evt => setKey(evt.target.value)}
      onPressEnter={evt => startWith(key)}
      style={{width: '60ex'}}
    />
  </React.Fragment>
}