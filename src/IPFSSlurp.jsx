import React from 'react'
import { Button } from 'antd'
import createIPFS from './useIPFSFactory'
import useIPFS from './useIPFS'

export default () => {
  const listDir = () => {
    const { ipfs, ipfsInitError } = createIPFS({ commands: ['id'] })
    const id = useIpfs(ipfs, 'id')
    console.log(id)
  }

  return <Button type='primary' onClick={listDir}>Intake Dir</Button>
}