import React, { useState, useEffect } from 'react'
import './style.css'
import { useDB } from 'react-pouchdb'
import File from '../File'

export default (props) => {
  const { path, hash } = props
  const db = useDB()
  const [docs, setDocs] = useState([])

  useEffect(
    () => {
      db.allDocs({
        startkey: hash, 
        endkey: `${hash}\uFFF0`,
        limit: 50 
      })
      .then(res => console.log('R', hash, res))
    },
    [hash]
  )

  return <div className='mimis-fileentry'>
    <h3>{path}</h3>

    <ul className='mimis-filelist'>
      {docs.map(d => <li><File path={d}/></li>)}
    </ul>
  </div>
}