"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, LineChartIcon } from "lucide-react"
import { EmptyState } from "./empty-state"

// Estructura para datos del gráfico
type WeeklyData = {
  name: string
  [key: string]: any
}

export function AdminStatsChart() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<WeeklyData[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string; color: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Obtener todos los datos necesarios en paralelo
      const [teamsResult, profilesResult, salesResult, clientsResult, freeKicksResult, puntosConfigResult] =
        await Promise.all([
          supabase.from("teams").select("id, name").order("name"),
          supabase.from("profiles").select("id, team_id"),
          supabase.from("sales").select("points, representative_id, team_id, created_at"),
          supabase.from("competitor_clients").select("id, points, representative_id, team_id, created_at"),
          supabase.from("free_kick_goals").select("points, team_id, created_at"),
          supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
        ])

      // Manejar errores de las llamadas en paralelo
      if (teamsResult.error) throw teamsResult.error
      if (profilesResult.error) throw profilesResult.error
      if (salesResult.error) throw salesResult.error
      if (clientsResult.error) throw clientsResult.error
      if (freeKicksResult.error) throw freeKicksResult.error
      if (puntosConfigResult.error) throw puntosConfigResult.error

      const teamsData = teamsResult.data || []
      const profiles = profilesResult.data || []
      const sales = salesResult.data || []
      const clients = clientsResult.data || []
      const freeKicks = freeKicksResult.data || []
      const puntosParaGol = puntosConfigResult.data?.value ? Number(puntosConfigResult.data.value) : 100

      if (!teamsData || teamsData.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // Asignar colores a los equipos
      const colors = ["#f59e0b", "#4ade80", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e", "#06b6d4"]
      const teamsWithColors = teamsData.map((team, index) => ({
        ...team,
        color: colors[index % colors.length],
      }))
      setTeams(teamsWithColors)

      // Crear mapas para búsquedas eficientes
      const profileTeamMap = new Map(profiles.map((p) => [p.id, p.team_id]))

      // Calcular puntos por equipo y por semana
      const weeklyTeamPoints: Record<string, Record<string, number>> = {} // { week_name: { team_id: points } }

      const processEntry = (entry: any, type: "sales" | "clients" | "freeKicks") => {
        const date = new Date(entry.created_at)
        const weekName = `Semana ${getWeekNumber(date)}`
        let teamId = entry.team_id

        if (!teamId && entry.representative_id) {
          teamId = profileTeamMap.get(entry.representative_id)
        }

        if (teamId) {
          if (!weeklyTeamPoints[weekName]) {
            weeklyTeamPoints[weekName] = {}
          }
          const pointsToAdd = type === "clients" ? entry.points || 200 : entry.points || 0
          weeklyTeamPoints[weekName][teamId] = (weeklyTeamPoints[weekName][teamId] || 0) + pointsToAdd
        }
      }

      sales.forEach((s) => processEntry(s, "sales"))
      clients.forEach((c) => processEntry(c, "clients"))
      freeKicks.forEach((fk) => processEntry(fk, "freeKicks"))

      // Generar datos para el gráfico
      const chartData: WeeklyData[] = []
      const sortedWeekNames = Object.keys(weeklyTeamPoints).sort((a, b) => {
        const weekNumA = Number.parseInt(a.replace("Semana ", ""))
        const weekNumB = Number.parseInt(b.replace("Semana ", ""))
        return weekNumA - weekNumB
      })

      sortedWeekNames.forEach((weekName) => {
        const weekData: WeeklyData = { name: weekName }
        teamsWithColors.forEach((team) => {
          const totalPointsForTeamInWeek = weeklyTeamPoints[weekName][team.id] || 0
          weekData[team.id] = Math.floor(totalPointsForTeamInWeek / puntosParaGol) // Convert points to goals
        })
        chartData.push(weekData)
      })

      setData(chartData)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return weekNo
  }

  if (!isMounted) {
    return <div className="h-[300px] flex items-center justify-center">Cargando gráfico...</div>
  }

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar datos"
        description={error}
        actionLabel="Reintentar"
        onClick={fetchData}
        className="h-[300px]"
        iconClassName="bg-red-50"
      />
    )
  }

  if (data.length === 0 || teams.length === 0) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="No hay equipos registrados"
        description="Crea equipos para ver la evolución del concurso."
        actionLabel="Crear equipo"
        actionHref="/admin/equipos/nuevo"
        className="h-[300px]"
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => {
            const team = teams.find((t) => t.id === name)
            return [`${value} goles`, team?.name || name]
          }}
          labelFormatter={(label) => `${label}`}
        />
        <Legend
          formatter={(value) => {
            const team = teams.find((t) => t.id === value)
            return team?.name || value
          }}
        />
        {teams.map((team) => (
          <Line
            key={team.id}
            type="monotone"
            dataKey={team.id}
            name={team.name}
            stroke={team.color}
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
