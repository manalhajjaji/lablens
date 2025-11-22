"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { stats, repeats, coordering } from "@/lib/api"
import StatsBySex from "@/components/stats/StatsBySex"
import StatsByService from "@/components/stats/StatsByService"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Loader2, AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [trend, setTrend] = useState<any[]>([])
  const [topRepeats, setTopRepeats] = useState<any[]>([])
  const [topPairs, setTopPairs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      stats.summary().catch(e => ({ data: null })),       // Gestion d'erreur individuelle
      repeats.summary().catch(e => ({ data: null })),
      stats.activityTrend().catch(e => ({ data: [] })),
      repeats.topTests().catch(e => ({ data: [] })),
      coordering.getTopPairs().catch(e => ({ data: [] })),
    ])
      .then(([sum, repSum, trendRes, repTop, coPairs]) => {
        if (!sum.data) {
            setError("Impossible de charger les statistiques principales.")
        } else {
            setSummary({ ...sum.data, ...repSum.data }) // Fusion des résumés
            setTrend(trendRes.data || [])
            setTopRepeats(Array.isArray(repTop.data) ? repTop.data.slice(0, 10) : [])
            setTopPairs(Array.isArray(coPairs.data) ? coPairs.data.slice(0, 10) : [])
        }
      })
      .catch((err) => {
        console.error("Erreur critique dashboard:", err)
        setError("Erreur de connexion au serveur.")
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500">Chargement du tableau de bord...</p>
    </div>
  )

  if (error || !summary) return (
    <div className="p-8 flex justify-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <p>{error || "Données non disponibles. Veuillez uploader un fichier CSV."}</p>
            <Link href="/" className="underline font-bold ml-2">Aller à l'upload</Link>
        </div>
    </div>
  )

  return (
    <div className="space-y-8 p-6 md:p-10 bg-gray-50 min-h-screen">

      {/* 🔹 En-tête et Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            LabLens <span className="text-blue-600">Dashboard</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Vue d'ensemble des résultats biologiques</p>
        </div>
        
      </div>

      {/* 🔹 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Lignes" value={summary.total_rows?.toLocaleString()} />
        <StatCard label="Patients" value={summary.total_patients?.toLocaleString()} />
        <StatCard label="Tests Uniques" value={summary.total_tests?.toLocaleString()} />
        <StatCard label="Services" value={summary.total_services?.toLocaleString()} />
        <StatCard label="Tests Répétés" value={summary.tests_repeated?.toLocaleString() || "0"} isHighlight />
      </div>

      {/* 📈 Évolution mensuelle */}
      {trend.length > 0 && (
        <ChartCard title="📅 Évolution mensuelle du volume de tests">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="total_tests" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* 📊 Répartition Sexe & Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsBySex />
        <StatsByService />
      </div>

      {/* 🔝 Top Sections (CORRIGÉES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Carte Répétitions */}
        <ChartCard title="🏆 Top 10 Tests Répétés">
          {topRepeats && topRepeats.length > 0 ? (
            <ul className="space-y-3">
              {topRepeats.map((t: any, i: number) => (
                <li key={i} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                  <span className="font-medium text-gray-700 text-sm truncate w-2/3">
                    {t.nombre || t.test_name || "Inconnu"}
                  </span>
                  <span className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded-full font-bold text-xs">
                    {t.patient_count || t.count || 0} patients
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="Aucune donnée de répétition trouvée." />
          )}
        </ChartCard>

        {/* Carte Co-Prescriptions */}
        <ChartCard title="🔗 Top 10 Paires Co-prescrites">
          {topPairs && topPairs.length > 0 ? (
            <ul className="space-y-3">
              {topPairs.map((p: any, i: number) => (
                <li key={i} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                  <span className="text-gray-700 text-sm font-medium truncate w-2/3">
                    {p.test1} <span className="text-gray-400 mx-1">+</span> {p.test2}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs">
                    {p.co_occurrences || p.count || 0} fois
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="Aucune co-prescription significative détectée." />
          )}
        </ChartCard>
      </div>

    </div>
  )
}

/* 🔸 Composants Réutilisables */

function StatCard({ label, value, isHighlight = false }: { label: string; value: any, isHighlight?: boolean }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 transition hover:shadow-md ${isHighlight ? 'border-l-4 border-l-blue-500' : ''}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        {title}
      </h2>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm italic">{text}</p>
        </div>
    )
}