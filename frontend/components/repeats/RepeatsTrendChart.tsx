'use client'

import { useEffect, useState } from 'react'
import { repeats } from '@/lib/api'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export default function RepeatsTrendChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    repeats.trend().then((res) => {
      
      const sorted = res.data.sort((a: any, b: any) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
      setData(sorted)
    })
  }, [])

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Évolution Journalière des Tests Répétés
      </h2>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="Date"
              tick={{ fontSize: 11, fill: '#111827' }}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fill: '#111827' }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total_repeats"
              stroke="#2563EB"
              strokeWidth={3}
              dot={false}
              name="Total des répétitions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}