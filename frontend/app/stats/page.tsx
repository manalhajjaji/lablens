"use client"

import { useEffect, useState } from "react"
import { stats } from "@/lib/api"

export default function StatsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testName, setTestName] = useState("")
  const [testStats, setTestStats] = useState<any>(null)
  const [loadingTest, setLoadingTest] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 20

  useEffect(() => {
    stats.summary().then(res => {
      setData(res.data)
      setLoading(false)
    })
  }, [])

  const fetchTestStats = async () => {
    if (!testName) return
    setLoadingTest(true)
    try {
      const res = await stats.test(testName.trim())
      setTestStats(res.data)
      setCurrentPage(1)
    } catch (err) {
      console.error("Erreur chargement test:", err)
      alert("Test introuvable ou sans valeurs.")
    } finally {
      setLoadingTest(false)
    }
  }

  if (loading) return <p className="p-12 text-center text-gray-600">Chargement...</p>

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedValues = testStats?.values?.slice(startIndex, endIndex) || []
  const totalPages = testStats?.values ? Math.ceil(testStats.values.length / rowsPerPage) : 1

  return (
    <div className="space-y-12 p-8">
      <h1 className="text-3xl font-bold text-gray-900">📈 Analyses Statistiques Détaillées</h1>


      {/* 🔍 Analyse d’un Test Spécifique */}
      <div className="bg-white shadow rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-black mb-4">🔍 Analyse d’un Test Spécifique</h2>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Ex: GLUCOSE, CRP, UREE SANGUIN..."
            className="border px-3 py-2 rounded-md text-black flex-1"
          />
          <button
            onClick={fetchTestStats}
            disabled={loadingTest}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loadingTest ? "Chargement..." : "Analyser"}
          </button>
        </div>

        {testStats && !testStats.error && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Test : <span className="text-blue-700">{testStats.test}</span>
            </h3>

            {testStats.numeric_summary ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MiniStat label="Moyenne" value={testStats.numeric_summary.mean.toFixed(2)} />
                <MiniStat label="Écart-type" value={testStats.numeric_summary.std.toFixed(2)} />
                <MiniStat label="Q25" value={testStats.numeric_summary.p25.toFixed(2)} />
                <MiniStat label="Q50 (médiane)" value={testStats.numeric_summary.p50.toFixed(2)} />
                <MiniStat label="Q75" value={testStats.numeric_summary.p75.toFixed(2)} />
              </div>
            ) : (
              <p className="text-gray-500">Aucune donnée numérique disponible pour ce test.</p>
            )}

            {/* Tableau descriptif */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-black border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">Valeur</th>
                    <th className="px-4 py-2 text-left border-b">Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedValues.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-2">{row.textores}</td>
                      <td className="px-4 py-2">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {testStats.values.length > rowsPerPage && (
              <div className="flex justify-between items-center mt-4 text-sm">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:bg-gray-100"
                >
                  ⬅️ Précédent
                </button>
                <p className="text-gray-700">
                  Page {currentPage} / {totalPages}
                </p>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:bg-gray-100"
                >
                  Suivant ➡️
                </button>
              </div>
            )}
          </div>
        )}

        {testStats && testStats.error && (
          <p className="text-gray-500 italic">Aucun test trouvé.</p>
        )}
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-black">{value}</p>
    </div>
  )
}
