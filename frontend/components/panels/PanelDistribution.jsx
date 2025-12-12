"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const palette = ["#1D3557","#457B9D","#718DA3","#A8DADC","#E63946","#F28482"]

export default function PanelDistribution({ distribution }) {
  return (
    <div className="bg-white shadow rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-black mb-4">
        Distribution du nombre de tests par panel
      </h2>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution}>
            <XAxis dataKey="n_tests" stroke="#000" />
            <YAxis stroke="#000" />
            <Tooltip />
            <Bar dataKey="count">
              {distribution.map((d, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}