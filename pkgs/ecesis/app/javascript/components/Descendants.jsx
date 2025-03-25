import React from 'react'
import { Suspense } from 'react'
import { PouchDB, useDB } from 'react-pouchdb'
import { Alert } from 'antd'

let data = null

const getDescendants = () => {
  const db = useDB()

  if(data !== null) {
    return data
  } else {
    throw db.query(
      'tree/descendants',
      {
        startkey: ['1968'],
        endkey: ['1968', {}],
      }
    )
    .then((res) => res.rows.map(
      (row) => row.value
    ))
    .then((vals) => data = vals)
  }
}

const Descendants = () => {
  const desc = getDescendants()

  return (
    <ul>
      {desc.map((entry) => {
        return <li key={entry._id}>
          {entry.dir}
        </li>
      })}
    </ul>
  )
}

export default () => (
  <PouchDB name='books'>
    <Suspense fallback={<Alert message='Loading Descendants…'/>}>
      <Descendants />
    </Suspense>
  </PouchDB>
)