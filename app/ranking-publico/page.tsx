"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Trophy } from "lucide-react"

type OfficialRow = {
  position: number
  team_id: string
  team_name: string
  goals: number
  total_points: number
  zone_name?: string
  free_kick_points?: number
}

type FreeKickRow = {
  position: number
  team_id: string
  team_name: string
  zone_name?: string
  free_kick_points: number
}

export default function RankingPublico() {
  const [official, setOfficial] = useState<OfficialRow[]>([])
  const [freeKicks, setFreeKicks] = useState<FreeKickRow[]>([])
  const [puntosParaGol, setPuntosParaGol] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/ranking-list")
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const json = await res.json()
        if (!json.success) {
          throw new Error(json.error || "Error al cargar")
        }
        setOfficial(json.data || [])
        setFreeKicks(json.freeKicks || [])
        if (typeof json.puntosParaGol === "number" && !Number.isNaN(json.puntosParaGol)) {
          setPuntosParaGol(json.puntosParaGol)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error")
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="container mx-auto p-4">Cargando ranking...</div>
  }

  if (error) {
    return <div className="container mx-auto p-4">Error al cargar el ranking: {error}</div>
  }

  const officialAllZero = official.length > 0 && official.every((t) => (Number(t.total_points) || 0) === 0)
  const freeKickAllZero = freeKicks.length > 0 && freeKicks.every((t) => (Number(t.free_kick_points) || 0) === 0)

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking público</h1>
        <p className="text-sm text-muted-foreground mt-1">
          El ranking oficial ordena por ventas y clientes competencia. El premio paralelo (tiros libres) va en su
          pestaña y no suma goles ni posición aquí.
        </p>
      </div>

      <Tabs defaultValue="oficial" className="w-full">
        <TabsList>
          <TabsTrigger value="oficial" className="gap-1">
            <Trophy className="h-4 w-4" />
            Ranking oficial
          </TabsTrigger>
          <TabsTrigger value="tiros-libres" className="gap-1">
            <Target className="h-4 w-4" />
            Premio paralelo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="oficial">
          <Card>
            <CardHeader>
              <CardTitle>Clasificación oficial</CardTitle>
              <CardDescription>
                Goles y posición según puntos oficiales (ventas + clientes). Una fila por equipo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {official.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">No hay equipos en el ranking.</p>
                </div>
              ) : officialAllZero ? (
                <div className="text-center py-12">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Aún no hay actividad oficial</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Ningún equipo tiene puntos oficiales registrados. Cuando haya ventas o clientes competencia, verás
                    la tabla aquí.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left">Posición</th>
                        <th className="px-4 py-2 text-left">Equipo</th>
                        <th className="px-4 py-2 text-left">Zona</th>
                        <th className="px-4 py-2 text-right">Puntos oficiales</th>
                        <th className="px-4 py-2 text-right">Goles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {official.map((team, index) => (
                        <tr key={team.team_id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                          <td className="px-4 py-2">{team.position ?? index + 1}</td>
                          <td className="px-4 py-2 font-medium">{team.team_name}</td>
                          <td className="px-4 py-2 text-muted-foreground">{team.zone_name ?? "—"}</td>
                          <td className="px-4 py-2 text-right">{team.total_points}</td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {team.goals ?? Math.floor(team.total_points / puntosParaGol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiros-libres">
          <Card>
            <CardHeader>
              <CardTitle>Premio paralelo</CardTitle>
              <CardDescription>
                Clasificación por tiros libres en paralelo al concurso; no cambia el ranking oficial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {freeKicks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">No hay datos de premio paralelo.</p>
                </div>
              ) : freeKickAllZero ? (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Sin premio paralelo aún</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Ningún equipo tiene puntos por tiros libres adjudicados.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left">Posición</th>
                        <th className="px-4 py-2 text-left">Equipo</th>
                        <th className="px-4 py-2 text-left">Zona</th>
                        <th className="px-4 py-2 text-right">Premio paralelo (pts)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {freeKicks.map((team, index) => (
                        <tr key={team.team_id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                          <td className="px-4 py-2">{team.position ?? index + 1}</td>
                          <td className="px-4 py-2 font-medium">{team.team_name}</td>
                          <td className="px-4 py-2 text-muted-foreground">{team.zone_name ?? "—"}</td>
                          <td className="px-4 py-2 text-right font-semibold text-amber-700">{team.free_kick_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
