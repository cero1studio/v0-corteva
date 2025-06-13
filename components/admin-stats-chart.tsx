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
      setLoading(true)
      setError(null)

      // 1. Obtener equipos con sus puntos totales
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, total_points")
        .order("total_points", { ascending: false })

      if (teamsError) {
        throw new Error(`Error al obtener equipos: ${teamsError.message}`)
      }

      if (!teamsData || teamsData.length === 0) {
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

      // Colores para las barras
      const colors = [
        "#f59e0b", // Amarillo/Oro para el primero
        "#4ade80", // Verde
        "#3b82f6", // Azul
        "#ec4899", // Rosa
        "#8b5cf6", // Púrpura
        "#14b8a6", // Teal
        "#f43f5e", // Rojo
        "#06b6d4", // Cyan
        "#eab308", // Amarillo
        "#a855f7", // Violeta
        "#10b981", // Esmeralda
        "#ef4444", // Rojo brillante
        "#6366f1", // Índigo
        "#84cc16", // Lima
        "#d946ef", // Fucsia
        "#0ea5e9", // Azul cielo
        "#f97316", // Naranja
        "#22c55e", // Verde brillante
        "#8b5cf6", // Púrpura claro
        "#06b6d4", // Cian
      ]

      // Formatear datos para el gráfico
      const chartData: TeamData[] = teamsData.map((team, index) => {
        const puntos = team.total_points || 0
        const goles = Math.floor(puntos / puntosParaGol)
        const kilos = puntos / 10 // 1 gol = 100 puntos = 10 kilos, entonces kilos = puntos/10

        return {
          name: team.name,
          goles: goles,
          puntos: puntos,
          kilos: Math.round(kilos * 10) / 10, // Redondear a 1 decimal
          color: colors[index % colors.length],
        }
      })

      // Filtrar equipos con al menos 1 gol para el gráfico
      const filteredData = chartData.filter((team) => team.goles > 0)

      setData(filteredData.length > 0 ? filteredData : chartData.slice(0, 10)) // Mostrar top 10 si no hay goles
      setLoading(false)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
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
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar datos"
        description={error}
        actionLabel="Reintentar"
        onClick={handleRetry}
        className="h-[400px]"
        iconClassName="bg-red-50"
      />
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
                    <div key="tooltip" className="text-left">
                      <div className="font-semibold">{teamData.name}</div>
                      <div>🏆 {teamData.goles} goles</div>
                      <div>📊 {teamData.puntos} puntos</div>
                      <div>⚖️ {teamData.kilos} kilos</div>
                    </div>,
                    "",
                  ]
                }
              }
              return [value, name]
            }}
            labelFormatter={() => ""}
          />
          <Bar dataKey="goles" name="goles" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Resumen de datos */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
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
        <div className="bg-green-50 p-2 rounded">
          <div className="font-semibold text-green-700">Total Kilos</div>
          <div className="text-lg font-bold text-green-800">
            {Math.round(data.reduce((sum, team) => sum + team.kilos, 0) * 10) / 10}
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
