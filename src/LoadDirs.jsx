import React, { useState } from 'react'
import { useDB } from 'react-pouchdb'
import { Button } from 'antd'

const MAX_QUEUE_SIZE = 100

export default () => {
  const db = useDB('books')
  const defText = 'Load Directories'
  const [text, setText] = useState(defText)

  let queue = []
    const bulkPut = async (elem = null, { flush }) => {
    if(elem) queue.push(elem)
    if(flush || queue.size > MAX_QUEUE_SIZE) {
      console.log('BULK', queue)
      await db.bulkDocs(queue)
      queue = []
    }
  }

  const getData = async () => {
    setText('Loading…')
    const res = await fetch('dirs.json')
    if(res.ok) {
      const dirs = await res.json()
      const seen = {}
      await Array.prototype.forEach.call(
        dirs,
        async (e) => {
          for(let i in e.path) {
            let path = e.path.slice(0, parseInt(i) + 1)
            let dir = path.join('/')
            if(seen[dir]) {
              console.info(`Skipping ${dir}`, parseInt(i) + 1)
            } else {
              seen[dir] = true
              console.info(`Putting ${dir}`, parseInt(i) + 1)
              try {
                await bulkPut({
                  _id: dir,
                  path: path,
                  dir: dir,
                  dirlen: dir.length,
                  ipfs_id: e.ipfs_id,
                })
              } catch(err) {
                if(err.status !== 409) { // duplicate
                  console.error('PUT', err)
                }
              }
            }
          }
        }
      )
      bulkPut({ flush: true })
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
