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
      console.log("🔄 AdminZonesChart: Iniciando carga de datos...")
      setLoading(true)
      setError(null)

      // Paso 1: Obtener zonas
      console.log("🗺️ AdminZonesChart: Obteniendo zonas...")
      const { data: zonesData, error: zonesError } = await supabase.from("zones").select("id, name").order("name")

      console.log("🗺️ AdminZonesChart: Respuesta de zonas:", { zonesData, zonesError })

      if (zonesError) {
        console.error("❌ AdminZonesChart: Error en query de zonas:", zonesError)
        throw new Error(`Error al obtener zonas: ${zonesError.message}`)
      }

      if (!zonesData || zonesData.length === 0) {
        console.log("⚠️ AdminZonesChart: No se encontraron zonas")
        setData([])
        setLoading(false)
        return
      }

      console.log(`✅ AdminZonesChart: ${zonesData.length} zonas encontradas`)

      // Paso 2: Obtener configuración de puntos para gol
      console.log("⚙️ AdminZonesChart: Obteniendo configuración...")
      const { data: configData, error: configError } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      console.log("⚙️ AdminZonesChart: Respuesta de configuración:", { configData, configError })

      const puntosParaGol = configData?.value ? Number(configData.value) : 100
      console.log(`⚙️ AdminZonesChart: Puntos para gol: ${puntosParaGol}`)

      // Paso 3: Obtener equipos para cada zona
      console.log("👥 AdminZonesChart: Obteniendo equipos por zona...")
      const zoneStatsData = []

      for (let i = 0; i < zonesData.length; i++) {
        const zone = zonesData[i]
        console.log(`👥 AdminZonesChart: Procesando zona ${i + 1}/${zonesData.length}: ${zone.name}`)

        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("id, name, total_points")
          .eq("zone_id", zone.id)

        console.log(`👥 AdminZonesChart: Equipos en ${zone.name}:`, { teamsData, teamsError })

        if (teamsError) {
          console.error(`❌ AdminZonesChart: Error obteniendo equipos para zona ${zone.name}:`, teamsError)
          // Continuar con la siguiente zona
          continue
        }

        const teams = teamsData || []
        const totalZonePoints = teams.reduce((sum, team) => sum + (team.total_points || 0), 0)
        const totalZoneGoals = Math.floor(totalZonePoints / puntosParaGol)
        const totalZoneKilos = Math.round((totalZonePoints / 10) * 10) / 10

        console.log(`📊 AdminZonesChart: Estadísticas de ${zone.name}:`, {
          equipos: teams.length,
          puntos: totalZonePoints,
          goles: totalZoneGoals,
          kilos: totalZoneKilos,
        })

        zoneStatsData.push({
          id: zone.id,
          name: zone.name,
          teams: teams.length,
          goles: totalZoneGoals,
          puntos: totalZonePoints,
          kilos: totalZoneKilos,
          fill: getRandomColor(zone.id),
        })
      }

      // Calcular totales
      const allTotalPoints = zoneStatsData.reduce((sum, zone) => sum + zone.puntos, 0)
      const allTotalGoles = zoneStatsData.reduce((sum, zone) => sum + zone.goles, 0)

      console.log("📈 AdminZonesChart: Totales calculados:", {
        totalPuntos: allTotalPoints,
        totalGoles: allTotalGoles,
        totalKilos: Math.round((allTotalPoints / 10) * 10) / 10,
      })

      // Ordenar por goles (mayor a menor)
      zoneStatsData.sort((a, b) => b.goles - a.goles)
      console.log(
        "🏆 AdminZonesChart: Zonas ordenadas por goles:",
        zoneStatsData.map((z) => `${z.name}: ${z.goles}`),
      )

      // Actualizar estados
      setTotalGoles(allTotalGoles)
      setTotalPuntos(allTotalPoints)
      setTotalKilos(Math.round((allTotalPoints / 10) * 10) / 10)
      setData(zoneStatsData)

      console.log("🎉 AdminZonesChart: Carga completada exitosamente")
    } catch (err: any) {
      console.error("💥 AdminZonesChart: Error crítico:", err)
      setError(`Error detallado: ${err.message || "Error desconocido"}`)
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
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-bold text-base">{data.name}</p>
          <p className="text-sm">
            🏆 <span className="font-medium">{data.goles} Goles</span>
          </p>
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
      <div className="h-[400px] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar gráfico de zonas</h3>
        <p className="text-sm text-red-600 text-center mb-4">{error}</p>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            Reintentar
          </Button>
          <Button
            onClick={() => {
              console.log("🔍 AdminZonesChart: Abriendo consola para debug")
              console.log("🔍 AdminZonesChart: Estado actual:", { loading, data, error, totalGoles, totalPuntos })
            }}
            variant="ghost"
            size="sm"
          >
            Debug en Consola
          </Button>
        </div>
      </div>
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
            <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <YAxis type="category" dataKey="name" width={140} />
              <XAxis type="number" label={{ value: "Goles", angle: 0, position: "top", offset: 0 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="goles" name="Goles" fill="#8884d8" isAnimationActive={false}>
                <LabelList dataKey="goles" position="right" />
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
