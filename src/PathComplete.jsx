import React, { useState } from 'react'
import { AutoComplete, Spin, Alert } from 'antd'
import 'antd/dist/antd.css'
import { useDB } from 'react-pouchdb'

const MAX_RESULTS = 25
const MAX_LEN = 100

export default () => {
  const [dataSource, setDS] = useState([])
  const [value, setValue] = useState('')
  const [msg, setMsg] = useState(null)
  const db = useDB('books')

  const onSelect = (value) => {
    console.info('onSelect', value)
  }

  const checkLength = (search, len, out) => {
    if(len > MAX_LEN || out.size > MAX_RESULTS) {
      setMsg(null)
    } else {
      setMsg(`Checking: ${len}`)

      db.query(
        'paths/all',
        {
          startkey: [len, search],
          endkey: [len, `${search}\uFFF0`],
          limit: MAX_RESULTS - out.size,
          group: true,
        }
      )
      .then((res) => {
        if(out.size === 0 && res.rows.length === 1) {
          console.info('Single Result')
        }
        out.concat(res.rows.map((d) => d.key[1]))
        setDS(out)

        console.log(len, out, res)

        checkLength(search, len + 1, out)
      })
    }

  }

  const onSearch = async (search) => {
    setMsg('Starting…')
    checkLength(search, search.length, [])
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
      }}
    />
    {msg !== null
      ? <Spin style={{marginLeft: '-45px', marginTop: '2.5ex'}} size='large'>
          <Alert message={msg} type='info'/>
        </Spin>
      : ''
    }
  </React.Fragment>
}
