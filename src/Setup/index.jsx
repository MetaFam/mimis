import React, { useState } from 'react'
import './index.scss'
import CreatePathsDDoc from '../CreatePathsDDoc'
import IPFSSlurp from '../IPFSSlurp'

export default () => {
  const [log, setLog] = useState([])

  const logLine = (line) => {
    setLog((log) => [line, ...log].slice(0, 150))
  }

  return <div className='setup mimis-page'>
    <div style={{textAlign: 'center'}}>
      <CreatePathsDDoc log={logLine}/>
      <br/><br/>
      <IPFSSlurp log={logLine} hash='QmRY9qzr6nW9Q3thg6ZvKa4wj4xez2NZfN4EKAZ5fduhek'/>
    </div>
    <ul>
      {log.map((line) => <li>{line}</li>)}
    </ul>
  </div>
}