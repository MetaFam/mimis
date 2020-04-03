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
      <IPFSSlurp log={logLine} hash='QmUCEx1poBu726HioY2SEsY3PjCwyGxP79SAiCrr56TRkM'/>
      <br/><br/>
      <LoadFilesystem log={logLine} hash='QmXWjJRd7y4fM4ZDDWCmTpNRcDuQndGnRBRNYaMHfAfQrT'/>
    </div>
    <ul>
      {log.map((line) => <li key={Math.random()}>{line}</li>)}
    </ul>
    {epub && <iframe src={`/readium/?epub=${epub}`}/>}
    <hr/>
    <div style={{textAlign: 'center'}}>
      <Download cid='QmWVVMpoyF9dRNimVnGpbioTkkgVkJGNf4FB1sH5nEGsKb'
        onLoad={setEPub}
      />
      <Download cid='QmUs35NHqrMiG2eWrveUqT7CMQzDa6b6yhVNfLNGPy2cvw/repo'
        onLoad={setEPub}
      />
      <RemoveDB/>
    </div>
  </div>
}