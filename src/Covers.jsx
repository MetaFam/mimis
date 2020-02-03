import React, { useContext, Suspense, useEffect, useState } from 'react'
import SearchContext from './SearchContext'
import { useDB } from 'react-pouchdb'
import { Spin } from 'antd'
import Data from './Data'
import { Link } from 'react-router-dom'

export default () => {
  const [search] = useContext(SearchContext)
  const db = useDB()
  const [rows, setRows] = useState(null)

  useEffect(
    () => {
      db.query(
        'paths/dirs',
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
        <Link to={`view/${r.value}`}>
          <Data key={i} hash={r.value} path={r.key}/>
        </Link>
      ))
    }
   </React.Fragment>
}
