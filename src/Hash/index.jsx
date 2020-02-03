import React from 'react'
import './index.scss'
import { Link, useParams, useHistory } from 'react-router-dom'
import { Button, Icon } from 'antd'

export default () => {
  const params = useParams()
  const key = params[0]
  const IPFSUrl = `//cloudflare-ipfs.com/ipfs/${key}`
  const history = useHistory()

  return <React.Fragment>
    <Button title='Back' onClick={() => history.goBack()}><Icon type='arrow-left'/></Button>
    <Link title='Home' to='/'><Button><Icon type='home'/></Button></Link>
    <iframe src={IPFSUrl}/>
  </React.Fragment>
}