 'use client'

import RepeatsSummary from '@/components/repeats/RepeatsSummary'
import RepeatsTrendChart from '@/components/repeats/RepeatsTrendChart'
import TopRepeatedTests from '@/components/repeats/TopRepeatedTests'
import PatientRepeatsViewer from '@/components/repeats/PatientRepeatsViewer'

export default function RepeatsPage() {
  return (
    <div className="space-y-10 p-8">
      <h1 className="text-3xl font-bold text-gray-900">🔁 Tests Répétés</h1>

      {/* Cartes de résumé */}
      <RepeatsSummary />

      {/* Line chart plein écran */}
      <RepeatsTrendChart />

      {/* Bar chart horizontal (Top 10) */}
      <TopRepeatedTests />

      {/* Recherche par patient */}
      <PatientRepeatsViewer />
    </div>
  )
}