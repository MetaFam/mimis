import React from 'react'
import './index.scss'
import { Link, useParams } from 'react-router-dom'

export default () => {
  const params = useParams()
  const key = params[0]
  const IPFSUrl = `//cloudflare-ipfs.com/ipfs/${key}`

  return <React.Fragment>
    <Link to='/'>🏠</Link>
    <iframe src={IPFSUrl}/>
  </React.Fragment>
}