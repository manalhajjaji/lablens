// hooks/useSubset.ts
'use client'

import { useState } from 'react'
import { loader } from '@/lib/api'
import type { CohortFilter, SubsetResponse } from '@/types/loader.types'

export function useSubset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SubsetResponse | null>(null)

  const fetchSubset = async (filters: CohortFilter, limit: number = 1000) => {
    setLoading(true)
    setError(null)
    try {
      const res = await loader.subset(filters, limit)
      setData(res.data)
      return res.data
    } catch (err: any) {
      console.error('Erreur subset:', err)
      setError(err.response?.data?.detail || err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    fetchSubset,
    loading,
    error,
    data,
  }
}
