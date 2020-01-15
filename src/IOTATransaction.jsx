import React from 'react'
import { composeAPI } from '@iota/core'
import { Button } from 'antd'
import { asciiToTrytes } from '@iota/converter'
import { extractJson } from '@iota/extract-json'

export default () => {
  const provider = 'https://nodes.devnet.thetangle.org:443'
  //const provider = 'https://nodes.thetangle.org:443'
  const iota = composeAPI({provider})

  const showMetadata = () => {
    iota.getNodeInfo()
    .then((res) => console.info("iota", res))
  }

  const sendTransaction = () => {
    const seed = 'YW9JGMAZRQOOARKITQYANGSLXAMD9BRTFBQWRBBRLKNQMHV9OLNKNYTJZAM9WFCVCPEPOZQEWR9RHOJSQ'
    const depth = 3
    const minWeightMagnitude = 9
    const address = 'HEQLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWOR99D'
    // 27 trytes
    const tag = 'HELLOWORLD'

    const message = JSON.stringify({message: 'Hello World!'})

    // 2187 trytes
    const messageInTrytes = asciiToTrytes(message)

    const transfers = [{
      value: 0,
      address: address,
      message: messageInTrytes,
    }]

    // Create a bundle from the `transfers` array
    // and send the transaction to the node
    iota
    .prepareTransfers(seed, transfers)
    .then(trytes => iota.sendTrytes(trytes, depth, minWeightMagnitude))
    .then(bundle => {
      // The message can be read from the Tangle, using the tail transaction hash
      const tailTransactionHash = bundle[0].hash

      console.log('TTH', tailTransactionHash)

      // Get the tail transaction's bundle from the Tangle
      return (
        iota.getBundle(tailTransactionHash)
        .then(bundle => {
          console.log(JSON.parse(extractJson(bundle)))
        })
        .catch(err => {
          console.error(err)
        })
      )
    })
  }

  return (
    <React.Fragment>
      <Button type='primary' onClick={showMetadata}>Log Metadata</Button>
      <Button type='primary' onClick={sendTransaction}>Send Transaction</Button>
    </React.Fragment>
  )
}