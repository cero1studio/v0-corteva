"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Sample data
const data = [
  { name: "Lun", ventas: 24, goles: 48 },
  { name: "Mar", ventas: 18, goles: 36 },
  { name: "Mié", ventas: 22, goles: 44 },
  { name: "Jue", ventas: 26, goles: 52 },
  { name: "Vie", ventas: 32, goles: 64 },
  { name: "Sáb", ventas: 28, goles: 56 },
  { name: "Dom", ventas: 20, goles: 40 },
]

export function ReportSalesChart() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-[300px] flex items-center justify-center">Cargando gráfico...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="ventas" name="Ventas" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="goles" name="Goles" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
