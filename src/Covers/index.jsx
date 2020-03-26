import React, { useContext, useEffect, useState } from 'react'
import SearchContext from '../SearchContext'
import { useDB } from 'react-pouchdb'
import { Spin, List } from 'antd'
import Data from '../Data'
import { Link } from 'react-router-dom'
import './index.scss'
import InfiniteScroll from 'react-infinite-scroller'

const PER_REQUEST = 40

export default () => {
  const [search] = useContext(SearchContext)
  const db = useDB()
  const [rows, setRows] = useState([])
  const [midkey, setMidkey] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  const loadDirs = (startkey, append = true) => {
    const endkey = search.map(p => p.replace(/\//g, '//')).join('/')
    db.query(
      'paths/dirs',
      {
        startkey: startkey, endkey: `${endkey}\uFFF0`,
        limit: PER_REQUEST, group: true,
      }
    )
    .then((res) => {
      setHasMore(res.rows.length === PER_REQUEST)
      const last = res.rows[res.rows.length - 1]
      if(last) setMidkey(last.key)
      const idRows = res.rows.map(r => ({
        ...r, path: r.key, key: Math.random()
      }))
      setRows(append ? rows.concat(idRows.slice(1)) : idRows)
    })
  }

  useEffect(
    () => {
      const key = search.map(p => p.replace(/\//g, '//')).join('/')
      loadDirs(key, false)
    },
    [search]
  )

  const loadMore = () => {
    let key = midkey
    loadDirs(key)
  }

  return (
    <InfiniteScroll
      pageStart={0}
      loadMore={loadMore}
      hasMore={hasMore}
      loader={<Spin key={0}/>}
      initialLoad={false}
    >
      <List
        grid={{ gutter: 10,
          xs: 1, sm: 2, md: 4,
          lg: 4, xl: 6, xxl: 6,
        }}
        dataSource={rows}
        renderItem={(r) => (
          <List.Item title={r.path}>
            <Data hash={r.id} contents={r.value} path={r.path}/>
          </List.Item>
        )}
      />
    </InfiniteScroll>
  )
}