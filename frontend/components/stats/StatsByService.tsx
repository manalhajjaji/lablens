"use client"

import { useEffect, useState } from "react"
import { stats } from "@/lib/api"
import { ResponsiveContainer, Treemap, Tooltip, Cell } from "recharts"

const palette = [
  "#457B9D","#A8DADC","#1D3557","#2EC4B6","#F28482","#E63946","#8D99AE",
  "#118AB2","#06D6A0","#FFD166","#073B4C","#CBF3F0","#FFBF69","#D0F4DE"
]

export default function StatsByService() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    stats.byService().then(res => setData(res.data))
  }, [])

  const treemapData = data.map((d: any) => ({
    name: d.service || "Unknown",
    size: d.test_count
  }))

  return (
    <div className="bg-white shadow rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Tests par Service</h2>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={treemapData} dataKey="size"  >
            {treemapData.map((entry, index) => (
              <Cell key={index} fill={palette[index % palette.length]} />
            ))}
            <Tooltip />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  )
}