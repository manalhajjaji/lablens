"use client"

import { useEffect, useState } from "react"
import { stats } from "@/lib/api"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

const COLORS: { [key in 'F' | 'M']: string } = {
  F: "#E63946", // Femmes
  M: "#1D5DFF", // Hommes
}

const renderOutsideLabel = (props: any) => {
  const RADIAN = Math.PI / 180
  const { cx, cy, midAngle, outerRadius, percent, name } = props
  const radius = outerRadius * 1.3
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="#111"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize="15"
      fontWeight="600"
    >
      {`${name} (${(percent * 100).toFixed(1)}%)`}
    </text>
  )
}

export default function StatsBySex() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    stats.bySex().then(res => setData(res.data))
  }, [])

  const formattedData = data
    .filter(d => d.sexo === "F" || d.sexo === "M")
    .map(d => ({
      name: d.sexo === "F" ? "Femmes" : "Hommes",
      value: d.patients,
      sexo: d.sexo as 'F' | 'M',
    }))

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
         Répartition par Sexe
      </h2>

      <div className="h-[320px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formattedData}
              dataKey="value"
              cx="45%"
              cy="50%"
              outerRadius={110}
              labelLine={true}
              label={renderOutsideLabel}
            >
              {formattedData.map((item, idx) => (
                <Cell key={idx} fill={COLORS[item.sexo] ?? "#999"} />
              ))}
            </Pie>

            {}
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              wrapperStyle={{
                fontSize: "1rem",
                fontWeight: 600,
              }}
            />

            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value.toLocaleString()} patients`,
                props.payload.name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}