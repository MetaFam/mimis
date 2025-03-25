import React, { useState } from 'react'
import { Button } from 'antd'

export default () => {
  const defText = 'Remove Databases'
  const [text, setText] = useState(defText)

  const rmDBs = () => {
    setText('Clearing…')

    window.indexedDB.databases()
    .then((dbs) => {
      dbs.forEach((db) => (
        window.indexedDB.deleteDatabase(db.name)
      ))
    })
    .then(() => {
      setText('Cleared')
    })
  }

  return (
    <Button
      type='danger'
      disabled={text !== defText}
      onClick={rmDBs}
    >
      {text}
    </Button>
  )
}
