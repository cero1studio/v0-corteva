"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, LineChartIcon } from "lucide-react"
import { EmptyState } from "./empty-state"
import { Button } from "@/components/ui/button"

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
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [retryCount])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Obtener equipos primero
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("id, name").order("name")

      if (teamsError) {
        throw new Error(`Error al obtener equipos: ${teamsError.message}`)
      }

      if (!teamsData || teamsData.length === 0) {
        setData([])
        setTeams([])
        setLoading(false)
        return
      }

      // Asignar colores a los equipos
      const colors = [
        "#f59e0b",
        "#4ade80",
        "#3b82f6",
        "#ec4899",
        "#8b5cf6",
        "#14b8a6",
        "#f43f5e",
        "#06b6d4",
        "#eab308",
        "#a855f7",
        "#10b981",
        "#ef4444",
        "#6366f1",
        "#84cc16",
        "#d946ef",
        "#0ea5e9",
        "#f97316",
        "#14b8a6",
        "#8b5cf6",
        "#22c55e",
      ]

      const teamsWithColors = teamsData.map((team, index) => ({
        ...team,
        color: colors[index % colors.length],
      }))

      setTeams(teamsWithColors)

      // 2. Obtener ventas
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("points, representative_id, team_id, created_at")

      if (salesError) {
        throw new Error(`Error al obtener ventas: ${salesError.message}`)
      }

      // 3. Obtener perfiles para mapear representantes a equipos
      const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("id, team_id")

      if (profilesError) {
        throw new Error(`Error al obtener perfiles: ${profilesError.message}`)
      }

      // 4. Obtener clientes competidores
      const { data: clientsData, error: clientsError } = await supabase
        .from("competitor_clients")
        .select("points, representative_id, team_id, created_at")

      if (clientsError) {
        throw new Error(`Error al obtener clientes: ${clientsError.message}`)
      }

      // 5. Obtener tiros libres
      const { data: freeKicksData, error: freeKicksError } = await supabase
        .from("free_kick_goals")
        .select("points, team_id, created_at")

      if (freeKicksError) {
        throw new Error(`Error al obtener tiros libres: ${freeKicksError.message}`)
      }

      // 6. Obtener configuración de puntos para gol
      const { data: configData, error: configError } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      if (configError) {
        throw new Error(`Error al obtener configuración: ${configError.message}`)
      }

      const puntosParaGol = configData?.value ? Number(configData.value) : 100

      // Crear mapa para búsquedas eficientes
      const profileTeamMap = new Map((profilesData || []).map((p) => [p.id, p.team_id]))

      // Calcular puntos por equipo y por semana
      const weeklyTeamPoints: Record<string, Record<string, number>> = {}

      // Función para procesar entradas (ventas, clientes, tiros libres)
      const processEntry = (entry: any, type: "sales" | "clients" | "freeKicks") => {
        if (!entry.created_at) return

        const date = new Date(entry.created_at)
        const weekNumber = getWeekNumber(date)
        const weekName = `Semana ${weekNumber}`

        let teamId = entry.team_id

        // Si no hay team_id pero hay representative_id, buscar el equipo del representante
        if (!teamId && entry.representative_id) {
          teamId = profileTeamMap.get(entry.representative_id)
        }

        if (teamId) {
          if (!weeklyTeamPoints[weekName]) {
            weeklyTeamPoints[weekName] = {}
          }

          const pointsToAdd = entry.points || 0
          weeklyTeamPoints[weekName][teamId] = (weeklyTeamPoints[weekName][teamId] || 0) + pointsToAdd
        }
      }

      // Procesar todas las entradas
      salesData?.forEach((s) => processEntry(s, "sales"))
      clientsData?.forEach((c) => processEntry(c, "clients"))
      freeKicksData?.forEach((fk) => processEntry(fk, "freeKicks"))

      // Generar datos para el gráfico
      const chartData: WeeklyData[] = []

      // Ordenar semanas por número
      const sortedWeekNames = Object.keys(weeklyTeamPoints).sort((a, b) => {
        const weekNumA = Number.parseInt(a.replace("Semana ", ""))
        const weekNumB = Number.parseInt(b.replace("Semana ", ""))
        return weekNumA - weekNumB
      })

      // Crear datos acumulativos para el gráfico
      const cumulativePoints: Record<string, number> = {}

      sortedWeekNames.forEach((weekName) => {
        const weekData: WeeklyData = { name: weekName }

        teamsWithColors.forEach((team) => {
          // Inicializar puntos acumulados si es necesario
          if (!cumulativePoints[team.id]) {
            cumulativePoints[team.id] = 0
          }

          // Sumar puntos de esta semana
          const pointsThisWeek = weeklyTeamPoints[weekName][team.id] || 0
          cumulativePoints[team.id] += pointsThisWeek

          // Convertir puntos acumulados a goles
          weekData[team.id] = Math.floor(cumulativePoints[team.id] / puntosParaGol)
        })

        chartData.push(weekData)
      })

      setData(chartData)
      setLoading(false)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
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

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
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
        onClick={handleRetry}
        className="h-[300px]"
        iconClassName="bg-red-50"
      />
    )
  }

  if (data.length === 0 || teams.length === 0) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="No hay datos suficientes"
        description="Registra ventas para ver la evolución del concurso."
        actionLabel="Reintentar"
        onClick={handleRetry}
        className="h-[300px]"
      />
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRetry}>
          Actualizar gráfico
        </Button>
      </div>
    </div>
  )
}
