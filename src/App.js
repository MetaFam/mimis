import React from 'react'
import './App.css'
import LoadDirs from './LoadDirs'
import CreatePathsDDoc from './CreatePathsDDoc'
import PathComplete from './PathComplete'
import Sync from './Sync'

export default () => (
  <div className="App">
    First, <LoadDirs />, then <CreatePathsDDoc />.
    <hr/>
    <PathComplete />
    <hr/>
    To debug, you might need to <Sync />.
  </div>
)
