import React from 'react'
import './App.css'
import LoadDirs from './LoadDirs'
import CreatePathsDDoc from './CreatePathsDDoc'
import PathComplete from './PathComplete'
import Sync from './Sync'
import RemoveDB from './RemoveDB'
import { SearchProvider } from './SearchContext'
import Covers from './Covers'
import IPFSSlurp from './IPFSSlurp'
import { PouchDB } from 'react-pouchdb'

//const dbURL = 'http://localhost:5984/mimis'
//const dbURL = 'https://65b65739-de46-4263-811c-394e70f5f6ef-bluemix.cloudantnosqldb.appdomain.cloud/mimis'
const dbURL = 'mimis'

export default () => (
  <div className="App">
    <SearchProvider><PouchDB name={dbURL}>
      <IPFSSlurp/>
      <hr/>
      <PathComplete/>
      <hr/>
      <Covers/>
      <hr/>
      To debug, you might need to <CreatePathsDDoc/>, <Sync/> or <RemoveDB/>.
    </PouchDB></SearchProvider>
  </div>
)
