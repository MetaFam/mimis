import React from 'react'
import './index.scss'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Hash from '../Hash'
import Home from '../Home'
import { PouchDB } from 'react-pouchdb'

//const dbURL = 'http://localhost:5984/mimis'
//const dbURL = 'https://hatielyientedsordsomeace:1a2f6ff5d5217d88795f49f6f93958f1d5afc301@65b65739-de46-4263-811c-394e70f5f6ef-bluemix.cloudantnosqldb.appdomain.cloud/mimis'
const dbURL = 'mimis'

export default () => (
  <PouchDB name={dbURL}><Router>
    <div className="App">
      <Route path='/hash/*' component={Hash} />
      <Route path='/' exact={true} component={Home} />
    </div>
  </Router></PouchDB>
)
