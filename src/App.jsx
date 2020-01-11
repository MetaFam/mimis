import React from 'react'
import './App.css'
import LoadDirs from './LoadDirs'
import CreateIndex from './CreateIndex'
import PathComplete from './PathComplete'
import Sync from './Sync'
import RemoveDB from './RemoveDB'

export default () => (
  <div className="App">
    First, <LoadDirs/>, then <CreateIndex/>.
    <hr/>
    <PathComplete/>
    <hr/>
    To debug, you might need to <Sync/> or <RemoveDB/>.
  </div>
)
