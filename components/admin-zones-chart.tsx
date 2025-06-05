"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, MapPin } from "lucide-react"
import { EmptyState } from "./empty-state"

export function AdminZonesChart() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Obtener zonas
      const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name").order("name")

      if (zonesError) throw zonesError

      if (zones.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // Obtener configuración de puntos para gol
      const { data: puntosConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

      // Para cada zona, calcular goles totales (usando la misma lógica del ranking)
      const zoneData = await Promise.all(
        zones.map(async (zone) => {
          // Obtener equipos de la zona
          const { data: teams, error: teamsError } = await supabase
            .from("teams")
            .select("id, name")
            .eq("zone_id", zone.id)

          if (teamsError) throw teamsError

          let totalGoals = 0

          for (const team of teams || []) {
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

            // Calcular goles del equipo
            const clientsPoints = totalClients * 200
            const finalTotalPoints = totalPointsFromSales + clientsPoints
            const goalsFromPoints = Math.floor(finalTotalPoints / puntosParaGol)
            const teamGoals = goalsFromPoints + freeKickGoals

            totalGoals += teamGoals
          }

          return {
            name: zone.name,
            goles: totalGoals,
          }
        }),
      )

      setData(zoneData)
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
