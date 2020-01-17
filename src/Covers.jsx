import React, { useContext, Suspense, useEffect, useState } from 'react'
import SearchContext from './SearchContext'
import { useDB } from 'react-pouchdb'
import { Spin } from 'antd'
import IPFSDoc from './IPFSDoc'

export default () => {
  const [search] = useContext(SearchContext)
  const db = useDB()
  const [rows, setRows] = useState(null)

  useEffect(
    () => {
      console.log('Searching...')
      db.query(
        'paths/files',
        {
          startkey: search,
          endkey: `${search}\uFFF0`,
          limit: 25,
        }
      )
      .then(res => setRows(res.rows))
    },
    [search]
  )

  return <React.Fragment>
    {
      rows === null
      ? <Spin/>
      : rows.map((r, i) => (
        <IPFSDoc key={i} hash={r.value} path={r.key}/>
      ))
    }
   </React.Fragment>
}
