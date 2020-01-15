import React, { useContext } from 'react'
import SearchContext from './SearchContext'

export default () => {
  const [search] = useContext(SearchContext)

  return <h1>{search}</h1>
}
