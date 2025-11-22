"use client"

import { useEffect, useState } from "react"
import { coordering } from "@/lib/api"
import HeatmapByService from "@/components/coordering/HeatmapByService"

export default function CoOrderingPage() {
  const [pairs, setPairs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Charger les top paires co-prescrites
    coordering.getTopPairs()
      .then(res => setPairs(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-8 text-center text-gray-600">Chargement...</p>

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold text-black mb-6">
        🔗 Co-Ordering — Tests Associés
      </h1>

      {/* === HEATMAP PAR SERVICE === */}
      <HeatmapByService />

      {/* === TABLEAU DES TOP PAIRES === */}
      <div className="bg-white shadow border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Top 20 Paires Co-Prescrites
        </h2>

        <p className="text-gray-600 text-sm mb-4">
          Ces paires représentent les tests les plus souvent prescrits ensemble lors d’une même journée.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-black border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Test 1</th>
                <th className="px-4 py-2 text-left">Test 2</th>
                <th className="px-4 py-2 text-left">Co-Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {pairs.slice(0, 20).map((p, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{p.test1}</td>
                  <td className="px-4 py-2">{p.test2}</td>
                  <td className="px-4 py-2 font-semibold">{p.co_occurrences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
