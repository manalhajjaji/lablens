'use client'

import { useEffect, useState } from 'react'
import { repeats } from '@/lib/api'

export default function TopRepeatedTests() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    repeats.topTests().then((res) => {
      setData(res.data.slice(0, 20)) // 
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <p className="text-center text-gray-600">Chargement des données...</p>
  }

  return (
    <div className="bg-white shadow rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        🧪 Top Tests les Plus Répétés
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg text-sm text-gray-900">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="px-4 py-2 text-left border-b">#</th>
              <th className="px-4 py-2 text-left border-b">Nom du Test</th>
              <th className="px-4 py-2 text-left border-b">Patients concernés</th>
              <th className="px-4 py-2 text-left border-b">Répétitions moyennes</th>
              <th className="px-4 py-2 text-left border-b">Répétitions max</th>
            </tr>
          </thead>
          <tbody>
            {data.map((test, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-4 py-2 border-b font-medium text-gray-700">
                  {idx + 1}
                </td>
                <td className="px-4 py-2 border-b">{test.nombre}</td>
                <td className="px-4 py-2 border-b">{test.patient_count}</td>
                <td className="px-4 py-2 border-b">{test.avg_repeats.toFixed(2)}</td>
                <td className="px-4 py-2 border-b">{test.max_repeats}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}