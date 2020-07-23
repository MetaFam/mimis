import React, { useState, useEffect, useContext } from 'react'
import * as neo4j from 'neo4j-driver'
import IPFSContext from '../IPFSContext'

export default () => {
  const [basename] = useState(`covers-${(new Date()).toISOString()}`)
  const limit = 500
  const [count, setCount] = useState()
  const uri = 'bolt://localhost:7472'
  // const user = ''
  // const password = ''
  // const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  const driver = neo4j.driver(uri)
  const session = driver.session()
  const [ipfs] = useContext(IPFSContext)
  const [lines, setLines] = useState([])

  const log = (msg) => {
    setLines(lines => [...lines, msg])
  }

  useEffect(() => {(async () => {
    if(ipfs) {
      try {
        const count = await session.run(
          'MATCH (c:Cover)<-[CVR]-(v:Version)<-[PUB]-(b:Book)<-[CRTR]-(r:Creators)'
          + ` RETURN COUNT(c)`
        )

        setCount(count.records[0].get(0).low)

        const result = await session.run(
          'MATCH (c:Cover)<-[CVR]-(v:Version)<-[PUB]-(b:Book)<-[CRTR]-(r:Creators)'
          + ` RETURN DISTINCT c, v, b, r LIMIT ${limit}`
        )

        console.log(result.records)

        await Promise.all(result.records.map(async (record) => {
          const cover = record.get('c')
          const cid = cover.properties.cid
          let type = cover.properties.mimetype
          if(!type) type = 'jpg'
          type = type.replace(/^.+\//, '')
          const isbn = record.get('v').properties.isbn
          const title = record.get('b').properties.title
          const creators = record.get('r').properties.name
          const dir = `/${basename}/book/by/${creators}/${title}/covers`
          try {
            await ipfs.files.mkdir(dir, { parents: true })
            console.log(`${cid} → ${dir}/${isbn}.${type}`)
            log(`${cid} → ${dir}/${isbn}.${type}`)
            await ipfs.files.cp(
              `/ipfs/${cid}`, `${dir}/${isbn}.${type}`,
              { timeout: 5000 }
            )
            log(`${cid} ⏩ ${dir}/${isbn}.${type}`)
          } catch(err) {
            log(`Error: ${err}`)
          }
        }))
      } finally {
        await session.close()
      }
      //return () => { (async () => await driver.close())() }
    }
  //})()}, [ipfs, basename, session])
  })()}, [ipfs])

  return (
    <div>
      <h1>Creating a mutable file structure from stored covers</h1>
      <h2>Check the console for details</h2>
      <p>|lines| = {lines.length}; limit = {limit}; count = {count}</p>
      <ol>
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ol>
    </div>
  )
}