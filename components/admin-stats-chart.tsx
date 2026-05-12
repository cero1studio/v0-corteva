"use client"

import { contestGoalsFromPoints, parsePuntosParaGol, toContestPoints } from "@/lib/goals"
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Trophy } from "lucide-react"
import { EmptyState } from "./empty-state"
import { Button } from "@/components/ui/button"
import { getTeamRankingByZone } from "@/app/actions/ranking"

// Estructura para datos del gráfico
type TeamData = {
  name: string
  goles: number
  puntos: number
  color: string
}

export function AdminStatsChart() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TeamData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  /** Sin equipos en ranking vs equipos con todo en cero oficial */
  const [emptyKind, setEmptyKind] = useState<"none" | "no_teams" | "all_zero">("none")

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [retryCount])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar el sistema de ranking dinámico
      const rankingResult = await getTeamRankingByZone()

      if (!rankingResult.success || !rankingResult.data) {
        setEmptyKind("no_teams")
        setData([])
        setLoading(false)
        return
      }

      if (rankingResult.data.length === 0) {
        setEmptyKind("no_teams")
        setData([])
        setLoading(false)
        return
      }

      // Obtener configuración de puntos para gol
      const { data: configData } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const puntosParaGol = parsePuntosParaGol(configData?.value)

      const colors = [
        "#3b82f6", // Azul
        "#10b981", // Verde
        "#f59e0b", // Amarillo
        "#ef4444", // Rojo
        "#8b5cf6", // Púrpura
      ]

      // Formatear datos para el gráfico usando datos del ranking
      const chartData: TeamData[] = rankingResult.data.map((team, index) => {
        const puntos = toContestPoints(team.total_points)
        const goles = contestGoalsFromPoints(puntos, puntosParaGol)

        return {
          name: team.team_name,
          goles: goles,
          puntos: puntos,
          color: colors[index % colors.length],
        }
      })

      const allOfficialZero = chartData.every(
        (team) => (team.goles || 0) === 0 && (team.puntos || 0) === 0,
      )

      if (allOfficialZero) {
        setEmptyKind("all_zero")
        setData([])
        setLoading(false)
        return
      }

      setEmptyKind("none")
      const filteredData = chartData.filter((team) => team.goles > 0)
      setData(filteredData.length > 0 ? filteredData : chartData.slice(0, 10))
      setLoading(false)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico:", err)
      setEmptyKind("none")
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
        icon="chart"
        title="Error al cargar datos"
        description={error}
        actionLabel="Reintentar"
        onAction={handleRetry}
      />
    )
  }

  if (emptyKind === "all_zero") {
    return (
      <div className="pb-6">
        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Actualizar gráfico
          </Button>
        </div>
        <div className="text-center py-16 px-4">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aún no hay goles en el concurso</h3>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm mt-2">
            Todos los equipos tienen 0 goles y 0 puntos. Cuando haya ventas o clientes de competencia
            registrados, el gráfico mostrará la evolución en lugar de una vista vacía.
          </p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="No hay equipos registrados"
        description="Crea equipos y registra ventas para ver el comparativo de goles."
        actionLabel="Reintentar"
        onAction={handleRetry}
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
      <div className="mt-6 grid grid-cols-6 gap-6 text-center text-sm">
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
        <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1">
          <RefreshCw className="h-4 w-4" />
          Actualizar gráfico
        </Button>
      </div>
    </div>
  )
}
