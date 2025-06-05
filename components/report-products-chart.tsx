"use client"

import { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

// Sample data
const data = [
  { name: "NAVIUS 500GR", value: 450, color: "#4ade80" }, // 45 goles * 10kg = 450kg
  { name: "NAVIUS 100GR", value: 90, color: "#f59e0b" }, // 9 goles * 10kg = 90kg
  { name: "Producto C", value: 980, color: "#3b82f6" },
  { name: "Producto D", value: 1160, color: "#a855f7" },
]

export function ReportProductsChart() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-[300px] flex items-center justify-center">Cargando gráfico...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, value, percent }) => `${name}: ${value}kg (${(percent * 100).toFixed(0)}%)`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} kg`, "Volumen"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
