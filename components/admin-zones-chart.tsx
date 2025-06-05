"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
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
      const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name")

      if (zonesError) throw zonesError

      if (zones.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // Para cada zona, obtener métricas relevantes
      const zoneData = await Promise.all(
        zones.map(async (zone) => {
          // Obtener equipos de la zona
          const { data: teamIds, error: teamIdsError } = await supabase
            .from("teams")
            .select("id")
            .eq("zone_id", zone.id)

          if (teamIdsError) throw teamIdsError

          let totalGoals = 0
          let totalSales = 0
          let totalClients = 0
          let totalFreeKicks = 0

          if (teamIds.length > 0) {
            const teamIdList = teamIds.map((t) => t.id)

            // Obtener goles de ventas
            const { data: sales, error: salesError } = await supabase
              .from("sales")
              .select("points")
              .in("team_id", teamIdList)

            if (salesError) throw salesError

            if (sales && sales.length > 0) {
              totalGoals = sales.reduce((sum, sale) => sum + (sale.points || 0), 0)
              totalSales = sales.length
            }

            // Obtener tiros libres anotados
            const { data: freeKicks, error: freeKicksError } = await supabase
              .from("free_kick_goals")
              .select("goals")
              .in("team_id", teamIdList)

            if (!freeKicksError && freeKicks && freeKicks.length > 0) {
              const freeKickGoals = freeKicks.reduce((sum, fk) => sum + (fk.goals || 0), 0)
              totalGoals += freeKickGoals
              totalFreeKicks = freeKicks.length
            }

            // Obtener clientes registrados
            const { count: clientsCount, error: clientsError } = await supabase
              .from("clients")
              .select("*", { count: "exact", head: true })
              .in("team_id", teamIdList)

            if (!clientsError) {
              totalClients = clientsCount || 0
            }
          }

          return {
            name: zone.name,
            goles: totalGoals,
            ventas: totalSales,
            clientes: totalClients,
            tirosLibres: totalFreeKicks,
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
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(value, name) => {
            const labels = {
              goles: "Goles Totales",
              ventas: "Ventas Registradas",
              clientes: "Clientes Registrados",
              tirosLibres: "Tiros Libres Anotados",
            }
            return [value, labels[name as keyof typeof labels] || name]
          }}
        />
        <Legend
          formatter={(value) => {
            const labels = {
              goles: "Goles Totales",
              ventas: "Ventas",
              clientes: "Clientes",
              tirosLibres: "Tiros Libres",
            }
            return labels[value as keyof typeof labels] || value
          }}
        />
        <Bar yAxisId="left" dataKey="goles" name="goles" fill="#f59e0b" />
        <Bar yAxisId="right" dataKey="ventas" name="ventas" fill="#4ade80" />
        <Bar yAxisId="right" dataKey="clientes" name="clientes" fill="#3b82f6" />
        <Bar yAxisId="right" dataKey="tirosLibres" name="tirosLibres" fill="#ec4899" />
      </BarChart>
    </ResponsiveContainer>
  )
}
