"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  getFreeKicksRankingByZone,
  getTeamRankingByZone,
  getUserTeamInfo,
  type FreeKicksRankingItem,
  type TeamRanking,
  type UserTeamInfo,
} from "@/app/actions/ranking"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Trophy } from "lucide-react"

export default function RankingPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userTeamInfo, setUserTeamInfo] = useState<UserTeamInfo | null>(null)
  const [official, setOfficial] = useState<TeamRanking[]>([])
  const [freeKicks, setFreeKicks] = useState<FreeKicksRankingItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setUserId(null)
        setLoading(false)
        return
      }
      setUserId(user.id)

      const info = await getUserTeamInfo(user.id)
      if (!info.success || !info.data) {
        setError(info.error || "No se pudo cargar tu equipo")
        setLoading(false)
        return
      }

      const zoneId = info.data.zone_id
      const [o, f] = await Promise.all([getTeamRankingByZone(zoneId), getFreeKicksRankingByZone(zoneId)])
      if (cancelled) return
      setUserTeamInfo(info.data)
      if (o.success) setOfficial(o.data || [])
      if (f.success) setFreeKicks(f.data || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p>Cargando ranking…</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-muted-foreground">Inicia sesión para ver el ranking de tu zona, o consulta el ranking público.</p>
        <Link href="/ranking-publico" className="text-primary underline">
          Ver ranking público
        </Link>
      </div>
    )
  }

  if (error || !userTeamInfo) {
    return (
      <div className="container mx-auto p-4 space-y-2">
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-destructive">{error || "Sin datos de equipo"}</p>
        <Link href="/ranking-publico" className="text-primary underline block">
          Ver ranking público
        </Link>
      </div>
    )
  }

  const officialAllZero = official.length > 0 && official.every((t) => (Number(t.total_points) || 0) === 0)
  const freeKickAllZero = freeKicks.length > 0 && freeKicks.every((t) => (Number(t.free_kick_points) || 0) === 0)

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Goles y tiros libres — {userTeamInfo.zone_name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Goles: solo ventas y clientes de competencia. Tiros libres: clasificación aparte.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tu equipo</CardTitle>
          <CardDescription>{userTeamInfo.team_name}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Posición (goles):</span>{" "}
            <span className="font-semibold">{officialAllZero ? "—" : `#${userTeamInfo.position}`}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Goles:</span>{" "}
            <span className="font-semibold text-green-700">{userTeamInfo.goals}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Puntos:</span>{" "}
            <span className="font-semibold">{userTeamInfo.total_points}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tiros libres:</span>{" "}
            <span className="font-semibold text-amber-800">
              {(userTeamInfo.free_kick_points ?? 0) > 0
                ? `#${userTeamInfo.free_kicks_position} · ${userTeamInfo.free_kick_points} pts`
                : "— · 0 pts"}{" "}
              <span className="text-xs font-normal text-muted-foreground">(no suman a goles)</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="goles">
        <TabsList>
          <TabsTrigger value="goles" className="gap-1">
            <Trophy className="h-4 w-4" />
            Goles
          </TabsTrigger>
          <TabsTrigger value="tiros-libres" className="gap-1">
            <Target className="h-4 w-4" />
            Tiros libres
          </TabsTrigger>
        </TabsList>
        <TabsContent value="goles" className="mt-4">
          {official.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">No hay equipos en tu zona.</p>
          ) : officialAllZero ? (
            <div className="text-center py-10">
              <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">Aún no hay goles registrados</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Cuando haya puntos por ventas o clientes competencia, verás el ranking aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left">Pos.</th>
                    <th className="px-3 py-2 text-left">Equipo</th>
                    <th className="px-3 py-2 text-right">Goles</th>
                    <th className="px-3 py-2 text-right">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {official.map((team) => (
                    <tr
                      key={team.team_id}
                      className={team.team_id === userTeamInfo.team_id ? "bg-blue-50" : ""}
                    >
                      <td className="px-3 py-2">{team.position}</td>
                      <td className="px-3 py-2 font-medium">{team.team_name}</td>
                      <td className="px-3 py-2 text-right">{team.goals}</td>
                      <td className="px-3 py-2 text-right">{team.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="tiros-libres" className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Tiros libres: no cambian posición ni goles del concurso.</p>
          {freeKicks.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">Sin datos de tiros libres.</p>
          ) : freeKickAllZero ? (
            <div className="text-center py-10">
              <Target className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">Aún no hay tiros libres</p>
              <p className="text-sm text-muted-foreground mt-1">Nadie tiene puntos por tiros libres adjudicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left">Pos.</th>
                    <th className="px-3 py-2 text-left">Equipo</th>
                    <th className="px-3 py-2 text-right">Puntos (tiros libres)</th>
                  </tr>
                </thead>
                <tbody>
                  {freeKicks.map((team) => (
                    <tr
                      key={team.team_id}
                      className={team.team_id === userTeamInfo.team_id ? "bg-amber-50" : ""}
                    >
                      <td className="px-3 py-2">{team.position}</td>
                      <td className="px-3 py-2 font-medium">{team.team_name}</td>
                      <td className="px-3 py-2 text-right font-medium text-amber-800">{team.free_kick_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
