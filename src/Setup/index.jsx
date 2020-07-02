import React, { useState, useEffect } from 'react'
import { useDB } from 'react-pouchdb'
import './index.scss'
import CreatePathsDDoc from '../CreatePathsDDoc'
import IPFSSlurp from '../IPFSSlurp'
import LoadFilesystem from '../LoadFilesystem'
import RemoveDB from '../RemoveDB'
import Download from '../Download'
import LoadAwards from '../LoadAwards'

export default () => {
  const [log, setLog] = useState([])
  const [epub, setEPub] = useState()
  const [needsDDoc, setNeedsDDoc] = useState(false)
  const [needsData, setNeedsData] = useState(false)
  const db = useDB()

  const logLine = (line) => {
    setLog((log) => [line, ...log].slice(0, 150))
  }

  useEffect(() => {(async () => {
    try {
      const res = await db.allDocs({ limit: 0 })
      if(res.total_rows === 0) {
        setNeedsData(true)
      }
    } catch(err) {
      // ToDo: Be more granular
      setNeedsDDoc(true)
    }
  })()}, [])

  return <div className='setup mimis-page'>
    <div style={{textAlign: 'center'}}>
      {needsDDoc && <CreatePathsDDoc log={logLine}/>}
      {needsData && <LoadAwards log={logLine}
        hash='bafyreifsp7tzujssv55c7zqbpumy5tuuoaewagidyqg63223dl3mdzkti4'
        label='Load the Hugo &amp; Nebula Awards'
      />}
    </div>
    <ul>
      {log.map((line) => <li key={Math.random()}>{line}</li>)}
    </ul>
    <div style={{textAlign: 'center'}}>
      <RemoveDB/>
    </div>
  </div>
}