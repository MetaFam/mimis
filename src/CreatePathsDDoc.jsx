import React from 'react'
import { Button } from 'antd'
import { useDB } from 'react-pouchdb'
import './PathComplete.scss'

export default () => {
  const db = useDB('books')
  const createDesign = () => {
    const docId = '_design/paths'
    const ddoc = {
      _id: docId,
      views: {
        full: {
          // emit confuses webpack in production
          map: 'function(doc) { emit(doc.dir, doc) }',
          reduce: function(keys, values, rereduce) {
            return 1 // uniqueness
          }.toString(),
        },
      },
    }

    db.get(docId)
    .then((doc) => {
      ddoc._rev = doc._rev
      db.put(ddoc)
      .then(() => console.info('Updated'))
      .catch((err) => console.error('Updating DDoc', err))
    })
    .catch((err) => {
      if(err.status === 404) {
        db.post(ddoc)
        .then(() => console.info('Created'))
        .catch((err) => console.error('Creating DDoc', err))
      }
    })
  }
  
  return (
    <Button onClick={createDesign}>
      Create Paths Design Doc
    </Button>
  )
}