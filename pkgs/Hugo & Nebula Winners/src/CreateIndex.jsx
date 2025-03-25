import React, { useState } from 'react'
import { useDB } from 'react-pouchdb'
import { Button } from 'antd'

export default () => {
  const db = useDB('books')
  const defText = 'Create Index'
  const [text, setText] = useState(defText)

  const createIdx = async () => {
    setText('Creating…')
    db.createIndex(
      {index: {fields: ['depth']}}
    )
    .then(setText('Created'))
  }

  return (
    <Button
      type='primary'
      disabled={text !== defText}
      onClick={createIdx}
    >
      {text}
    </Button>
  )
}
