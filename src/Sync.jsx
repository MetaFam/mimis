import React, { useState } from 'react'
import { useDB } from 'react-pouchdb'
import { Button } from 'antd'

export default () => {
  const local = useDB()
  const remote = useDB('http://localhost:5984/mimis')
  const defText = `Sync w/ Localhost`
  const [text, setText] = useState(defText)

  const doSync = () => {
    setText('Syncing…')
    local.sync(remote)
    .on('complete', () => {
      setText(defText)
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