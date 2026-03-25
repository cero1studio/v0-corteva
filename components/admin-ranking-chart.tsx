"use client"

import { useEffect, useState, useCallback } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertCircle, RefreshCw, Trophy } from "lucide-react"
import { getTeamRankingByZone } from "@/app/actions/ranking"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type Team = {
  team_id: string
  team_name: string
  goals: number
  total_points?: number
  position?: number
}

type AdminRankingChartProps = {
  teams?: Team[] | null
}

export function AdminRankingChart({ teams: propTeams }: AdminRankingChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedTeams, setFetchedTeams] = useState<Team[]>([])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (propTeams != null && Array.isArray(propTeams)) {
        setFetchedTeams(propTeams)
        return
      }

      const result = await getTeamRankingByZone()
      if (!result.success || !result.data?.length) {
        setFetchedTeams([])
        return
      }

      setFetchedTeams(
        result.data.map((t) => ({
          team_id: t.team_id,
          team_name: t.team_name,
          goals: t.goals,
          total_points: t.total_points,
          position: t.position,
        })),
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      setError(msg)
      setFetchedTeams([])
    } finally {
      setLoading(false)
    }
  }, [propTeams])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    load()
  }, [isMounted, load])

  if (!isMounted) {
    return <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">Cargando…</div>
  }

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 pb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Evolución del concurso (top equipos)</h3>
            <Button variant="outline" size="sm" onClick={() => load()} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="mt-4 text-sm font-medium">Error al cargar datos</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const teamsArray = propTeams != null && Array.isArray(propTeams) ? propTeams : fetchedTeams

  if (teamsArray.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 pb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Evolución del concurso (top equipos)</h3>
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
          <div className="text-center py-16 px-4">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No hay equipos</h3>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm mt-2">
              Registra equipos para ver la evolución del ranking por goles oficiales.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const allOfficialZero =
    teamsArray.length > 0 &&
    teamsArray.every((t) => (Number(t.goals) || 0) === 0 && (Number(t.total_points) || 0) === 0)

  if (allOfficialZero) {
    return (
      <Card>
        <CardContent className="pt-6 pb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Evolución del concurso (top equipos)</h3>
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
          <div className="text-center py-16 px-4">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aún no hay actividad oficial</h3>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm mt-2">
              Todos los equipos tienen 0 goles y 0 puntos oficiales. Cuando haya ventas o clientes competencia, aquí
              verás el top por goles en lugar de un gráfico en ceros.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const top10Teams = teamsArray
    .filter((team) => team && typeof team.goals === "number")
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10)
    .map((team, index) => ({
      name: team.team_name || "Sin nombre",
      goals: team.goals || 0,
      color: index === 0 ? "#f59e0b" : index === 1 ? "#94a3b8" : index === 2 ? "#d97706" : "#16a34a",
    }))

  if (top10Teams.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 pb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Evolución del concurso (top equipos)</h3>
            <Button variant="outline" size="sm" onClick={() => load()} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
          <div className="text-center py-16 px-4">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Sin datos para el gráfico</h3>
            <p className="text-muted-foreground text-sm mt-2">No hay equipos con goles oficiales para mostrar.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Evolución del concurso (top equipos)</h3>
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top10Teams}
              layout="vertical"
              margin={{
                top: 20,
                right: 30,
                left: 100,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="goals"
                name="Goles"
                radius={[0, 4, 4, 0]}
                fill="#16a34a"
                label={{ position: "right", fill: "#16a34a", fontSize: 12 }}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
