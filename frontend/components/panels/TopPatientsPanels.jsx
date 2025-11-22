"use client"

import { useEffect, useState } from "react"
import { panels } from "@/lib/api"

export default function TopPatientsPanels() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    panels.topPatients().then(res => setRows(res.data))
  }, [])

  return (
    <div className="bg-white shadow rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-black mb-4">Top Patients avec le plus de Panels</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Numorden</th>
              <th className="px-3 py-2 text-left">Panels</th>
              <th className="px-3 py-2 text-left">Tests Totaux</th>
              <th className="px-3 py-2 text-left">Moy Tests/panel</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{r.numorden}</td>
                <td className="px-3 py-2">{r.panel_count}</td>
                <td className="px-3 py-2">{r.total_tests}</td>
                <td className="px-3 py-2">{r.avg_tests_per_panel.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}