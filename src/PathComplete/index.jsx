import React, { useState, useContext, useEffect } from 'react'
import { AutoComplete, Spin, Alert, Tag } from 'antd'
import 'antd/dist/antd.css'
import { useDB } from 'react-pouchdb'
import './style.scss'
import SearchContext from '../SearchContext'

const MAX_RESULTS = 25

export default () => {
  const [completions, setCompletions] = useState([])
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)
  const db = useDB()
  const [search, setSearch] = useContext(SearchContext)
  const [path, setPath] = useState([])
  const [tag, setTag] = useState('')

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
      let endpath = []

      if(path.length > 0) {
        endpath = (
          path
          .slice(0, path.length - 1)
          .concat(`${path[path.length - 1]}\uFFF0`)
        )
      }
      endpath = endpath.concat({})
      console.log('EP', endpath)

      db.query(
        'paths/by_depth',
        {
          startkey: [path.length + 1, path],
          endkey: [path.length + 1, endpath],
          group: true,
          limit: MAX_RESULTS,
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
    [search, path]
  )

  const addTag = (text) => {
    setPath([...path, text])
  }

  const removeTag = (idx) => {
    let copy = [...path]
    copy.splice(idx, 0)
    setPath(copy)
  }

  const changeTag = (text) => {
    setTag(tag)
    setPath(
      path
      .slice(0, path.length - 1)
      .concat(tag)
    )
  }

  return <React.Fragment>
    <ul className='mimis-path'>{path.map((p, i) => (
      <li key={i}><Tag closable onClose={() => removeTag(i)}>{p}</Tag></li>
    ))}</ul>
    <AutoComplete
      value={tag}
      dataSource={completions}
      onSelect={addTag}
      onChange={changeTag}
      placeholder='Path? (expect initial delay)'
    />
    {msg && <Spin size='large'/>}
    {error && <Alert message={error}/>}
  </React.Fragment>
}
