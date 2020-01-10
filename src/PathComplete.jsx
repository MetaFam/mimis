import React, { useState } from 'react'
import { AutoComplete, Spin } from 'antd'
import 'antd/dist/antd.css'
import { useDB } from 'react-pouchdb'

export default () => {
  const [dataSource, setDS] = useState([])
  const [value, setValue] = useState('')
  const [spinner, setSpin] = useState(false)
  const db = useDB('books')

  const onSelect = (value) => {
    console.info('onSelect', value)
  }

  const onSearch = (search) => {
    setSpin(true)
    db.query(
      'paths/all',
      {
        startkey: search,
        endkey: `${search}\uFFFF`,
        limit: 25,
        group: true,
      }
    )
    .then((res) => {
      if(res.rows.length === 1) {
        throw 'Single Result'
      }
      return res.rows.map((d) => d.key)
    })
    .then((dirs) => {
      setSpin(false)
      setDS(dirs)
    })
    .catch((err) => {
      console.error('Finding', err)
    })
  }

  const onChange = (value) => {
    setValue(value)
  }

  return <React.Fragment>
    <AutoComplete
      value={value}
      dataSource={dataSource}
      onSelect={onSelect}
      onSearch={onSearch}
      onChange={onChange}
      placeholder='Path?'
      style={{
        fontSize: '6ex',
        margin: 'auto',
        width: '75%',
        marginTop: '1em',
      }}
    />
    {spinner
      ? <Spin style={{marginLeft: '-45px', marginTop: '3ex'}} size='large'/>
      : ''
    }
  </React.Fragment>
}
