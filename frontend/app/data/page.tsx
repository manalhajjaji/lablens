'use client'

import { useState } from 'react'
import FilterBuilder from '@/components/data/FilterBuilder'
import DataTable from '@/components/data/DataTable'
import { loader } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function DataPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rowCount, setRowCount] = useState<number>(0)

  const handleApplyFilters = async (filters: any) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Applying filters:', filters)
      const response = await loader.subset(filters)
      
      console.log('✅ Subset result:', response.data)
      setData(response.data.records)
      setRowCount(response.data.rowcount)
    } catch (err: any) {
      console.error('❌ Subset error:', err)
      setError(err.response?.data?.detail || err.message || 'Erreur de filtrage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Explorer les Données</h1>
        <p className="text-gray-600 mt-1">
          Filtrer et visualiser les résultats de laboratoire
        </p>
      </div>

      <FilterBuilder onApply={handleApplyFilters} />

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">❌ Erreur :</p>
          <pre className="text-red-700 text-sm whitespace-pre-wrap mt-1">
            {typeof error === 'string'
              ? error
              : JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}


      {!loading && !error && data.length > 0 && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900">
              📊 <strong>{rowCount.toLocaleString()}</strong> résultats trouvés 
            </p>
          </div>
          <DataTable data={data} />
        </>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            👆 Appliquez des filtres pour afficher les données
          </p>
        </div>
      )}
    </div>
  )
}
