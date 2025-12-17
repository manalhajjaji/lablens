'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDataContext } from '@/context/DataContext'

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isDataLoaded } = useDataContext()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Si on n'est pas sur la page upload ET pas de données chargées, rediriger
    if (pathname !== '/' && !isDataLoaded && !isRedirecting) {
      setIsRedirecting(true)
      router.push('/')
    }
  }, [pathname, isDataLoaded, router, isRedirecting])

  // Si on n'est pas sur la page upload ET pas de données, ne pas afficher le contenu
  if (pathname !== '/' && !isDataLoaded) {
    return null
  }

  return <>{children}</>
}
