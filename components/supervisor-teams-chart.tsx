"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Sample data
const data = [
  { name: "Los Campeones", goals: 342, sales: 168, clients: 24 },
  { name: "Equipo Estrella", goals: 243, sales: 120, clients: 18 },
  { name: "Los Guerreros", goals: 198, sales: 95, clients: 15 },
  { name: "Equipo Fuerte", goals: 176, sales: 85, clients: 12 },
  { name: "Los Tigres", goals: 154, sales: 75, clients: 10 },
]

export function SupervisorTeamsChart() {
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
        <YAxis yAxisId="left" orientation="left" stroke="#4ade80" />
        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="sales" name="Ventas" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" dataKey="goals" name="Goles" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
