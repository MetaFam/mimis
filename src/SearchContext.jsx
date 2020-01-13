import React, { createContext, useState } from 'react'

const SearchContext = createContext('')

export default SearchContext

export const SearchProvider = (props) => {
  const [search, setSearch] = useState('')

  return (
    <SearchContext.Provider value={[search, setSearch]}>
      {props.children}
    </SearchContext.Provider>
  )
}