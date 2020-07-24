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

export default () => {
  const [cidOne, setCIDOne] = useState('QmRhXd65SWqbWxL8j3Ls2wBJxhmo8pvFGyFxZEadKKnriY')
  const [cidTwo, setCIDTwo] = useState('QmUxBA4fif4xRtmFWvjt4S26wgujqHFHkPrudp8dQkLYJ6')
  const [error, setError] = useState()
  const [names, setNames] = useState([])
  const [ipfs] = useContext(IPFSContext)
  const classes = useStyles()

  if(error) {

  }
  
  const ls = async (cid) => {
    const entries = []
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
  const compare = async (one, two) => {
    const title = `Comparing ${one} to ${two}`
    const cids = {}
    const entriesOne = ls(one)
    const entriesTwo = ls(two)
    const files = new Proxy({}, {
      get: (object, property) => {
        return object.hasOwnProperty(property) ? object[property] : {}
      }
    })

    for(let entry of entriesOne) {
      files[entry.name] = { cidOne: entry.cid }
    }

    for(let entry of entriesTwo) {
      files[entry.name][cidTwo] = entry.cid
    }

    console.log(files)

    const namesOne = entriesOne.map(e => e.name)
    const namesTwo = entriesTwo.map(e => e.name)
    setNames([...new Set(namesOne, namesTwo)])
  }

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
        onClick={() => compare(cidOne, cidTwo)}
      >Diff {cidOne.slice(0, 8)}…{cidOne.slice(-8)} &amp; {cidTwo.slice(0, 8)}…{cidTwo.slice(-8)}</Button>
      <hr style={{width: '65%', margin: '3em auto', border: '2px solid'}}/>
      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpanded={['root']}
        defaultExpandIcon={<ChevronRightIcon />}
      >
        {names.map((name, i) => (
          <TreeItem key={i} nodeId={i.toString()} label={
            <div style={{display: 'flex'}}>
              <span>{name}</span><b style={{flexGrow: 10, textAlign: 'right', marginRight: '1em'}}>{i}</b>
            </div>
          }/>
        ))}
      </TreeView>
    </Container>
  )
}