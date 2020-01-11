import React, { useState } from 'react'
import { useDB } from 'react-pouchdb'
import { Button } from 'antd'

const MAX_QUEUE_SIZE = 100

export default () => {
  const db = useDB('books')
  const defText = 'Load Directories'
  const [text, setText] = useState(defText)

  let queue = []
  const bulkPut = async (elem = null, flush = false) => {
    if(elem) queue.push(elem) // want ruby's postfix syntax
    // BROKE: This doesn't work as intended, but the load doesn't seem problematic
    if(flush || queue.size > MAX_QUEUE_SIZE) {
      console.info('Q', queue)
      setText(`Putting ${queue.size} docs`)
      await db.bulkDocs(queue)
      setText(`Added ${queue.size} Paths`)
      queue = []
      console.log('CLR', queue)
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
            let idx = parseInt(i) + 1
            let path = e.path.slice(0, idx)
            let dir = path.join('/')
            if(seen[dir]) {
              //setText(`Skipping ${dir}`)
            } else {
              seen[dir] = true
              
              try {
                setText(`Putting ${dir}`)
                await bulkPut({
                  _id: dir,
                  path: path,
                  dir: dir,
                  dirlen: dir.length,
                  depth: idx,
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
      bulkPut(null, true)
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
