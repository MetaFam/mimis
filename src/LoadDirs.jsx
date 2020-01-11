import React, { useState } from 'react'
import { useDB } from 'react-pouchdb'
import { Button } from 'antd'

export default () => {
  const db = useDB('books')
  const defText = 'Load Directories'
  const [text, setText] = useState(defText)

  const getData = async () => {
    setText('Loading…')
    const res = await fetch('dirs.json')
    if(res.ok) {
      const dirs = await res.json()
      Array.prototype.forEach.call(
        dirs,
        (e) => {
          for(let i in e.path) {
            let path = e.path.slice(0, i + 1)
            let dir = path.join('/')
            db.put({
              _id: dir,
              path: path,
              dir: dir,
              dirlen: dir.length,
              ipfs_id: e.ipfs_id,
            })
          }
        }
      )
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
