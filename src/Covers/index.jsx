import React, { useContext, useEffect, useState } from 'react'
import SearchContext from '../SearchContext'
import { useDB } from 'react-pouchdb'
import { Spin, List } from 'antd'
import Data from '../Data'
import { Link } from 'react-router-dom'
import './index.scss'
import InfiniteScroll from 'react-infinite-scroller'

export default () => {
  const [search] = useContext(SearchContext)
  const db = useDB()
  const [rows, setRows] = useState([])
  const [midkey, setMidkey] = useState(null)
  const [hasMore, setHasMore] = useState(true)

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
      .then((res) => {
        console.log('R', res)
        setHasMore(res.rows.length === 30)
        const last = res.rows[res.rows.length - 1]
        if(last) setMidkey(last.key)
        setRows(res.rows)
      })
    },
    [search]
  )

  const loadMore = () => {
    db.query(
      'paths/dirs',
      {
        startkey: midkey,
        endkey: `${search}\uFFF0`,
        limit: 30,
      }
    )
    .then((res) => {
      setHasMore(res.rows.length === 30)
      setMidkey(res.rows[res.rows.length - 1].key)
      setRows(rows.concat(res.rows))
    })
  }

  return (
    <InfiniteScroll
      pageStart={0}
      loadMore={loadMore}
      hasMore={hasMore}
      loader={<Spin/>}
    >
      <List
        grid={{ gutter: 10,
          xs: 1, sm: 2, md: 4,
          lg: 4, xl: 6, xxl: 6,
        }}
        dataSource={rows}
        renderItem={(r) => (
          <List.Item key={Math.random()}>
            <Link to={`view/${r.value}`}>
              <Data hash={r.value} path={r.key}/>
            </Link>
          </List.Item>
        )}
      />
    </InfiniteScroll>
  )
}
