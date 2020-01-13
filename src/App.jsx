import React from 'react'
import './App.css'
import LoadDirs from './LoadDirs'
import CreatePathsDDoc from './CreatePathsDDoc'
import PathComplete from './PathComplete'
import Sync from './Sync'
import RemoveDB from './RemoveDB'
import { SearchProvider } from './SearchContext'
import Covers from './Covers'

export default () => (
  <div className="App">
    <SearchProvider>
      First, <LoadDirs/>, then <CreatePathsDDoc/>.
      <hr/>
      <PathComplete/>
      <hr/>
      <Covers/>
      <hr/>
      To debug, you might need to <Sync/> or <RemoveDB/>.
    </SearchProvider>
  </div>
)
