'use client'

import { DataProvider } from '@/context/DataContext'
import { RouteGuard } from './RouteGuard'

export function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <RouteGuard>
        {children}
      </RouteGuard>
    </DataProvider>
  )
}
