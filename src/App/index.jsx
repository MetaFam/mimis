import React from 'react'
import './index.scss'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Hash from '../Hash'
import Home from '../Home'
import { DatabaseProvider } from '../DatabaseContext'

export default () => (
  <DatabaseProvider><Router>
    <div className="App">
      <Route path='/hash/*' component={Hash} />
      <Route path='/' exact={true} component={Home} />
    </div>
  </Router></DatabaseProvider>
)
