import React, { useState } from 'react'
import { useDB } from 'react-pouchdb'
import { Button, Modal, Input } from 'antd'

export default () => {
  const defText = `Sync`
  const [text, setText] = useState(defText)
  const [active, setActive] = useState(false)
  const [url, setURL] = useState('http://localhost:5984/mimis')
  const local = useDB()
  const remote = useDB(url)

  const doSync = () => {
    setText('Syncing…')
    local.replicate.to(remote)
    .on('complete', () => {
      setText(defText)
    })
    .on('error', (err) => {
      setText('Sync Error!')
      console.error('Sync', err)
    })
  }

  const onOk = () => {
    setActive(false)
    doSync()
  }

  return <React.Fragment>
    <Button
      type='primary'
      disabled={text !== defText}
      onClick={e => setActive(true)}
    >
      {text}
    </Button>
    <Modal onOk={onOk} onCancel={() => setActive(false)} visible={active}>
      <form>
        <h2>URL To Replicate To</h2>
        <Input value={url} onChange={evt => setURL(evt.target.value)}/>
      </form>
    </Modal>
  </React.Fragment>
}