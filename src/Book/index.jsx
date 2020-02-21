import React, { useEffect } from 'react'
import './index.css'
import { Link, useParams, useHistory } from 'react-router-dom'
import { Button, Icon } from 'antd'
import Reader from '../Mimir'

export default ({ url }) => {
  const params = useParams()
  const key = params[0]
  const IPFSUrl = `//cloudflare-ipfs.com/ipfs/${key}${window.location.hash}`
  const history = useHistory()

  return <div className='book'>
    <Reader url={IPFSUrl} hash={key}/>
  </div>
}