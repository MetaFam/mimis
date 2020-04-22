import React from 'react'
import './index.scss'
import { Link, useParams, useHistory } from 'react-router-dom'
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export default () => {
  const params = useParams()
  const key = params[0]
  const IPFSUrl = `//cloudflare-ipfs.com/ipfs/${key}${window.location.hash}`
  const history = useHistory()

  return (
    <React.Fragment>
      <span title='Content' className='title-icon'>📖</span>
      <Button title='Back' onClick={() => history.goBack()}><ArrowLeftOutlined /></Button>
      <Link title='Home' to='/'><Button><HomeOutlined /></Button></Link>
      <iframe src={IPFSUrl} />
    </React.Fragment>
  );
}