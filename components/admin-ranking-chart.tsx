"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Team = {
  id: string
  name: string
  goals: number
  position?: number
}

type AdminRankingChartProps = {
  teams: Team[]
}

export function AdminRankingChart({ teams }: AdminRankingChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-full flex items-center justify-center">Cargando gráfico...</div>
  }

  // Tomar los 10 mejores equipos
  const top10Teams = [...teams]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10)
    .map((team, index) => ({
      name: team.name,
      goals: team.goals,
      color: index === 0 ? "#f59e0b" : index === 1 ? "#94a3b8" : index === 2 ? "#d97706" : "#16a34a",
    }))

  if (top10Teams.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">No hay datos suficientes para mostrar el gráfico</div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={top10Teams}
        layout="vertical"
        margin={{
          top: 20,
          right: 30,
          left: 100,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={100} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="goals"
          name="Goles"
          radius={[0, 4, 4, 0]}
          fill="#16a34a"
          label={{ position: "right", fill: "#16a34a", fontSize: 12 }}
          barSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
