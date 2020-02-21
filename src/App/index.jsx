import React from 'react'
import './index.scss'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Hash from '../Hash'
import Home from '../Home'
import View from '../View'
import Book from '../Book'
import { DatabaseProvider } from '../DatabaseContext'
import 'antd/dist/antd.css'
import './dark-theme.scss'

export default () => (
  <DatabaseProvider><Router>
    <div className="App">
      <Route path='/hash/*' component={Hash} />
      <Route path='/book/*' component={Book} />
      <Route path='/view/*' component={View} />
      <Route path='/' exact={true} component={Home} />
    </div>
  </Router></DatabaseProvider>
)
