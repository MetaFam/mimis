import React, { useState, useContext } from 'react'
import { Tabs, Tab, TextField, Button, Box } from '@material-ui/core'
import ReactMarkdown from 'react-markdown'
import IPFSContext from '../IPFSContext'
import Comment from './Comment'

export default ({ num, text, type, filename }) => {
  const [ipfs] = useContext(IPFSContext)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState()
  const [tabIndex, setTabIndex] = useState(0)

  const writeComment = async () => {
    //const pr = (await ipfs.dag.get(pr))
    const pr = {}
    const holder = ['comments', type].reduce((obj, step) => (
      obj[step] = obj[step] || {}
    ), pr)
    holder[num] = holder[num] || []
    holder[num].push(comment)
  }

  return (
    <div className={`line ${type}`} key={`${type}-${num || Math.random()}`}>
      <a onClick={text ? () => setShowComment(s => !s) : null} title='💬'>
        <span className='number'>{num}</span>
        <span className='text'>{text}</span>
      </a>
      {showComment && <Comment/>}
    </div>
  )
}