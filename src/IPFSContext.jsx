import React, { createContext, useState, useEffect } from 'react'
import Ipfs from 'ipfs'
import IpfsHttpClient from 'ipfs-http-client'

const IPFSContext = createContext()

export default IPFSContext

export const IPFSProvider = (props) => {
  const [ipfs, setIPFS] = useState()

  useEffect(() => {
    //window.ipfs.enable({ commands: [] }).then(setIPFS)
    Ipfs.create({ repo: 'ipfs-' + Math.random() }).then(setIPFS)
    //setIPFS(IpfsHttpClient('/ip4/127.0.0.1/tcp/5001'))

    // const ipfs = new Ipfs()
    // ipfs.on('ready', () => setIPFS(ipfs))
  }, [])

 return (
    <IPFSContext.Provider value={[ipfs, setIPFS]}>
      {props.children}
    </IPFSContext.Provider>
  )
}