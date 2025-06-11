"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertCircle } from "lucide-react"

type Team = {
  team_id: string
  team_name: string
  goals: number
  position?: number
}

type AdminRankingChartProps = {
  teams: Team[] // Ahora esperamos que los equipos ya vengan filtrados/limitados
}

export function AdminRankingChart({ teams }: AdminRankingChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-full flex items-center justify-center">Cargando gráfico...</div>
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">No hay datos de equipos para mostrar</p>
        <p className="text-xs text-muted-foreground text-center">
          Asegúrate de que los equipos tengan puntuación válida.
        </p>
      </div>
    )
  }

  // Los equipos ya vienen pre-filtrados (ej. top 3) desde el componente padre
  const chartData = teams.map((team, index) => ({
    name: team.team_name || "Sin nombre",
    goals: team.goals || 0,
    color: index === 0 ? "#f59e0b" : index === 1 ? "#94a3b8" : index === 2 ? "#d97706" : "#16a34a", // Colores para top 3
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
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
