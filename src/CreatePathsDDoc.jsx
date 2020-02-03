import React, { useState } from 'react'
import { Button } from 'antd'
import { useDB } from 'react-pouchdb'

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
            + 'if(doc.type === "dir") {'
            + 'for(i in doc.path) {'
            + 'var idx = parseInt(i) + 1;'
            + 'if(idx === 1) continue;'
            + 'emit([idx - 1, doc.path.slice(1,idx)], null);'
            + '}'
            + '}'
            + 'if(doc.type === "link") {'
            + 'for(i in doc.source) {'
            + 'var idx = parseInt(i) + 1;'
            + 'emit([idx, doc.source.slice(0,idx)], null);'
            + '}'
            + '}'
            + '}'
          ),
          reduce: '_count',
        },
        dirs: {
          map: (
            'function(doc) {'
            + 'if(doc.type === "dir") {'
            + 'var path = doc.path.slice(1).join("/") + "/";'
            + 'emit(path, doc.ipfs_id);'
            + '}'
            + '}'
          ),
        },
        files: {
          map: (
            'function(doc) {'
            + 'if(doc.type === "file") {'
            + 'var path = doc.path.slice(-1)[0];'
            + 'emit(path, doc.ipfs_id);'
            + '}'
            + '}'
          ),
        },
        contains: {
          map: (
            'function(doc) {'
            + 'if(doc.type === "dir") {'
            + 'emit(doc.ipfs_id, doc.path);'
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