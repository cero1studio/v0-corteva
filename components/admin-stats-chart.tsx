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

type TeamWithColor = {
  id: string
  name: string
  color: string
}

export function AdminStatsChart() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<WeeklyData[]>([])
  const [teams, setTeams] = useState<TeamWithColor[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Obtener equipos y puntos para gol en paralelo
      const [teamsResponse, configResponse] = await Promise.all([
        supabase.from("teams").select("id, name").order("name"),
        supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
      ])

      const teamsData = teamsResponse.data
      const teamsError = teamsResponse.error
      const puntosConfig = configResponse.data

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

      const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

      // 2. Obtener todos los datos necesarios en paralelo
      const [profilesResponse, salesResponse, clientsResponse, freeKicksResponse] = await Promise.all([
        supabase.from("profiles").select("id, team_id").not("team_id", "is", null),
        supabase.from("sales").select("points, representative_id, team_id"),
        supabase.from("competitor_clients").select("id, points, representative_id, team_id"),
        supabase.from("free_kick_goals").select("points, team_id"),
      ])

      const profiles = profilesResponse.data || []
      const sales = salesResponse.data || []
      const clients = clientsResponse.data || []
      const freeKicks = freeKicksResponse.data || []

      // Crear mapas para acceso rápido
      const teamMembersMap = new Map<string, string[]>()
      profiles.forEach((profile) => {
        if (!teamMembersMap.has(profile.team_id)) {
          teamMembersMap.set(profile.team_id, [])
        }
        teamMembersMap.get(profile.team_id)!.push(profile.id)
      })

      // 3. Calcular goles totales actuales por equipo
      const teamGoals: Record<string, number> = {}

      for (const team of teamsData) {
        const memberIds = teamMembersMap.get(team.id) || []

        // Calcular puntos de ventas
        let totalPointsFromSales = 0

        // Ventas por representante
        sales
          .filter((sale) => memberIds.includes(sale.representative_id))
          .forEach((sale) => (totalPointsFromSales += sale.points || 0))

        // Ventas directas por equipo
        sales.filter((sale) => sale.team_id === team.id).forEach((sale) => (totalPointsFromSales += sale.points || 0))

        // Calcular puntos de clientes
        let clientsPoints = 0
        const countedClientIds = new Set<string>()

        // Clientes por representante
        clients
          .filter((client) => memberIds.includes(client.representative_id))
          .forEach((client) => {
            if (!countedClientIds.has(client.id)) {
              clientsPoints += client.points || 200
              countedClientIds.add(client.id)
            }
          })

        // Clientes directos por equipo
        clients
          .filter((client) => client.team_id === team.id)
          .forEach((client) => {
            if (!countedClientIds.has(client.id)) {
              clientsPoints += client.points || 200
              countedClientIds.add(client.id)
            }
          })

        // Calcular puntos de tiros libres
        let freeKickPoints = 0
        freeKicks.filter((fk) => fk.team_id === team.id).forEach((fk) => (freeKickPoints += fk.points || 0))

        // Calcular puntos totales y goles
        const finalTotalPoints = totalPointsFromSales + clientsPoints + freeKickPoints
        const goalsFromPoints = Math.floor(finalTotalPoints / puntosParaGol)

        // Obtener tiros libres del equipo (goles directos)
        const freeKickGoals = freeKicks
          .filter((fk) => fk.team_id === team.id)
          .reduce((sum, fk) => sum + (fk.goals || 0), 0)

        const totalGoals = goalsFromPoints + freeKickGoals

        teamGoals[team.id] = totalGoals
      }

      // 4. Crear datos para el gráfico (simulando evolución semanal)
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
