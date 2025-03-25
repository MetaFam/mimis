import React from 'react'
import { Suspense } from 'react'
import { PouchDB, useFind, useDB } from 'react-pouchdb'
 
function MyComponent() {
  const docs = useFind({
    selector: {
      dir: { $gte: null }
    },
    sort: ['dir'],
  })
  const db = useDB()
 
  return (
    <ul>
      {docs.map(doc => (
        <li key={doc._id}>
          {doc.dir}
          <button onClick={() => db.remove(doc)}>Remove</button>
        </li>
      ))}
    </ul>
  )
}

export default () => (
  <PouchDB name='books'>
    <Suspense fallback="loading…">
      <MyComponent />
    </Suspense>
  </PouchDB>
)