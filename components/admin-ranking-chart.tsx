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
  teams?: Team[] | null
}

export function AdminRankingChart({ teams: propTeams }: AdminRankingChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    setLoading(false)
  }, [])

  if (!isMounted) {
    return <div className="h-full flex items-center justify-center">Cargando gráfico...</div>
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-2">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-muted-foreground text-center">{error}</p>
      </div>
    )
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center">Cargando datos del ranking...</div>
  }

  // Verificar si hay equipos para mostrar - asegurar que teams sea un array
  const teamsArray = Array.isArray(propTeams) ? propTeams : []

  if (teamsArray.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-2">
        <p className="text-sm font-medium">No hay datos de equipos</p>
        <p className="text-xs text-muted-foreground text-center">
          Aún no hay equipos registrados con puntuación para mostrar en el ranking.
        </p>
      </div>
    )
  }

  // Tomar los 10 mejores equipos - usar teamsArray para asegurar que es iterable
  const top10Teams = teamsArray
    .filter((team) => team && typeof team.goals === "number") // Filtrar equipos válidos
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10)
    .map((team, index) => ({
      name: team.team_name || "Sin nombre",
      goals: team.goals || 0,
      color: index === 0 ? "#f59e0b" : index === 1 ? "#94a3b8" : index === 2 ? "#d97706" : "#16a34a",
    }))

  if (top10Teams.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-2">
        <p className="text-sm font-medium">No hay datos válidos</p>
        <p className="text-xs text-muted-foreground text-center">Los equipos no tienen datos de puntuación válidos.</p>
      </div>
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
