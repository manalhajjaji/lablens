'use client'

import { useState } from 'react'
import { repeats } from '@/lib/api'

export default function PatientRepeatsViewer() {
  const [numorden, setNumorden] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPatient = async () => {
    if (!numorden) return
    setLoading(true)
    try {
      const res = await repeats.getPatientRepeats(numorden)
      setRows(res.data)
    } catch (err) {
      console.error('Erreur patient repeats:', err)
      alert('Erreur lors du chargement du patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Tests Répétés par Patient</h2>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          value={numorden}
          onChange={e => setNumorden(e.target.value)}
          placeholder="Entrer Numorden..."
          className="border px-3 py-2 rounded-md text-black focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchPatient}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Chargement...' : 'OK'}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="px-3 py-2 text-left border-b">Nom du Test</th>
                <th className="px-3 py-2 text-left border-b"># Répétitions</th>
                <th className="px-3 py-2 text-left border-b">Première Date</th>
                <th className="px-3 py-2 text-left border-b">Dernière Date</th>
                <th className="px-3 py-2 text-left border-b">Écart (jours)</th>
              </tr>
            </thead>
            <tbody className="text-gray-900">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b">{r.nombre}</td>
                  <td className="px-3 py-2 border-b">{r.repeat_count}</td>
                  <td className="px-3 py-2 border-b">{r.first_date}</td>
                  <td className="px-3 py-2 border-b">{r.last_date}</td>
                  <td className="px-3 py-2 border-b">{r.days_span}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length === 0 && !loading && (
        <p className="text-gray-500 mt-4">Aucun test répété trouvé pour ce patient.</p>
      )}
    </div>
  )
}