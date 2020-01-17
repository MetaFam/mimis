import React, { useState } from 'react'
import { Button } from 'antd'
import { useDB } from 'react-pouchdb'
import './PathComplete.scss'

export default () => {
  const db = useDB()
  const defText = 'Create Paths Design Doc'
  const [text, setText] = useState(defText)

  const createDesign = () => {
    const docId = '_design/paths'
    const ddoc = {
      _id: docId,
      views: {
        by_depth: {
          map: (
            'function(doc) {'
            + 'for(i in doc.path) {'
            + 'if(i === 0) next;'
            + 'var idx = parseInt(i) + 1;'
            + 'var path = doc.path.slice(1,idx).join("/");'
            + 'if(idx < doc.path.length) path += "/";'
            + 'emit([idx - 1, path], null);'
            + '}'
            + '}'
          ),
          reduce: '_count',
        },
        files: {
          map: (
            'function(doc) {'
            + 'if(doc.ipfs_id) {'
            + 'var path = doc.path.slice(1).join("/");'
            + 'emit(path, doc.ipfs_id);'
            + '}'
            + '}'
          ),
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