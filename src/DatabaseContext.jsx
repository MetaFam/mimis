import React, { createContext, useState } from 'react'
import { PouchDB } from 'react-pouchdb'

export const sources = {
  'Cloudant Read-Only': 'https://onsitinkedisellyinsolven:67aa88f7bfd1ff7501c1e22a5700f7af9fc1c5db@65b65739-de46-4263-811c-394e70f5f6ef-bluemix.cloudantnosqldb.appdomain.cloud/mimis',
  Localhost: 'http://localhost:5984/mimis',
  Local: 'mimis',
}

let defCtx = Object.keys(sources)[0]
let ls = localStorage.getItem('db')
if(ls) defCtx = ls

const DatabaseContext = createContext(defCtx)

export default DatabaseContext

export const DatabaseProvider = (props) => {
  const [db, setDB] = useState(defCtx)

  const storeDB = (db) => {
    setDB(db)
    localStorage.setItem('db', db)
  }

  console.log('db', db)

  return (
    <DatabaseContext.Provider value={[db, storeDB]}>
      <PouchDB name={sources[db]}>
        {props.children}
      </PouchDB>
    </DatabaseContext.Provider>
  )
}