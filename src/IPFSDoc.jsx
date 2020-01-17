import React from 'react'

export default (params) => {
  return <iframe src={`//ipfs.io/ipfs/${params.hash}`}/>
}