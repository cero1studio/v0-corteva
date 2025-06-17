"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Users } from "lucide-react"
import { EmptyState } from "./empty-state"

type TeamPerformanceData = {
  name: string // Team name
  goals: number
  sales: number // Total sales count
  clients: number // Total clients count
}

export function SupervisorTeamsChart() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TeamPerformanceData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [teamsResult, profilesResult, salesResult, clientsResult, freeKicksResult, puntosConfigResult] =
        await Promise.all([
          supabase.from("teams").select("id, name"),
          supabase.from("profiles").select("id, team_id"),
          supabase.from("sales").select("points, representative_id, team_id"),
          supabase.from("competitor_clients").select("id, points, representative_id, team_id"),
          supabase.from("free_kick_goals").select("points, team_id"),
          supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
        ])

      if (teamsResult.error) throw teamsResult.error
      if (profilesResult.error) throw profilesResult.error
      if (salesResult.error) throw salesResult.error
      if (clientsResult.error) throw clientsResult.error
      if (freeKicksResult.error) throw freeKicksResult.error
      if (puntosConfigResult.error) throw puntosConfigResult.error

      const teams = teamsResult.data || []
      const profiles = profilesResult.data || []
      const sales = salesResult.data || []
      const clients = clientsResult.data || []
      const freeKicks = freeKicksResult.data || []
      const puntosParaGol = puntosConfigResult.data?.value ? Number(puntosConfigResult.data.value) : 100

      if (teams.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      const profileTeamMap = new Map(profiles.map((p) => [p.id, p.team_id]))
      const teamStatsMap = new Map<
        string,
        { totalPoints: number; salesCount: number; clientsCount: number; freeKicksPoints: number }
      >()

      teams.forEach((team) =>
        teamStatsMap.set(team.id, { totalPoints: 0, salesCount: 0, clientsCount: 0, freeKicksPoints: 0 }),
      )

      // Aggregate sales
      sales.forEach((s) => {
        let teamId = s.team_id
        if (!teamId && s.representative_id) {
          teamId = profileTeamMap.get(s.representative_id)
        }
        if (teamId && teamStatsMap.has(teamId)) {
          const stats = teamStatsMap.get(teamId)!
          stats.totalPoints += s.points || 0
          stats.salesCount += 1
          teamStatsMap.set(teamId, stats)
        }
      })

      // Aggregate clients
      clients.forEach((c) => {
        let teamId = c.team_id
        if (!teamId && c.representative_id) {
          teamId = profileTeamMap.get(c.representative_id)
        }
        if (teamId && teamStatsMap.has(teamId)) {
          const stats = teamStatsMap.get(teamId)!
          stats.totalPoints += c.points || 200 // Assuming 200 points per client if not specified
          stats.clientsCount += 1
          teamStatsMap.set(teamId, stats)
        }
      })

      // Aggregate free kicks
      freeKicks.forEach((fk) => {
        if (fk.team_id && teamStatsMap.has(fk.team_id)) {
          const stats = teamStatsMap.get(fk.team_id)!
          stats.totalPoints += fk.points || 0
          stats.freeKicksPoints += fk.points || 0 // Store free kick points separately if needed
          teamStatsMap.set(fk.team_id, stats)
        }
      })

      const chartData: TeamPerformanceData[] = teams
        .map((team) => {
          const stats = teamStatsMap.get(team.id)!
          return {
            name: team.name,
            goals: Math.floor(stats.totalPoints / puntosParaGol),
            sales: stats.salesCount,
            clients: stats.clientsCount,
          }
        })
        .sort((a, b) => b.goals - a.goals) // Sort by goals

      setData(chartData)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico de equipos del supervisor:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
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
        icon={Users}
        title="No hay equipos registrados"
        description="Crea equipos para ver su rendimiento."
        actionLabel="Crear equipo"
        actionHref="/admin/equipos/nuevo"
        className="h-[300px]"
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" orientation="left" stroke="#4ade80" />
        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="sales" name="Ventas" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" dataKey="goals" name="Goles" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
