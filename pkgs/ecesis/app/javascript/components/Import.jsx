import React from 'react'
import { Suspense } from 'react'
import { useDB } from 'react-pouchdb'

export default () => {
  const db = useDB('books')

  const getData = async () => {
    const res = await fetch('dirs.json')
    if(res.ok) {
      const dirs = await res.json()
      Array.prototype.forEach.call(
        dirs,
        (dir) => {
          db.post({
            path: dir,
            dir: dir.join('/'),
          })
        }
      )
      console.info(`Loaded: ${dirs.length} dirs`)
    } else {
      console.error('dirs GET', res)
    }
  }

  return (
    <button onClick={getData}>Load Directories</button>
  )
}
