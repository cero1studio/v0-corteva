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

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // 1. Obtener equipos
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("id, name")

      if (teamsError) throw teamsError

      // Asignar colores a los equipos
      const colors = ["#f59e0b", "#4ade80", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"]
      const teamsWithColors = teamsData.map((team, index) => ({
        ...team,
        color: colors[index % colors.length],
      }))

      setTeams(teamsWithColors)

      if (teamsData.length === 0) {
        // Si no hay equipos, no hay nada que mostrar
        setData([])
        setLoading(false)
        return
      }

      // 2. Verificar la estructura de la tabla sales
      const { data: salesStructure, error: structureError } = await supabase.from("sales").select().limit(1)

      if (structureError) throw structureError

      // Datos de prueba si no hay ventas
      if (salesStructure.length === 0 || !salesStructure[0]) {
        const mockData = [{ name: "Semana 1" }, { name: "Semana 2" }, { name: "Semana 3" }, { name: "Semana 4" }]

        teamsWithColors.forEach((team) => {
          mockData.forEach((week) => {
            week[team.id] = 0
          })
        })

        setData(mockData)
        setLoading(false)
        return
      }

      // Ahora sabemos qué columnas existen en la tabla sales
      console.log("Estructura de sales:", salesStructure[0])

      // 3. Obtener todas las ventas
      const { data: salesData, error: salesError } = await supabase.from("sales").select("*").order("created_at")

      if (salesError) throw salesError

      if (salesData.length === 0) {
        // Generar datos de ejemplo vacíos
        const emptyData = Array.from({ length: 4 }, (_, i) => ({
          name: `Semana ${i + 1}`,
          ...Object.fromEntries(teamsWithColors.map((team) => [team.id, 0])),
        }))

        setData(emptyData)
        setLoading(false)
        return
      }

      // 4. Procesar datos para el gráfico adaptándonos a la estructura real
      const weeklyData: Record<string, Record<string, number>> = {}

      // Identificamos qué columna contiene el ID del equipo
      const teamIdColumn = salesStructure[0].hasOwnProperty("team_id") ? "team_id" : "id_team"

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

        const teamId = sale[teamIdColumn]
        if (teamId) {
          weeklyData[weekLabel][teamId] = (weeklyData[weekLabel][teamId] || 0) + (sale.points || 0)
        }
      })

      // 5. Convertir a formato para Recharts
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
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
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
        actionLabel="Reintentar"
        onClick={fetchData}
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
