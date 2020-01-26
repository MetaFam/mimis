import React, { useContext } from 'react'
import { Radio } from 'antd'
import DatabaseContext, { sources as dbs } from '../DatabaseContext'

export default () => {
  const [dbName, setDB] = useContext(DatabaseContext)

  const onChange = (evt) => {
    setDB(evt.target.value)
  }

  return <div className='mimis-page'>
    <h2>Storage Location</h2>
    <Radio.Group
      name='storage'
      onChange={onChange}
      defaultValue={dbName}
    >
      {Object.keys(dbs).map((key) => (
        <Radio key={key} value={key}>{key}</Radio>
      ))}
    </Radio.Group>
  </div>
}