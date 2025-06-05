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
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const fetchData = async (retry = 0) => {
    try {
      setLoading(true)
      setError(null)

      // Verificar que tengamos una sesión válida
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        console.log("No hay sesión activa para cargar el gráfico")
        setData([])
        setLoading(false)
        return
      }

      // 1. Obtener equipos
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("id, name")

      if (teamsError) {
        if (teamsError.message?.includes("Failed to fetch") && retry < maxRetries) {
          console.log(`Error de red al obtener equipos, reintentando... (${retry + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return fetchData(retry + 1)
        }
        throw teamsError
      }

      // Asignar colores a los equipos
      const colors = ["#f59e0b", "#4ade80", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"]
      const teamsWithColors = (teamsData || []).map((team, index) => ({
        ...team,
        color: colors[index % colors.length],
      }))

      setTeams(teamsWithColors)

      if (!teamsData || teamsData.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // 2. Obtener ventas y tiros libres para calcular goles totales
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("team_id, points, created_at")
        .order("created_at")

      if (salesError) {
        if (salesError.message?.includes("Failed to fetch") && retry < maxRetries) {
          console.log(`Error de red al obtener ventas, reintentando... (${retry + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return fetchData(retry + 1)
        }
        throw salesError
      }

      // 3. Obtener tiros libres
      const { data: freeKickData, error: freeKickError } = await supabase
        .from("free_kick_goals")
        .select("team_id, goals, created_at")
        .order("created_at")

      if (freeKickError) {
        console.log("Error al obtener tiros libres, continuando sin ellos:", freeKickError)
      }

      // 4. Combinar datos de ventas y tiros libres
      const allGoalData = []

      // Agregar goles de ventas
      if (salesData && salesData.length > 0) {
        salesData.forEach((sale) => {
          allGoalData.push({
            team_id: sale.team_id,
            goals: sale.points || 0,
            created_at: sale.created_at,
            type: "venta",
          })
        })
      }

      // Agregar goles de tiros libres
      if (freeKickData && freeKickData.length > 0) {
        freeKickData.forEach((freeKick) => {
          allGoalData.push({
            team_id: freeKick.team_id,
            goals: freeKick.goals || 0,
            created_at: freeKick.created_at,
            type: "tiro_libre",
          })
        })
      }

      if (allGoalData.length === 0) {
        // Generar datos de ejemplo vacíos
        const emptyData = Array.from({ length: 4 }, (_, i) => ({
          name: `Semana ${i + 1}`,
          ...Object.fromEntries(teamsWithColors.map((team) => [team.id, 0])),
        }))

        setData(emptyData)
        setLoading(false)
        return
      }

      // 5. Procesar datos por semana
      const weeklyData: Record<string, Record<string, number>> = {}

      allGoalData.forEach((goalRecord) => {
        const date = new Date(goalRecord.created_at)
        const weekNumber = getWeekNumber(date)
        const weekLabel = `Semana ${weekNumber}`

        if (!weeklyData[weekLabel]) {
          weeklyData[weekLabel] = {}
          teamsWithColors.forEach((team) => {
            weeklyData[weekLabel][team.id] = 0
          })
        }

        const teamId = goalRecord.team_id
        if (teamId && weeklyData[weekLabel][teamId] !== undefined) {
          weeklyData[weekLabel][teamId] = (weeklyData[weekLabel][teamId] || 0) + goalRecord.goals
        }
      })

      // 6. Convertir a formato acumulativo para Recharts
      const chartData = Object.keys(weeklyData).map((week) => {
        const weekData: WeeklyData = { name: week }

        teamsWithColors.forEach((team) => {
          weekData[team.id] = weeklyData[week][team.id] || 0
        })

        return weekData
      })

      // Ordenar por número de semana y hacer acumulativo
      chartData.sort((a, b) => {
        const weekA = Number.parseInt(a.name.replace("Semana ", ""))
        const weekB = Number.parseInt(b.name.replace("Semana ", ""))
        return weekA - weekB
      })

      // Hacer los datos acumulativos
      const accumulativeData = chartData.map((weekData, index) => {
        const newWeekData = { ...weekData }

        if (index > 0) {
          teamsWithColors.forEach((team) => {
            newWeekData[team.id] = (chartData[index - 1][team.id] || 0) + (weekData[team.id] || 0)
          })
        }

        return newWeekData
      })

      setData(accumulativeData)
      setRetryCount(0)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico:", err)

      if (err.message?.includes("Failed to fetch") && retry < maxRetries) {
        console.log(`Error de red general, reintentando... (${retry + 1}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return fetchData(retry + 1)
      }

      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
      setRetryCount(retry)
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener el número de semana
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
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
        actionLabel={retryCount < maxRetries ? "Reintentar" : "Recargar página"}
        onClick={retryCount < maxRetries ? () => fetchData(retryCount + 1) : () => window.location.reload()}
        className="h-[300px]"
        iconClassName="bg-red-50"
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="No hay datos de evolución"
        description="Registra ventas o tiros libres para ver la evolución del concurso por semanas."
        actionLabel="Configurar productos"
        actionHref="/admin/productos"
        className="h-[300px]"
      />
    )
  }

  // Renderizar el gráfico cuando hay datos
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => {
            const team = teams.find((t) => t.id === name)
            return [value, team?.name || name]
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
