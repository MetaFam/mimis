import React, { createContext, ReactNode, useCallback, useState } from 'react'
import { ipfsLinkPattern, gwPatternKey, limitingDelayKey, ipfsLimitingDelay } from '@/config'

export const SettingsContext = createContext({
  limitingDelay: 0,
  gwPattern: ipfsLinkPattern,
  setDelay: (limit: number) => {},
  setGwPattern: (pattern: string) => {},
})

export const Settings: React.FC<{
  children: ReactNode
}> = ({ children }) => {
  const [limitingDelay, setDelay] = useState(() => {
    if(typeof localStorage !== 'undefined') {
      return Number(
        localStorage?.getItem(limitingDelayKey)
        ?? ipfsLimitingDelay
      )
    }
  })
  const [gwPattern,setGwPattern] = useState(() => {
    if(typeof localStorage !== 'undefined') {
      const pattern = (
        localStorage?.getItem(gwPatternKey) as string
        ?? ipfsLinkPattern
      )
      return pattern
    }
  })
  const wrappedSetGwPattern = useCallback((pattern: string) => {
    localStorage.setItem(gwPatternKey, pattern)
    setGwPattern(pattern)
  }, [])

  const wrappedSetDelay = useCallback((delay: number) => {
    console.log({limitingDelayKey, delay})
    localStorage.setItem(limitingDelayKey, delay.toString())
    setDelay(delay)
  }, [])


  return (
    <SettingsContext.Provider value={{
      limitingDelay: limitingDelay ?? Number(ipfsLimitingDelay),
      gwPattern: gwPattern ?? ipfsLinkPattern,
      setDelay: wrappedSetDelay,
      setGwPattern: wrappedSetGwPattern,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}