import React, { useContext, useEffect, useState } from 'react'
import SearchContext from '../SearchContext'
import { useDB } from 'react-pouchdb'
import { Spin, List } from 'antd'
import Data from '../Data'
import { Link } from 'react-router-dom'
import './index.scss'

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
          limit: 30,
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
      : <List
        grid={{ gutter: 10,
          xs: 1, sm: 2, md: 4,
          lg: 4, xl: 6, xxl: 6,
        }}
        dataSource={rows}
        renderItem={(r) => (
          <List.Item>
            <Link to={`view/${r.value}`}>
              <Data hash={r.value} path={r.key}/>
            </Link>
          </List.Item>
        )}
      />
    }
   </React.Fragment>
}
