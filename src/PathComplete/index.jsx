import React, { useState, useContext, useEffect } from 'react'
import { AutoComplete, Spin, Alert, Tag } from 'antd'
import { useDB } from 'react-pouchdb'
import './style.scss'
import SearchContext from '../SearchContext'
import { useLocation } from 'react-router-dom'

const MAX_RESULTS = 25

export default () => {
  const [completions, setCompletions] = useState([])
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)
  const db = useDB()
  const [_, setSearch] = useContext(SearchContext)
  const [tag, setTag] = useState('')

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
      .then((res) => {
        if(res.docs.length === 1) {
          console.info('Single Result')
        }
        if(res.warning) {
          console.warn('FIND', res.warning)
        }
        setDS(res.docs.map((r) => r._id))
        setMsg(null)
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
        setCompletions(res.rows.map((r) => (
          r.key[1][r.key[1].length - 1]
        )))
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

  return <React.Fragment>
    <ul className='mimis-path'>
      {path.map((p, i) => (
        <li key={Math.random()}><Tag closable onClose={() => removeTag(i)}>{p}</Tag></li>
      ))}
      <li><AutoComplete
        value={tag}
        onChange={changeTag}
        dataSource={completions}
        onSelect={addTag}
      /></li>
    </ul>
    {msg && <Spin className='path-spin' size='large'/>}
    {error && <Alert message={error}/>}
  </React.Fragment>
}
