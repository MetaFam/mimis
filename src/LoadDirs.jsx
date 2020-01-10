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
          db.post({
            path: e.path,
            dir: e.path.join('/'),
            ipfs_id: e.ipfs_id,
          })
        }
      )
      setText(`Loaded: ${dirs.length} dirs`)
    } else {
      setText('Error!')
      console.error('dirs GET', res)
    }
  }

  return (
    <Button
      disabled={text !== defText}
      onClick={getData}
    >
      {text}
    </Button>
  )
}
