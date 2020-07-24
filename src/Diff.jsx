import React, { useState, useContext } from 'react'
import {
  Input, Button, InputAdornment, Container,
  FormControl, InputLabel, OutlinedInput,
  makeStyles,
} from '@material-ui/core'
import {
  ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon,
} from '@material-ui/icons'
import { TreeView, TreeItem } from '@material-ui/lab'
import CID from 'cids'
import IPFSContext from './IPFSContext'
import id from 'ipfs-http-client/src/id'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  margin: {
    margin: theme.spacing(1),
  },
  withoutLabel: {
    marginTop: theme.spacing(3),
  },
  textField: {
    width: '25ch',
  },
}))

const shortCID = (cid) => `${cid.slice(0, 8)}…${cid.slice(-8)}`

export default () => {
  const [cidOne, setCIDOne] = useState('QmRqL7XqQPRbnuisxLaD2A9XVQLy8nnGgn7CvYN2w9qeY7')
  const [cidTwo, setCIDTwo] = useState('QmRN4R2LkPF8e9k9VyBp4wsvkZSTcGn8wSTeDLUU1jdPLj')
  const [error, setError] = useState()
  const [names, setNames] = useState([])
  const [files, setFiles] = useState([])
  const [ipfs] = useContext(IPFSContext)
  const classes = useStyles()

  if(error) {

  }
  
  const ls = async (cid) => {
    const entries = []
    if(!cid) return []
    for await (const file of ipfs.ls(cid)) {
      entries.push(file)
    }
    return entries
  }

  /* Development Steps:
   *  1. Catch changed files
   *  2. Explore subdirectories
   *  3. Handle added files
   *  4. Handle removed files
   *  5. Handle renamed files
   */
  const compareStart = async (one, two) => {
    const title = `Comparing ${shortCID(one)} to ${shortCID(two)}`
    const root = { name: title, children: await compare(one, two) }
    console.info(root)
    setFiles([root])
  }

  const compare = async (one, two) => {
    const cids = {}
    const entriesOne = await ls(one)
    const entriesTwo = await ls(two)
    const files = {}

    for(let entry of entriesOne) {
      files[entry.name] = {
        cidOne: entry.cid, type: entry.type,        
      }
    }
    for(let entry of entriesTwo) {
      if(!files[entry.name]) files[entry.name] = {}
      if(files[entry.name].type && files[entry.name].type !== entry.type) {
        throw 'Entry changed type. Not supported.'
      }
      files[entry.name].type = entry.type
      files[entry.name].cidTwo = entry.cid
    }

    const fileList = []
    for(let name of Object.keys(files)) {
      const file = files[name]
      file.name = name
      if(file.type === 'dir') {
        file.children = await compare(file.cidOne, file.cidTwo)
      }
      fileList.push(file)
    }
    return fileList
  }

  const mark = (cidOne, cidTwo) => {
    if(!cidOne && !cidTwo) {
      return <>
        <span style={{display: 'inline-block', minWidth: '3em', textAlign: 'center'}}>From</span>
        <span style={{display: 'inline-block', minWidth: '3em', textAlign: 'center'}}>To</span>
      </>
    } else if(cidOne && !cidTwo) {
      return <>
        <span style={{display: 'inline-block', minWidth: '3em', textAlign: 'center'}} title={cidOne}>✖</span>
        <span style={{display: 'inline-block', minWidth: '3em'}}></span>
      </>
    } else if(!cidOne && cidTwo) {
      return <>
        <span style={{display: 'inline-block', minWidth: '3em'}}></span>
        <span style={{display: 'inline-block', minWidth: '3em', textAlign: 'center'}} title={cidTwo}>✖</span>
      </>
    } else if(cidOne.equals(cidTwo)) {
      return <>
        <span style={{display: 'inline-block', minWidth: '3em', textAlign: 'center'}} title={cidOne}>✔</span>
        <span style={{display: 'inline-block', minWidth: '3em', textAlign: 'center'}} title={cidTwo}>✔</span>
      </>
    } else {
      return <>
        <span style={{display: 'inline-block', minWidth: '3em', textAlign: 'center'}} title={cidOne}>✖</span>
        <span style={{display: 'inline-block', minWidth: '3em', textAlign: 'center'}} title={cidTwo}>✖</span>
      </>
    }
  }

  const showDiff = (one, two) => {
    if(one && !two) {
      console.info('Removed')
    } else if(!one && two) {
      console.info('Added')
    } else if(one.equals(two)) {
      console.info('Same')
    } else {
      console.info('Changed')
    }
  }

  const fileItem = (file) => (
    <TreeItem key={file.name} nodeId={file.name}
      label={
        <div style={{display: 'flex'}}>
          <span>{file.name}</span>
          <span style={{flexGrow: 10, textAlign: 'right', marginRight: '1em'}}>
            {mark(file.cidOne, file.cidTwo)}
          </span>
        </div>
      }
      onClick={() => file.type === 'file' && showDiff(file.cidOne, file.cidTwo)}
    >
      {file.children ? file.children.map(child => fileItem(child)) : null}
    </TreeItem>
  )


  let validInput = false
  try {
    validInput = !!(new CID(cidOne) && new CID(cidTwo))
  } catch(e) {}

  return (
    <Container>
      <span style={{marginRight: '1ex'}}>Replace</span>
      <FormControl fullWidth className={classes.margin} variant="outlined">
        <InputLabel htmlFor='fromCID'>From</InputLabel>
        <OutlinedInput
          id='fromCID'
          placeholder='Origin Content Identifier'
          value={cidOne}
          onChange={evt => setCIDOne(evt.target.value)}
          color='primary'
          startAdornment={<InputAdornment position='start'>CID:</InputAdornment>}
          labelWidth={50}
        />
      </FormControl>
      <span style={{margin: 'auto 1ex'}}>with</span>
      <FormControl fullWidth className={classes.margin} variant="outlined">
        <InputLabel htmlFor='toCID'>To</InputLabel>
        <OutlinedInput
          id='toCID'
          placeholder='Replacement Content Identifier'
          value={cidTwo}
          startAdornment={<InputAdornment position="start">CID:</InputAdornment>}
          onChange={evt => setCIDTwo(evt.target.value)}
          color='primary'
          labelWidth={25}
        />
      </FormControl>
      <Button
        disabled={!validInput}
        color='primary'
        variant='contained'
        onClick={() => compareStart(cidOne, cidTwo)}
      >Diff {shortCID(cidOne)} &amp; {shortCID(cidTwo)}</Button>
      <hr style={{width: '65%', margin: '2em auto', border: '2px solid'}}/>
      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpanded={['root']}
        defaultExpandIcon={<ChevronRightIcon />}
      >
        {files.map(file => fileItem(file))}
      </TreeView>
    </Container>
  )
}