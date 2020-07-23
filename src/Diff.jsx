import React, { useState, useContext } from 'react'
import {
  Input, Button, InputAdornment, Container,
  FormControl, InputLabel, OutlinedInput,
  makeStyles,
} from '@material-ui/core'
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
  const [ipfs] = useContext(IPFSContext)
  const classes = useStyles()

  if(error) {

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
    const entriesOne = []
    for await (const file of ipfs.ls(one)) {
      entriesOne.push(file)
    }
    const entriesTwo = []
    for await (const file of ipfs.ls(two)) {
      entriesTwo.push(file)
    }
    // const lsOne = ipfs.ls(one)
    // const lsTwo = ipfs.ls(two)
    console.info(entriesOne, entriesTwo)

    for(let entry of entriesTwo) {
      cids[entry.cid] = entry
      let match
      // Same filename exists
      if(match = entriesOne.find(e => e.name === entry.name)) {
        console.log('Match', entry, match)
        // No changes
        if(match.cid === entry.cid) {
          console.log('No Changes', match.cid, entry.cid)
        } else {
          console.log('Changed', match.cid, entry.cid)
        }
      // File removed
      } else if(cids[entry.cid]) {
        console.log('Rename', entry, cids[entry.cid])
      } 
    }

    for(let entry of entriesOne) {
      cids[entry.cid] = entry
      let match
      // Same filename exists
      if(match = entriesTwo.find(e => e.name === entry.name)) {
        console.log('Match', entry, match)
      // Same file 
      } else if(cids[entry.cid]) {
        console.log('Rename', entry, cids[entry.cid])
      } 
    }
  }

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
          startAdornment={<InputAdornment position="start">CID:</InputAdornment>}
          labelWidth={60}
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
          labelWidth={60}
        />
      </FormControl>
      <Button
        enabled={CID.isCID(cidOne) && CID.isCID(cidTwo)}
        color='primary'
        variant='contained'
        onClick={() => compare(cidOne, cidTwo)}
      >Compare {cidOne.slice(0, 8)}…{cidOne.slice(-8)} and {cidTwo.slice(0, 8)}…{cidTwo.slice(-8)}</Button>
    </Container>
  )
}