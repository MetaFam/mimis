import React, { useState } from 'react'
import { useDB } from 'react-pouchdb'
import { Button } from 'antd'

export default () => {
  const db = useDB('books')
  const defText = 'Load Directories'
  const [text, setText] = useState(defText)

  let queue = []
  const bulkPut = (elem = null, flush = false) => {
    if(elem) queue.push(elem) // want ruby's postfix syntax
  }

  const flushQueue = async () => {
    setText(`Putting ${Number(queue.length).toLocaleString()} Paths`)
    await db.bulkDocs(queue)
    setText(`Added ${Number(queue.length).toLocaleString()} Paths`)
    queue = []
  }

  const getData = async () => {
    setText('Loading…')
    const res = await fetch('dirs.json')
    if(res.ok) {
      const dirs = await res.json()
      const seen = {}
      await Array.prototype.forEach.call(
        dirs,
        (e) => {
          const dir = e.path.join('/') + '/'
          bulkPut({
            _id: dir,
            path: e.path,
            ipfs_id: e.ipfs_id,
          })
        }
      )
      await flushQueue()
      setText(`Loaded: ${Number(dirs.length).toLocaleString()} dirs`)
    } else {
      setText('Error!')
      console.error('dirs GET', res)
    }
  }

  return (
    <Button
      type='primary'
      disabled={text !== defText}
      onClick={getData}
    >
      {text}
    </Button>
  )
}
