"use client"

import { useEffect, useState, useCallback } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, MapPin, RefreshCw } from "lucide-react"
import { EmptyState } from "./empty-state"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter } from "./ui/card"
import { getTeamRankingByZone } from "@/app/actions/ranking"

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


  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener todas las zonas
      const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name").order("name")

      if (zonesError) throw zonesError

      if (!zones || zones.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // Obtener ranking dinámico para cada zona
      const zoneStatsPromises = zones.map(async (zone) => {
        const rankingResult = await getTeamRankingByZone(zone.id)

        if (!rankingResult.success || !rankingResult.data) {
          return {
            id: zone.id,
            name: zone.name,
            teams: 0,
            goles: 0,
            puntos: 0,
            fill: getRandomColor(zone.id),
          }
        }

        // Sumar todos los puntos y goles de los equipos de esta zona
        const totalPuntos = rankingResult.data.reduce((sum, team) => sum + team.total_points, 0)
        const totalGoles = rankingResult.data.reduce((sum, team) => sum + team.goals, 0)

        return {
          id: zone.id,
          name: zone.name,
          teams: rankingResult.data.length,
          goles: totalGoles,
          puntos: totalPuntos,
          fill: getRandomColor(zone.id),
        }
      })

      const zoneStatsData = await Promise.all(zoneStatsPromises)

      // Ordenar por goles (mayor a menor)
      zoneStatsData.sort((a, b) => b.goles - a.goles)

      // Calcular totales generales
      const allTotalGoles = zoneStatsData.reduce((sum, zone) => sum + zone.goles, 0)
      const allTotalPuntos = zoneStatsData.reduce((sum, zone) => sum + zone.puntos, 0)

      setTotalGoles(allTotalGoles)
      setTotalPuntos(allTotalPuntos)
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

        </div>
      </CardFooter>
    </Card>
  )
}
