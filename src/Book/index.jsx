import React from 'react'
import './index.css'
import { Link, useParams, useHistory } from 'react-router-dom'
import { Button, Icon } from 'antd'

export default ({ url }) => {
  const params = useParams()
  const key = params[0]
  const IPFSUrl = `//cloudflare-ipfs.com/ipfs/${key}${window.location.hash}`
  const history = useHistory()

  return <div className='book'>
    <span title='Content' className='title-icon'>📖</span>
    <Button title='Back' onClick={() => history.goBack()}><Icon type='arrow-left'/></Button>
    <Link title='Home' to='/'><Button><Icon type='home'/></Button></Link>
    <iframe src={IPFSUrl} />
  </div>
}