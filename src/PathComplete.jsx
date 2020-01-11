import React, { useState } from 'react'
import { AutoComplete, Spin, Alert } from 'antd'
import 'antd/dist/antd.css'
import { useDB } from 'react-pouchdb'
import './PathComplete.scss'

const MAX_RESULTS = 25

export default () => {
  const [dataSource, setDS] = useState([])
  const [value, setValue] = useState('')
  const [msg, setMsg] = useState(null)
  const db = useDB('books')

  const onSelect = (value) => {
    console.info('onSelect', value)
  }

  const onSearch = async (search) => {
    setMsg('Searching…')
    db.find({
      selector: {
        dir: {
          $gte: search,
          $lte: `${search}\uFFF0`,
        },
        depth: { $gt: null },
      },
      sort: ['depth'],
      limit: MAX_RESULTS,
    })
    .then((res) => {
      if(res.docs.length === 1) {
        console.info('Single Result')
      }
      console.log('D', res)
      setDS(res.docs.map((r) => r._id))
      setMsg(null)
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
      placeholder='Path? (expect initial delay)'
      style={{
        fontSize: '6ex',
        margin: 'auto',
        width: '75%',
      }}
    />
    {msg !== null
      ? <Spin style={{marginLeft: '-45px', marginTop: '2.5ex'}} size='large'>
        </Spin>
      : ''
    }
  </React.Fragment>
}
