import React, { createContext, ReactNode, useState } from 'react'

export const SettingsContext = createContext({
  limitedRate: 0,
  setRate: (limit: number) => {},
})

export const Settings: React.FC<{
  children: ReactNode
}> = ({ children }) => {
  const [limitedRate, setRate] = useState(
    60 * 1000 / 100, // 100 per minute
  )

  return (
    <SettingsContext.Provider value={{
      limitedRate,
      setRate,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}