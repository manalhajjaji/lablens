'use client'

import { useEffect, useState } from 'react'
import { repeats } from '@/lib/api'

export default function RepeatsSummary() {
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    repeats.summary().then(res => setSummary(res.data))
  }, [])

  if (!summary) return <p className="text-gray-500">Chargement...</p>

  const cards = [
    { label: "Patients avec Répétitions", value: summary.patients_with_repeats },
    { label: "Tests Répétés", value: summary.tests_repeated },
    { label: "Moyenne Répétitions", value: summary.avg_repeats },
    { label: "Max Répétitions", value: summary.max_repeats },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {cards.map((c, i) => (
        <div key={i} className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">{c.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
        </div>
      ))}
    </div>
  )
}
