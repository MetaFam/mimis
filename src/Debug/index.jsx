import React from 'react'
import CreatePathsDDoc from '../CreatePathsDDoc'
import Sync from '../Sync'
import RemoveDB from '../RemoveDB'
import IPFSSlurp from '../IPFSSlurp'
import LoadFilesystem from '../LoadFilesystem'

export default () => (
  <div className='mimis-page'>
    <h1>Load Data</h1>

    <p>One use case the system seems to support is the bulk upload and cleaning of messy datasets. These IPFS hashes link to directory trees of such data.</p>

    <p>Gutenberg <a href='https://github.com/dhappy/ecesis/blob/master/bin/gutenberg.sh'>RSync</a></p>
    <ol>
      <li>Base + 0/ + 1/ + 2/: <IPFSSlurp hash='QmdU3ssrYAXPzHybrTrc1U1yrdoerRL93hz3EFgaRq9GBk'/></li>
      <li>3/: <IPFSSlurp hash='QmdU3ssrYAXPzHybrTrc1U1yrdoerRL93hz3EFgaRq9GBk'/></li>
    </ol>
    
    <h1>Load Context</h1>

    <p>One method of cleaning the data is creating links between a coherently named system and an existing tree.</p>

    <ul>
      <li>Gutenberg Author and Title: <LoadFilesystem hash='QmfB7neXVrhcsA5ebefCaAmTBUYHoV2P93ZvPM25yh9HwY'/></li>
    </ul>

    <hr/>
    To debug, you might need to <CreatePathsDDoc/>, <Sync/> or <RemoveDB/>.
  </div>
)