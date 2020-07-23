import React, { useState, useEffect } from 'react'
//import { encodeCallScript } from '@aragon/test-helpers/evmScript'
//import { encodeActCall, exec } from '@aragon/toolkit'
import CID from 'cids'
import Web3 from 'web3'

const fnamehash = (name) => {
  let node = '0x0000000000000000000000000000000000000000000000000000000000000000'
  if(name !== '') {
    const labels = name.split('/')
    for(let i = labels.length - 1; i >= 0; i--) {
      node = Web3.utils.sha3(node + Web3.utils.sha3(labels[i]).slice(2), { encoding: 'hex' })
    }
  }
  return node.toString()
}

export default () => {
  useEffect(() => {(async () => {
    // dao apps libres --all --environment aragon:rinkeby --use-frame
    const daoAddress = '0x0d053730f22ea05ca901193c5d94a21f7106cfae'
    const aclAddress = '0x593be1b33d92e3c9c241d426ba908930c9e22793'
    const votingAddress = '0xdb6c869bbe60131452794e8e278cba01510d23b2'
    const environment = 'rinkeby'
    const mapPath = 'mapPath(uint256,bytes32)'
    const path = '/author/Aldous Huxlex/Island/'
    const cid = new CID('QmZb3XL8oT8xRpLJQVzHP76gvPuB7E423CCiXJ61pD6LeS')
    // const calldata = await encodeActCall(mapPath, [fnamehash(path), cid.multihash])
    // const actions = [{ to: aclAddress, calldata }]
    // const script = encodeCallScript(actions)

    // const tx = await exec(
    //   daoAddress,
    //   votingAddress,
    //   'newVote',
    //   [script, 'Change permissions'],
    //   () => {},
    //   environment
    // )

    // console.log(`${tx.receipt.transactionHash} executed`)

  })()}, [])
}
