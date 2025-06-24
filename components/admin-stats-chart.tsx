"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, BarChart3Icon } from "lucide-react"
import { EmptyState } from "./empty-state"
import { Button } from "@/components/ui/button"

// Estructura para datos del gráfico
type TeamData = {
  name: string
  goles: number
  puntos: number
  kilos: number
  color: string
  zone: string | null
}

export function AdminStatsChart() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TeamData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [retryCount])

  const fetchData = async () => {
    try {
      console.log("🔄 AdminStatsChart: Iniciando carga de datos...")
      setLoading(true)
      setError(null)

      // Paso 1: Obtener equipos
      console.log("📊 AdminStatsChart: Obteniendo equipos...")
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, total_points, zone_id")
        .order("total_points", { ascending: false })
        .limit(20)

      console.log("📊 AdminStatsChart: Respuesta de equipos:", { teamsData, teamsError })

      if (teamsError) {
        console.error("❌ AdminStatsChart: Error en query de equipos:", teamsError)
        throw new Error(`Error al obtener equipos: ${teamsError.message}`)
      }

      if (!teamsData || teamsData.length === 0) {
        console.log("⚠️ AdminStatsChart: No se encontraron equipos")
        setData([])
        setLoading(false)
        return
      }

      console.log(`✅ AdminStatsChart: ${teamsData.length} equipos encontrados`)

      // Paso 2: Obtener zonas si hay equipos con zone_id
      let zonesMap: Record<string, string> = {}
      const zoneIds = [...new Set(teamsData.map((team) => team.zone_id).filter(Boolean))]

      console.log("🗺️ AdminStatsChart: Zone IDs encontrados:", zoneIds)

      if (zoneIds.length > 0) {
        console.log("🗺️ AdminStatsChart: Obteniendo nombres de zonas...")
        const { data: zonesData, error: zonesError } = await supabase.from("zones").select("id, name").in("id", zoneIds)

        console.log("🗺️ AdminStatsChart: Respuesta de zonas:", { zonesData, zonesError })

        if (zonesError) {
          console.error("❌ AdminStatsChart: Error en query de zonas:", zonesError)
          // No lanzar error, continuar sin nombres de zonas
        } else if (zonesData) {
          zonesMap = zonesData.reduce(
            (acc, zone) => {
              acc[zone.id] = zone.name
              return acc
            },
            {} as Record<string, string>,
          )
          console.log("✅ AdminStatsChart: Mapa de zonas creado:", zonesMap)
        }
      }

      // Paso 3: Obtener configuración de puntos para gol
      console.log("⚙️ AdminStatsChart: Obteniendo configuración de puntos...")
      const { data: configData, error: configError } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      console.log("⚙️ AdminStatsChart: Respuesta de configuración:", { configData, configError })

      if (configError) {
        console.error("❌ AdminStatsChart: Error en configuración:", configError)
      }

      const puntosParaGol = configData?.value ? Number(configData.value) : 100
      console.log(`⚙️ AdminStatsChart: Puntos para gol: ${puntosParaGol}`)

      // Paso 4: Formatear datos para el gráfico
      console.log("🎨 AdminStatsChart: Formateando datos para gráfico...")
      const colors = [
        "#f59e0b",
        "#4ade80",
        "#3b82f6",
        "#ec4899",
        "#8b5cf6",
        "#14b8a6",
        "#f43f5e",
        "#06b6d4",
        "#eab308",
        "#a855f7",
      ]

      const chartData: TeamData[] = teamsData.map((team, index) => {
        const puntos = team.total_points || 0
        const goles = Math.floor(puntos / puntosParaGol)
        const kilos = Math.round((puntos / 10) * 10) / 10

        return {
          name: team.name || "Sin nombre",
          goles: goles,
          puntos: puntos,
          kilos: kilos,
          color: colors[index % colors.length],
          zone: team.zone_id ? zonesMap[team.zone_id] || "Sin zona" : "Sin zona",
        }
      })

      console.log("✅ AdminStatsChart: Datos formateados:", chartData)
      console.log(`📈 AdminStatsChart: Total goles: ${chartData.reduce((sum, team) => sum + team.goles, 0)}`)

      setData(chartData)
      setLoading(false)
      console.log("🎉 AdminStatsChart: Carga completada exitosamente")
    } catch (err: any) {
      console.error("💥 AdminStatsChart: Error crítico:", err)
      setError(`Error detallado: ${err.message || "Error desconocido"}`)
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
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
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar gráfico</h3>
        <p className="text-sm text-red-600 text-center mb-4">{error}</p>
        <div className="flex gap-2">
          <Button onClick={handleRetry} variant="outline" size="sm">
            Reintentar
          </Button>
          <Button
            onClick={() => {
              console.log("🔍 AdminStatsChart: Abriendo consola para debug")
              console.log("🔍 AdminStatsChart: Estado actual:", { loading, data, error })
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
        icon={BarChart3Icon}
        title="No hay equipos registrados"
        description="Crea equipos y registra ventas para ver el comparativo de goles."
        actionLabel="Reintentar"
        onClick={handleRetry}
        className="h-[400px]"
      />
    )
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} interval={0} />
          <YAxis />
          <Tooltip
            formatter={(value, name) => {
              if (name === "goles") {
                const teamData = data.find((d) => d.goles === value)
                if (teamData) {
                  return [
                    `${teamData.name} - ${teamData.goles} goles ${teamData.zone ? `(${teamData.zone})` : ""}`,
                    "Equipo",
                  ]
                }
              }
              return [value, name]
            }}
          />
          <Bar dataKey="goles" name="goles" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Resumen de datos */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
        <div className="bg-yellow-50 p-2 rounded">
          <div className="font-semibold text-yellow-700">Total Goles</div>
          <div className="text-lg font-bold text-yellow-800">{data.reduce((sum, team) => sum + team.goles, 0)}</div>
        </div>
        <div className="bg-blue-50 p-2 rounded">
          <div className="font-semibold text-blue-700">Total Puntos</div>
          <div className="text-lg font-bold text-blue-800">
            {data.reduce((sum, team) => sum + team.puntos, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRetry}>
          Actualizar gráfico
        </Button>
      </div>
    </div>
  )
}
