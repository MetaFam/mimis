import React, { useState, useContext, useEffect } from 'react'
import { AutoComplete, Spin, Alert } from 'antd'
import 'antd/dist/antd.css'
import { useDB } from 'react-pouchdb'
import './PathComplete.scss'
import SearchContext from './SearchContext'

const MAX_RESULTS = 25

export default () => {
  const [dataSource, setDS] = useState([])
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)
  const db = useDB('books')
  const [search, setSearch] = useContext(SearchContext)

  const onSelect = (value) => {
    console.info('onSelect', value)
  }

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
      const re = /\S\//g
      const depth = ((search || '').match(re) || []).length + 1
      db.query(
        'paths/by_depth',
        {
          startkey: [depth, search],
          endkey: [depth, `${search}\uFFF0`],
          group: true,
          limit: MAX_RESULTS,
        }
      )
      .then((res) => {
        console.log('R', res)
        setDS(res.rows.map(r => r.key[1]))
        setMsg(null)
      })
      .catch((err) => {
        setError(`${err.status} Error: ${err.name} ${err.docId}`)
      })
    },
    [search]
  )
  return <React.Fragment>
    <AutoComplete
      dataSource={dataSource}
      onSelect={setSearch}
      onSearch={setSearch}
      placeholder='Path? (expect initial delay)'
    />
    {msg !== null
      ? <Spin style={{marginLeft: '-45px', marginTop: '2.5ex'}} size='large'/>
      : ''
    }
    {error !== null
      ? <Alert message={error}/>
      : ''
    }
  </React.Fragment>
}
