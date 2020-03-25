import React from 'react'
import './index.scss'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Hash from '../Hash'
import Home from '../Home'
import View from '../View'
import Book from '../Book'
import Cover from '../Cover'
import Add from '../Add'
import { DatabaseProvider } from '../DatabaseContext'
import 'antd/dist/antd.css'
import './dark-theme.scss'

export default () => (
  <DatabaseProvider><Router>
    <div className="App">
      <Route path='/add' component={Add} />
      <Route path='/hash/*' component={Hash} />
      <Route path='/book/*' component={Book} />
      <Route path='/view/*' component={View} />
      <Route path='/cover/*' component={Cover} />
      <Route path='/' exact={true} component={Home} />
    </div>
  </Router></DatabaseProvider>
)
