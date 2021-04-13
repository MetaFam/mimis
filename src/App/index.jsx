import React from 'react'
import './index.scss'
import { HashRouter as Router, Route } from 'react-router-dom'
import Hash from '../Hash'
import Home from '../Home'
import View from '../View'
import Book from '../Book'
import Cover from '../Cover'
import Table from '../Table'
import CoversToIPFS from '../CoversToIPFS'
import AragonConnect from '../AragonConnect'
import AragonAgent from '../AragonAgent'
import Diff from '../DiffViewer'
import { DatabaseProvider } from '../DatabaseContext'
import { IPFSProvider } from '../IPFSContext'

export default () => (
  <DatabaseProvider><IPFSProvider><Router>
    <div className="App">
      <Route path='/covers/' component={CoversToIPFS} />
      <Route path='/data/' component={Table} />
      <Route path='/diff/' component={Diff} />
      <Route path='/aragon/' component={AragonConnect} />
      <Route path='/agent/' component={AragonAgent} />
      <Route path='/hash/*' component={Hash} />
      <Route path='/book/*' component={Book} />
      <Route path='/view/*' component={View} />
      <Route path='/cover/*' component={Cover} />
      <Route path='/' exact={true} component={Home} />
    </div>
  </Router></IPFSProvider></DatabaseProvider>
)
