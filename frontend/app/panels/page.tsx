"use client"

import { useEffect, useState } from "react"
import { panels } from "@/lib/api"
import PanelDistribution from "@/components/panels/PanelDistribution"
import TopPatientsPanels from "@/components/panels/TopPatientsPanels"
import PatientPanelsViewer from "@/components/panels/PatientPanelsViewer"

interface PanelSummary {
  total_panels: number;
  avg_tests_per_panel: number;
  min_tests: number;
  max_tests: number;
  distribution: any;
}

export default function PanelsPage() {
  const [summary, setSummary] = useState<PanelSummary | null>(null)

  useEffect(() => {
    panels.summary().then(res => setSummary(res.data))
  }, [])

  if (!summary) return <p className="p-8 text-center text-gray-600">Chargement...</p>

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📦 Panels</h1>
        {/*  Bouton Export CSV */}
        <button
          onClick={async () => {
            try {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
              const res = await fetch(`${apiUrl}/export/panels/csv`)

              if (!res.ok) {
                 throw new Error(`Erreur HTTP: ${res.status}`)
              }

              const blob = await res.blob()
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = "panels_export.csv"
              document.body.appendChild(a) // Requis pour Firefox
              a.click()
              a.remove() // Nettoyage
              window.URL.revokeObjectURL(url)
            } catch (err) {
              console.error("Erreur download:", err)
              alert("Impossible de télécharger le fichier. Vérifiez que le serveur tourne.")
            }
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 transition"
        >
          Export CSV
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Total Panels" value={summary.total_panels} />
        <StatCard label="Moyenne Tests/Panel" value={summary.avg_tests_per_panel} />
        <StatCard label="Min Tests Panel" value={summary.min_tests} />
        <StatCard label="Max Tests Panel" value={summary.max_tests} />
      </div>

      {/* 🔹 Grille avec distribution + évolution */}
      <div>
        <PanelDistribution distribution={summary.distribution} />
      </div>

      <TopPatientsPanels />
      <PatientPanelsViewer />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
      <p className="text-black text-sm">{label}</p>
      <p className="text-2xl font-bold text-black mt-1">{value}</p>
    </div>
  )
}