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

      // 1. Obtener equipos
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("id, name").order("name")

      if (teamsError) throw teamsError

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

      // 2. Obtener configuración de puntos para gol
      const { data: puntosConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

      // 3. Calcular goles totales actuales por equipo (usando la misma lógica del ranking)
      const teamGoals: Record<string, number> = {}

      for (const team of teamsData) {
        // Obtener miembros del equipo
        const { data: teamMembers } = await supabase.from("profiles").select("id").eq("team_id", team.id)

        const memberIds = teamMembers?.map((member) => member.id) || []

        // Obtener puntos de ventas
        let totalPointsFromSales = 0
        if (memberIds.length > 0) {
          const { data: sales } = await supabase.from("sales").select("points").in("representative_id", memberIds)

          if (sales) {
            totalPointsFromSales = sales.reduce((sum, sale) => sum + (sale.points || 0), 0)
          }
        }

        // Obtener clientes del equipo
        let totalClients = 0
        if (memberIds.length > 0) {
          const { count: clientsCount } = await supabase
            .from("competitor_clients")
            .select("*", { count: "exact", head: true })
            .in("representative_id", memberIds)

          totalClients = clientsCount || 0
        }

        // Obtener tiros libres del equipo
        const { data: freeKicks } = await supabase.from("free_kick_goals").select("goals").eq("team_id", team.id)

        let freeKickGoals = 0
        if (freeKicks) {
          freeKickGoals = freeKicks.reduce((sum, fk) => sum + (fk.goals || 0), 0)
        }

        // Calcular puntos totales
        const clientsPoints = totalClients * 200
        const finalTotalPoints = totalPointsFromSales + clientsPoints
        const goalsFromPoints = Math.floor(finalTotalPoints / puntosParaGol)
        const totalGoals = goalsFromPoints + freeKickGoals

        teamGoals[team.id] = totalGoals
      }

      // 4. Crear datos para el gráfico (simulando evolución semanal)
      // Por ahora mostramos el total actual, pero se puede expandir para mostrar evolución real
      const currentWeek = getCurrentWeek()
      const chartData: WeeklyData[] = []

      // Generar últimas 4 semanas con distribución progresiva
      for (let i = 3; i >= 0; i--) {
        const weekNumber = currentWeek - i
        const weekData: WeeklyData = { name: `Semana ${weekNumber}` }

        teamsWithColors.forEach((team) => {
          // Distribuir los goles progresivamente (simulación simple)
          const totalGoals = teamGoals[team.id] || 0
          const progressFactor = (4 - i) / 4 // 0.25, 0.5, 0.75, 1.0
          weekData[team.id] = Math.floor(totalGoals * progressFactor)
        })

        chartData.push(weekData)
      }

      setData(chartData)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentWeek = () => {
    const now = new Date()
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000
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
