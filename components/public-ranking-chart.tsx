"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Sample data for top 10 teams
const data = [
  { name: "Los Campeones", goals: 342, color: "#16a34a" },
  { name: "Equipo Ganador", goals: 315, color: "#16a34a" },
  { name: "Los Invencibles", goals: 298, color: "#16a34a" },
  { name: "Fuerza Total", goals: 276, color: "#16a34a" },
  { name: "Los Triunfadores", goals: 254, color: "#16a34a" },
  { name: "Equipo Estrella", goals: 243, color: "#16a34a" },
  { name: "Los Líderes", goals: 231, color: "#16a34a" },
  { name: "Equipo Élite", goals: 225, color: "#16a34a" },
  { name: "Los Victoriosos", goals: 218, color: "#16a34a" },
  { name: "Equipo Campeón", goals: 210, color: "#16a34a" },
].map((item, index) => ({
  ...item,
  color: index === 0 ? "#f59e0b" : index === 1 ? "#94a3b8" : index === 2 ? "#d97706" : "#16a34a",
}))

export function PublicRankingChart() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-full flex items-center justify-center">Cargando gráfico...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
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
