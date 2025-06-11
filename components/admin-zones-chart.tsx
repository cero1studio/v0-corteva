"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, MapPin } from "lucide-react"
import { EmptyState } from "./empty-state"

type AdminZonesChartProps = {
  zonesData?: any[] // Optional prop to pass pre-calculated zone data from parent
}

export function AdminZonesChart({ zonesData: propZonesData }: AdminZonesChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    if (propZonesData) {
      setData(propZonesData)
      setLoading(false)
    } else {
      fetchData()
    }
  }, [propZonesData])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Obtener todos los datos necesarios en paralelo
      const [
        zonesResult,
        teamsResult,
        profilesResult,
        salesResult,
        clientsResult,
        freeKicksResult,
        puntosConfigResult,
      ] = await Promise.all([
        supabase.from("zones").select("id, name").order("name"),
        supabase.from("teams").select("id, name, zone_id"),
        supabase.from("profiles").select("id, team_id"),
        supabase.from("sales").select("points, representative_id, team_id"),
        supabase.from("competitor_clients").select("id, points, representative_id, team_id"),
        supabase.from("free_kick_goals").select("points, team_id"),
        supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
      ])

      // Manejar errores de las llamadas en paralelo
      if (zonesResult.error) throw zonesResult.error
      if (teamsResult.error) throw teamsResult.error
      if (profilesResult.error) throw profilesResult.error
      if (salesResult.error) throw salesResult.error
      if (clientsResult.error) throw clientsResult.error
      if (freeKicksResult.error) throw freeKicksResult.error
      if (puntosConfigResult.error) throw puntosConfigResult.error

      const zones = zonesResult.data || []
      const teams = teamsResult.data || []
      const profiles = profilesResult.data || []
      const sales = salesResult.data || []
      const clients = clientsResult.data || []
      const freeKicks = freeKicksResult.data || []
      const puntosParaGol = puntosConfigResult.data?.value ? Number(puntosConfigResult.data.value) : 100

      if (zones.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // Crear mapas para búsquedas eficientes
      const profileTeamMap = new Map(profiles.map((p) => [p.id, p.team_id]))
      const teamPointsMap = new Map<string, { sales: number; clients: number; freeKicks: number }>()

      // Aggregate sales points per team
      sales.forEach((s) => {
        let teamId = s.team_id
        if (!teamId && s.representative_id) {
          teamId = profileTeamMap.get(s.representative_id) || null
        }
        if (teamId) {
          const current = teamPointsMap.get(teamId) || { sales: 0, clients: 0, freeKicks: 0 }
          current.sales += s.points || 0
          teamPointsMap.set(teamId, current)
        }
      })

      // Aggregate client points per team
      clients.forEach((c) => {
        let teamId = c.team_id
        if (!teamId && c.representative_id) {
          teamId = profileTeamMap.get(c.representative_id) || null
        }
        if (teamId) {
          const current = teamPointsMap.get(teamId) || { sales: 0, clients: 0, freeKicks: 0 }
          current.clients += c.points || 200
          teamPointsMap.set(teamId, current)
        }
      })

      // Aggregate free kick points per team
      freeKicks.forEach((fk) => {
        if (fk.team_id) {
          const current = teamPointsMap.get(fk.team_id) || { sales: 0, clients: 0, freeKicks: 0 }
          current.freeKicks += fk.points || 0
          teamPointsMap.set(fk.team_id, current)
        }
      })

      // Agregación de puntos por zona
      const zoneStatsData = zones.map((zone) => {
        let totalZonePoints = 0
        let totalZoneTeamsCount = 0

        const teamsInZone = teams.filter((t) => t.zone_id === zone.id)
        totalZoneTeamsCount = teamsInZone.length

        teamsInZone.forEach((team) => {
          const teamAggregatedPoints = teamPointsMap.get(team.id) || { sales: 0, clients: 0, freeKicks: 0 }
          const teamTotalPoints =
            teamAggregatedPoints.sales + teamAggregatedPoints.clients + teamAggregatedPoints.freeKicks
          totalZonePoints += teamTotalPoints
        })

        const totalZoneGoals = Math.floor(totalZonePoints / puntosParaGol)

        return {
          id: zone.id,
          name: zone.name,
          teams: totalZoneTeamsCount,
          goles: totalZoneGoals, // Used by BarChart
          total_goals: totalZoneGoals, // For consistency and clarity
          total_points: totalZonePoints, // For consistency and clarity
        }
      })

      setData(zoneStatsData)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico de zonas:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) {
    return <div className="h-[400px] flex items-center justify-center">Cargando gráfico...</div>
  }

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar datos"
        description={error}
        actionLabel="Reintentar"
        onClick={fetchData}
        className="h-[400px]"
        iconClassName="bg-red-50"
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No hay zonas disponibles"
        description="Crea zonas geográficas para organizar tus equipos y ver su rendimiento."
        actionLabel="Crear zona"
        actionHref="/admin/zonas/nuevo"
        className="h-[400px]"
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value) => [`${value} goles`, "Goles Totales"]}
          labelFormatter={(label) => `Zona: ${label}`}
        />
        <Bar dataKey="goles" name="Goles Totales" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  )
}
