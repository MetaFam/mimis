import React, { useState, useContext, useEffect } from 'react'
import { Spin, Alert, Tag, Menu, Dropdown, Input } from 'antd'
import { useDB } from 'react-pouchdb'
import './style.scss'
import SearchContext from '../SearchContext'
import { useLocation } from 'react-router-dom'
import InfiniteScroll from 'react-infinite-scroller'

const MAX_RESULTS = 50

export default () => {
  const [completions, setCompletions] = useState([])
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)
  const db = useDB()
  const [_, setSearch] = useContext(SearchContext)
  const [tag, setTag] = useState('')
  const [midkey, setMidkey] = useState([])
  const [hasMore, setHasMore] = useState(true)

  let defPath = []
  const location = useLocation()
  const params = (new URLSearchParams(location.search))
  if(params.get('q')) defPath = JSON.parse(params.get('q'))
  const [path, setPath] = useState(defPath)
  
  useEffect(
    () => {
      setMsg('Searching…')
      // Recursive, but too slow (~10s per request every time)
      /*
      db.find({
        selector: {
          _id: {
            $gt: search,
            $lte: `${search}\uFFF0`,
          },
          depth: { $gt: null },
        },
        fields: ['_id'],
        sort: ['depth'],
        limit: MAX_RESULTS,
      })
      */

      let startpath = path
      let endpath = []

      if(tag && tag.length > 0) {
        startpath = startpath.concat(tag)
      }

      if(startpath.length > 0) {
        endpath = (
          startpath
          .slice(0, startpath.length - 1)
          .concat(`${startpath[startpath.length - 1]}\uFFF0`)
        )
      }
      endpath = endpath.concat({})

      setSearch(startpath)

      db.query(
        'paths/by_depth',
        {
          startkey: [path.length + 1, startpath],
          endkey: [path.length + 1, endpath],
          group: true, limit: MAX_RESULTS,
        }
      )
      .then((res) => {
        setCompletions(res.rows.map((r) => ({
          name: r.key[1][r.key[1].length - 1],
          count: r.value,
        })))
        setHasMore(res.rows.length === MAX_RESULTS)
        const last = res.rows[res.rows.length - 1]
        if(last) setMidkey(last.key)
        setMsg(null)
      })
      .catch((err) => {
        if(err.status === 404) {
          setError('Missing Design Document: Can\'t Search')
        } else {
          setError(`${err.status} Error: ${err.name} ${err.docId}`)
        }
        setMsg(null)
      })
    },
    [path, tag]
  )

  const loadMore = () => {
    setMsg('Searching…')
    let startpath = path
    let endpath = []

    if(tag && tag.length > 0) {
      startpath = startpath.concat(tag)
    }

    if(startpath.length > 0) {
      endpath = (
        startpath
        .slice(0, startpath.length - 1)
        .concat(`${startpath[startpath.length - 1]}\uFFF0`)
      )
    }
    endpath = endpath.concat({})

    db.query(
      'paths/by_depth',
      {
        startkey: midkey,
        endkey: [path.length + 1, endpath],
        group: true, limit: MAX_RESULTS,
      }
    )
    .then((res) => {
      setCompletions(completions.concat(
        res.rows.map((r) => ({
          name: r.key[1][r.key[1].length - 1],
          count: r.value,
        }))
      ))
      setHasMore(res.rows.length === MAX_RESULTS)
      const last = res.rows[res.rows.length - 1]
      if(last) setMidkey(last.key)
      setMsg(null)
    })
    .catch((err) => {
      if(err.status === 404) {
        setError('Missing Design Document: Can\'t Search')
      } else {
        setError(`${err.status} Error: ${err.name} ${err.docId}`)
      }
      setMsg(null)
    })
  }

  const addTag = (text) => {
    setPath([...path, text])
    setTag('')
  }

  const removeTag = (idx) => {
    let copy = [...path]
    copy.splice(idx, 1)
    setPath(copy)
  }

  const changeTag = (tag) => {
    setTag(tag)
  }

  const menu = <div class='autocomplete'>
    <InfiniteScroll
        pageStart={0}
        loadMore={loadMore} hasMore={hasMore}
        loader={<div className='complete-spin'><Spin key={0}/></div>}
        useWindow={false} initialLoad={false}
      >
      <Menu>
        {completions.map(({name, count}) => (
          <Menu.Item title={name} onClick={() => addTag(name)}>
            {name}{count !== 1 && `(${count})`}
          </Menu.Item>
        ))}
      </Menu>
    </InfiniteScroll>
  </div>

  return <React.Fragment>
    <ul className='mimis-path'>
      {path.map((p, i) => (
        <li key={Math.random()}><Tag closable onClose={() => removeTag(i)}>{p}</Tag></li>
      ))}
      <li>
        <Dropdown overlay={menu} trigger={['click', 'hover']}>
          <Input value={tag} onChange={evt => changeTag(evt.target.value)}/>
        </Dropdown> 
      </li>
      {msg && <li><Spin className='path-spin'/></li>}
    </ul>
    {error && <Alert message={error}/>}
  </React.Fragment>
}
