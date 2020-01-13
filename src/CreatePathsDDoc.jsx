import React, { useState } from 'react'
import { Button } from 'antd'
import { useDB } from 'react-pouchdb'
import './PathComplete.scss'

export default () => {
  const db = useDB('books')
  const defText = 'Create Paths Design Doc'
  const [text, setText] = useState(defText)

  const createDesign = () => {
    const docId = '_design/paths'
    const ddoc = {
      _id: docId,
      views: {
        full: {
          // emit confuses webpack in production
          map: (
            'function(doc) {'
            + 'emit(doc.path.join("/") + "/", null);'
            + '}'
          ),
          reduce: function(keys, values, rereduce) {
            return null // uniqueness
          }.toString(),
        },
        all: {
          map: (
            'function(doc) {'
            + 'for(i in doc.path) {'
            + 'var path = doc.path.slice(0,i+1).join("/") + "/";'
            + 'emit(path, null);'
            + '}'
            + '}'
          ),
          reduce: function(keys, values, rereduce) {
            return null // uniqueness
          }.toString(),
        },
        by_depth: {
          map: (
            'function(doc) {'
            + 'for(i in doc.path) {'
            + 'var idx = parseInt(i) + 1;'
            + 'var path = doc.path.slice(0,idx).join("/") + "/";'
            + 'emit([idx, path], null);'
            + '}'
            + '}'
          ),
          reduce: function(keys, values, rereduce) {
            return null // uniqueness
          }.toString(),
        },
      }
    }

    setText('Loading…')

    db.get(docId)
    .then((doc) => {
      ddoc._rev = doc._rev
      db.put(ddoc)
      .then(() => setText('Updated'))
      .catch((err) => console.error('Updating DDoc', err))
    })
    .catch((err) => {
      if(err.status === 404) {
        db.post(ddoc)
        .then(() => setText('Created'))
        .catch((err) => console.error('Creating DDoc', err))
      }
    })
  }
  
  return (
    <Button
      type='primary'
      disabled={text !== defText}
      onClick={createDesign}
    >
      {text}
    </Button>
  )
}