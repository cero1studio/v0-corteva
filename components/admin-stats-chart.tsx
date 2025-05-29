"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, LineChartIcon } from "lucide-react"
import { EmptyState } from "./empty-state"

// Estructura simplificada para datos del gráfico
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
        // Generar datos de ejemplo para mostrar el gráfico
        const exampleData = Array.from({ length: 4 }, (_, i) => ({
          name: `Semana ${i + 1}`,
          ejemplo: Math.floor(Math.random() * 100),
        }))
        setData(exampleData)
        setTeams([{ id: "ejemplo", name: "Datos de ejemplo", color: "#16a34a" }])
        setLoading(false)
        return
      }

      // 1. Obtener equipos
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("id, name")

      if (teamsError) {
        // Si es un error de red y no hemos alcanzado el máximo de reintentos
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
        // Generar datos de ejemplo si no hay equipos
        const exampleTeams = [
          { id: "team1", name: "Equipo Ejemplo 1", color: "#f59e0b" },
          { id: "team2", name: "Equipo Ejemplo 2", color: "#4ade80" },
        ]
        setTeams(exampleTeams)

        const exampleData = Array.from({ length: 4 }, (_, i) => ({
          name: `Semana ${i + 1}`,
          team1: Math.floor(Math.random() * 50),
          team2: Math.floor(Math.random() * 50),
        }))
        setData(exampleData)
        setLoading(false)
        return
      }

      // 2. Obtener todas las ventas
      const { data: salesData, error: salesError } = await supabase.from("sales").select("*").order("created_at")

      if (salesError) {
        // Si es un error de red y no hemos alcanzado el máximo de reintentos
        if (salesError.message?.includes("Failed to fetch") && retry < maxRetries) {
          console.log(`Error de red al obtener ventas, reintentando... (${retry + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return fetchData(retry + 1)
        }
        throw salesError
      }

      if (!salesData || salesData.length === 0) {
        // Generar datos de ejemplo vacíos
        const emptyData = Array.from({ length: 4 }, (_, i) => ({
          name: `Semana ${i + 1}`,
          ...Object.fromEntries(teamsWithColors.map((team) => [team.id, 0])),
        }))

        setData(emptyData)
        setLoading(false)
        return
      }

      // 3. Procesar datos para el gráfico
      const weeklyData: Record<string, Record<string, number>> = {}

      salesData.forEach((sale) => {
        const date = new Date(sale.created_at)
        const weekNumber = getWeekNumber(date)
        const weekLabel = `Semana ${weekNumber}`

        if (!weeklyData[weekLabel]) {
          weeklyData[weekLabel] = {}
          teamsWithColors.forEach((team) => {
            weeklyData[weekLabel][team.id] = 0
          })
        }

        const teamId = sale.team_id || sale.id_team
        if (teamId && weeklyData[weekLabel][teamId] !== undefined) {
          weeklyData[weekLabel][teamId] = (weeklyData[weekLabel][teamId] || 0) + (sale.points || 0)
        }
      })

      // 4. Convertir a formato para Recharts
      const chartData = Object.keys(weeklyData).map((week) => {
        const weekData: WeeklyData = { name: week }

        teamsWithColors.forEach((team) => {
          weekData[team.id] = weeklyData[week][team.id] || 0
        })

        return weekData
      })

      // Ordenar por número de semana
      chartData.sort((a, b) => {
        const weekA = Number.parseInt(a.name.replace("Semana ", ""))
        const weekB = Number.parseInt(b.name.replace("Semana ", ""))
        return weekA - weekB
      })

      setData(chartData)
      setRetryCount(0) // Resetear contador de reintentos en caso de éxito
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico:", err)

      // Si es un error de red genérico y no hemos alcanzado el máximo de reintentos
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
        description="Registra ventas para ver la evolución del concurso por semanas."
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
        <Tooltip />
        <Legend />
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
