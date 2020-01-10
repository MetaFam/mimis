import React, { useState } from 'react'
import { useDB } from 'react-pouchdb'
import { Button } from 'antd'

export default () => {
  const local = useDB('books')
  const remoteURL = 'http://localhost:5984/books'
  const remote = useDB(remoteURL)
  const defText = `Sync w/ ${remoteURL}`
  const [text, setText] = useState(defText)

  const doSync = () => {
    setText('Syncing…')
    local.sync(remote)
    .on('complete', () => {
      setText(`Synced to: ${remoteURL}`)
    })
    .on('error', (err) => {
      setText('Sync Error!')
      console.error('Sync', err)
    });
  }

  return (
    <Button
      disabled={text !== defText}
      onClick={doSync}
    >
      {text}
    </Button>
  )
}