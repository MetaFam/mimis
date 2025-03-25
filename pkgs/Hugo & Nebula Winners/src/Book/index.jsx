import React, { useState, useEffect, useContext } from 'react'
import './index.css'
import { useParams } from 'react-router-dom'

export default (props) => {
  const cid = useParams()[0]

  return <React.Fragment>
    <iframe src={`/readium/?epub=//ipfs.io/ipfs/${cid}`}/>
  </React.Fragment>
}
