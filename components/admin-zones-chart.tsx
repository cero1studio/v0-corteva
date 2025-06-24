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

      // 1. Obtener zonas con sus equipos y puntos
      const { data: zonesData, error: zonesError } = await supabase
        .from("zones")
        .select(`
        id,
        name,
        teams(
          id,
          name,
          total_points
        )
      `)
        .order("name")

      if (zonesError) throw zonesError

      if (!zonesData || zonesData.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // 2. Obtener configuración de puntos para gol
      const { data: configData } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const puntosParaGol = configData?.value ? Number(configData.value) : 100

      // 3. Procesar datos por zona
      let allTotalPoints = 0
      let allTotalGoles = 0

      const zoneStatsData = zonesData.map((zone, index) => {
        const teams = Array.isArray(zone.teams) ? zone.teams : []
        const totalZonePoints = teams.reduce((sum, team) => sum + (team.total_points || 0), 0)
        const totalZoneGoals = Math.floor(totalZonePoints / puntosParaGol)
        const totalZoneKilos = Math.round((totalZonePoints / 10) * 10) / 10

        // Acumular totales generales
        allTotalPoints += totalZonePoints
        allTotalGoles += totalZoneGoals

        return {
          id: zone.id,
          name: zone.name,
          teams: teams.length,
          goles: totalZoneGoals,
          puntos: totalZonePoints,
          kilos: totalZoneKilos,
          fill: getRandomColor(zone.id),
        }
      })

      // Ordenar por goles (mayor a menor)
      zoneStatsData.sort((a, b) => b.goles - a.goles)

      // Actualizar totales
      setTotalGoles(allTotalGoles)
      setTotalPuntos(allTotalPoints)
      setTotalKilos(Math.round((allTotalPoints / 10) * 10) / 10)

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
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-bold text-base">{data.name}</p>
          <div className="mt-1 space-y-1 text-sm">
            <p>
              🏆 <span className="font-medium">{data.goles} goles</span>
            </p>
            <p>
              👥 <span className="font-medium">{data.teams} equipos</span>
            </p>
            <p>
              📊 <span className="font-medium">{data.puntos.toLocaleString()} puntos</span>
            </p>
            <p>
              ⚖️ <span className="font-medium">{data.kilos} kilos</span>
            </p>
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
