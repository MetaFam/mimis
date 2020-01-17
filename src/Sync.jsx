import React, { useState } from 'react'
import { useDB } from 'react-pouchdb'
import { Button } from 'antd'

export default () => {
  const local = useDB('mimis')
  const remote = useDB()
  const defText = `Sync w/ Local`
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