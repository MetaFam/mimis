import React, { useState } from 'react'
import './index.scss'
import CreatePathsDDoc from '../CreatePathsDDoc'
import IPFSSlurp from '../IPFSSlurp'
import LoadFilesystem from '../LoadFilesystem'
import RemoveDB from '../RemoveDB'
import Download from '../Download'

export default () => {
  const [log, setLog] = useState([])
  const [epub, setEPub] = useState()

  const logLine = (line) => {
    setLog((log) => [line, ...log].slice(0, 150))
  }

  return <div className='setup mimis-page'>
    <div style={{textAlign: 'center'}}>
      <CreatePathsDDoc log={logLine}/>
      <br/><br/>
      <IPFSSlurp log={logLine} hash='QmUy5dBHpAgafzBs4pfBBpt4eWHbRdd3ebfsNZwC8cXGkp'/>
      <br/><br/>
      <LoadFilesystem log={logLine} hash='QmXWjJRd7y4fM4ZDDWCmTpNRcDuQndGnRBRNYaMHfAfQrT'/>
    </div>
    <ul>
      {log.map((line) => <li key={Math.random()}>{line}</li>)}
    </ul>
    <div style={{textAlign: 'center'}}>
      <RemoveDB/>
    </div>
  </div>
}