'use client'

import { useState } from 'react'
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { loader } from '@/lib/api'

export default function LocalDataLoader({ onSuccess }: { onSuccess?: (data: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLoadLocal = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      
      console.log('🔄 Loading local data...')
      const response = await loader.uploadLocal()
      
      console.log('✅ Load success:', response.data)
      setResult(response.data)
      
      if (onSuccess) {
        onSuccess(response.data)
      }
    } catch (err: any) {
      console.error('❌ Load error:', err)
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        💾 Charger Données Locales
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Charge et nettoie le fichier <code className="px-2 py-1 bg-gray-100 rounded">
          data/raw/original_synthetic_bloodwork.csv
        </code>
      </p>

      <button
        onClick={handleLoadLocal}
        disabled={loading}
        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 
          disabled:bg-gray-300 disabled:cursor-not-allowed
          flex items-center justify-center gap-2 font-semibold transition"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement en cours...
          </>
        ) : (
          <>
            <Database className="w-5 h-5" />
            Charger Fichier Local
          </>
        )}
      </button>

      {/* Success Message */}
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">{result.message}</p>
              <p className="text-sm text-green-700 mt-1">
                📊 <strong>{result.rows.toLocaleString()}</strong> lignes chargées
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Erreur</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
