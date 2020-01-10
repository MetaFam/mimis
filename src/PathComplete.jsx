import React, { useState } from 'react'
import { AutoComplete } from 'antd'
import 'antd/dist/antd.css'
import { useDB } from 'react-pouchdb'

export default () => {
  const [dataSource, setDS] = useState([])
  const [value, setValue] = useState('')
  const db = useDB('books')

  const onSelect = (value) => {
    console.info('onSelect', value)
  }

  const onSearch = (search) => {
    console.log(search)
    db.query(
      'paths/full',
      {
        startkey: search,
        endkey: `${search}\uFFFF`,
        limit: 25,
        group: true,
      }
    )
    .then((res) => {
      return res.rows.map((d) => d.key)
    })
    .then((dirs) => {
      setDS(dirs)
    })
    .catch((err) => {
      console.error('Finding', err)
    })
  }

  const onChange = (value) => {
    setValue(value)
  }

  return <AutoComplete
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
}
