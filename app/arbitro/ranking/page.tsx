"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Target } from "lucide-react"
import { ProtectedLayout } from "@/components/ProtectedLayout"
import {
  getFreeKicksRankingByZone,
  getTeamRankingByZone,
  type FreeKicksRankingItem,
  type TeamRanking,
} from "@/app/actions/ranking"

export default function ArbitroRanking() {
  const [loading, setLoading] = useState(true)
  const [official, setOfficial] = useState<TeamRanking[]>([])
  const [freeKicks, setFreeKicks] = useState<FreeKicksRankingItem[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [o, f] = await Promise.all([getTeamRankingByZone(), getFreeKicksRankingByZone()])
      if (!cancelled) {
        if (o.success) setOfficial(o.data || [])
        if (f.success) setFreeKicks(f.data || [])
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ProtectedLayout allowedRoles={["arbitro"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ranking</h1>
          <p className="text-muted-foreground">
            Vista nacional: ranking oficial (ventas + clientes) y premio tiros libres por separado.
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
              Premio tiros libres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oficial">
            <Card>
              <CardHeader>
                <CardTitle>Clasificación oficial</CardTitle>
                <CardDescription>
                  Posiciones y goles según puntos de ventas y clientes competencia únicamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Cargando…</p>
                ) : official.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No hay equipos en el ranking.</p>
                ) : (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {official.map((team) => (
                      <div
                        key={team.team_id}
                        className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                            {team.position}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{team.team_name}</div>
                            <div className="text-muted-foreground truncate">
                              {team.zone_name} · {team.distributor_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-green-600">{team.goals} goles</div>
                          <div className="text-xs text-muted-foreground">{team.total_points} pts oficiales</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiros-libres">
            <Card>
              <CardHeader>
                <CardTitle>Premio tiros libres</CardTitle>
                <CardDescription>
                  No suma goles ni posición al ranking oficial; es un reconocimiento aparte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Cargando…</p>
                ) : freeKicks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No hay datos de tiros libres.</p>
                ) : (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {freeKicks.map((team) => (
                      <div
                        key={team.team_id}
                        className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                            {team.position}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{team.team_name}</div>
                            <div className="text-muted-foreground truncate">{team.zone_name}</div>
                          </div>
                        </div>
                        <div className="font-bold text-amber-600 shrink-0">{team.free_kick_points} pts premio</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedLayout>
  )
}
