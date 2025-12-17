'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

type DataContextType = {
  isDataLoaded: boolean
  setIsDataLoaded: (value: boolean) => void
  markDataAsLoaded: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const markDataAsLoaded = useCallback(() => {
    setIsDataLoaded(true)
  }, [])

  return (
    <DataContext.Provider value={{ isDataLoaded, setIsDataLoaded, markDataAsLoaded }}>
      {children}
    </DataContext.Provider>
  )
}

export function useDataContext() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useDataContext must be used within DataProvider')
  }
  return context
}
