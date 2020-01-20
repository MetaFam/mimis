import React from 'react'
import CreatePathsDDoc from '../CreatePathsDDoc'
import PathComplete from '../PathComplete'
import Sync from '../Sync'
import RemoveDB from '../RemoveDB'
import { SearchProvider } from '../SearchContext'
import Covers from '../Covers'
import IPFSSlurp from '../IPFSSlurp'

export default () => {
  return <SearchProvider>
    <IPFSSlurp/>
    <hr/>
    <PathComplete/>
    <hr/>
    <Covers/>
    <hr/>
    To debug, you might need to <CreatePathsDDoc/>, <Sync/> or <RemoveDB/>.
  </SearchProvider>
}