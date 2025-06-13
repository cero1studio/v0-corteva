"use client"

import { useEffect, useState, useCallback } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, MapPin, RefreshCw } from "lucide-react"
import { EmptyState } from "./empty-state"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter } from "./ui/card"

type AdminZonesChartProps = {
  zonesData?: any[] // Optional prop to pass pre-calculated zone data from parent
}

export function AdminZonesChart({ zonesData: propZonesData }: AdminZonesChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [totalGoles, setTotalGoles] = useState(0)
  const [totalPuntos, setTotalPuntos] = useState(0)
  const [totalKilos, setTotalKilos] = useState(0)

  const fetchData = useCallback(async () => {
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
      let allTotalPoints = 0
      let allTotalGoles = 0

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

        // Acumular totales generales
        allTotalPoints += totalZonePoints
        allTotalGoles += totalZoneGoals

        return {
          id: zone.id,
          name: zone.name,
          teams: totalZoneTeamsCount,
          goles: totalZoneGoals,
          puntos: totalZonePoints,
          kilos: Math.floor(totalZonePoints / 10),
          fill: getRandomColor(zone.id), // Color único para cada zona
        }
      })

      // Ordenar por goles (mayor a menor)
      zoneStatsData.sort((a, b) => b.goles - a.goles)

      // Actualizar totales
      setTotalGoles(allTotalGoles)
      setTotalPuntos(allTotalPoints)
      setTotalKilos(Math.floor(allTotalPoints / 10))

      setData(zoneStatsData)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico de zonas:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Función para generar colores aleatorios pero consistentes basados en ID
  const getRandomColor = (id: string) => {
    // Lista de colores predefinidos vibrantes
    const colors = [
      "#f59e0b", // amber-500
      "#10b981", // emerald-500
      "#3b82f6", // blue-500
      "#8b5cf6", // violet-500
      "#ec4899", // pink-500
      "#ef4444", // red-500
      "#14b8a6", // teal-500
      "#f97316", // orange-500
      "#6366f1", // indigo-500
      "#84cc16", // lime-500
      "#06b6d4", // cyan-500
      "#a855f7", // purple-500
      "#f43f5e", // rose-500
      "#22c55e", // green-500
      "#0ea5e9", // sky-500
      "#d946ef", // fuchsia-500
    ]

    // Usar el ID para seleccionar un color de manera consistente
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // useEffect simplificado que siempre carga datos frescos
  useEffect(() => {
    setIsMounted(true)

    // Siempre cargar datos frescos, ignorar propZonesData para evitar conflictos
    fetchData()

    return () => {
      // Cleanup si es necesario
    }
  }, [fetchData]) // Solo depende de fetchData

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border rounded-md shadow-md">
          <p className="font-bold text-lg">{data.name}</p>
          <p className="text-sm text-gray-600">{data.teams} equipos</p>
          <div className="mt-2">
            <p className="font-medium">🏆 Goles: {data.goles}</p>
            <p className="font-medium">📊 Puntos: {data.puntos.toLocaleString()}</p>
            <p className="font-medium">⚖️ Kilos: {data.kilos.toLocaleString()}</p>
          </div>
        </div>
      )
    }
    return null
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Rendimiento por zona geográfica</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }} barSize={60}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} />
              <YAxis
                label={{
                  value: "Goles",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="goles" name="Goles" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey="goles" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex flex-col items-start">
        <div className="grid grid-cols-3 gap-4 w-full text-center">
          <div>
            <p className="text-sm text-gray-500">Total Goles</p>
            <p className="text-xl font-bold">{totalGoles}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Puntos</p>
            <p className="text-xl font-bold">{totalPuntos.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Kilos</p>
            <p className="text-xl font-bold">{totalKilos.toLocaleString()}</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
