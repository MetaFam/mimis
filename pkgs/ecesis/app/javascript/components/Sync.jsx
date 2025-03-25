import React from 'react'
import { useDB } from 'react-pouchdb'

export default () => {
  const local = useDB('books')
  const remoteURL = 'http://localhost:5984/books'
  const remote = useDB(remoteURL)
  const doSync = () => {
    local.sync(remote)
    .on('complete', () => {
      console.info(`Synced to: ${remoteURL}`)
    })
    .on('error', (err) => {
      console.error('Sync Error', err)
    });
  }

  return (
    <button onClick={doSync}>Sync w/ {remoteURL}</button>
  )
}