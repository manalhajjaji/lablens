// hooks/useUpload.ts
'use client'

import { useState } from 'react'
import { loader } from '@/lib/api'
import type { UploadResponse } from '@/types/loader.types'

export function useUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<UploadResponse | null>(null)

  // Charger fichier local (déjà sur le serveur)
  const uploadLocal = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await loader.uploadLocal()
      setData(res.data)
      return res.data
    } catch (err: any) {
      console.error('Erreur uploadLocal:', err)
      setError(err.response?.data?.detail || err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Upload via navigateur
  const uploadFile = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const res = await loader.uploadFile(file)
      setData(res.data)
      return res.data
    } catch (err: any) {
      console.error('Erreur uploadFile:', err)
      setError(err.response?.data?.detail || err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    uploadLocal,
    uploadFile,
    loading,
    error,
    data,
  }
}
