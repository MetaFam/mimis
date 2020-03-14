import React from 'react'
import './index.css'
import { useParams } from 'react-router-dom'
//import Reader from '../Mimir'
import Reader from '../Readium'

export default ({ url }) => {
  const params = useParams()
  const key = params[0]
  const IPFSUrl = `//ipfs.io/ipfs/${key}${window.location.hash}`

  return <div className='book'>
    <Reader url={IPFSUrl} hash={key}/>
  </div>
}