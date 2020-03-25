import React from 'react'
import './index.css'
import { useParams } from 'react-router-dom'
import Reader from '../Readium'
//import { Navigator as Reader } from '@readium/navigator-web'

export default ({ url }) => {
  const key = useParams()[0]
  const IPFSUrl = `//ipfs.io/ipfs/${key}${window.location.hash}`

  return <div className='book'>
    <Reader url={IPFSUrl} hash={key}/>
  </div>
}