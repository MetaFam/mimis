import React, { useState, useContext } from 'react'
import { Button, Alert, Input } from 'antd'
import { useDB } from 'react-pouchdb'
import IPFSContext from './IPFSContext'

export default (props) => {
  let count = 0  // total number imported
  let queue = [] // objects to insert
  const [ipfs] = useContext(IPFSContext)
  const [message, setMessage] = useState(null)
  const log = props.log || console.debug
  const [key, setKey] = useState(props.hash)
  const defText = 'Parse:'
  const [text, setText] = useState(defText)
  const db = useDB()

  const enque = (obj) => {
    queue.push(obj)
    log(`Queued ${count} (${queue.length}): ${obj._id}`)
    console.log(`Queued ${queue.length}`, obj)
  }

  const startWith = async (hash) => {
    setText('Loading:')
    setMessage('')

    try {
      const serialize = (obj, parts, ret = {}) => {
        console.debug(obj, parts, ret)
        if(parts.length === 0) {
          enque({ ...obj, _id: obj.uuid, award: ret })
        } else {
          for(const prop of Object.keys(obj)) {
            serialize(
              obj[prop],
              parts.slice(1),
              { ...ret, [parts[0]]: prop}
            )
          }
        }
      }

      const awards = (await ipfs.dag.get(hash)).value
      const path = ['award', 'year', 'category', 'name']

      serialize(awards, path)

      log(`Got: ${queue.length} Entries: Writing…`)

      await db.bulkDocs(queue)

      log('Done')
    } catch(err) {
      setMessage(err.message)
    }
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