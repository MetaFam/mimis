import React from 'react'
import { Button } from 'antd'
import { useDB } from 'react-pouchdb'

export default () => {
  const db = useDB('books')
  const createDesign = () => {
    const docId = '_design/tree'
    const ddoc = {
      _id: docId,
      views: {
        descendants: {
          map: function(doc) {
            for(var i in doc.path) { 
              emit([doc.path[i], doc.path], doc) 
            }
          }.toString()
        },
      },
    }

    db.get(docId)
    .then((doc) => {
      ddoc._rev = doc._rev
      db.put(ddoc)
      .then(() => console.info('Created'))
      .catch((err) => console.error('Error Creating DDoc', err))
    })
  }
  
  return (
    <Button onClick={createDesign}>
      Create Tree Design Doc
    </Button>
  )
}