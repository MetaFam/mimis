import React from 'react'
import './App.css'
import LoadDirs from './LoadDirs'
import CreatePathsDDoc from './CreatePathsDDoc'
import PathComplete from './PathComplete'

export default () => (
  <div className="App">
    <LoadDirs />
    <CreatePathsDDoc />
    <hr/>
    <PathComplete />
  </div>
)
