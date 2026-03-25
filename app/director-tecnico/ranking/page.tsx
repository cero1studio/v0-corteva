"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp, RefreshCw, Target } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { AuthGuard } from "@/components/auth-guard"
import { TeamLevelBadge } from "@/components/team-level-badge"
import { Button } from "@/components/ui/button"
import {
  getFreeKicksRankingByZone,
  getTeamRankingByZone,
  type FreeKicksRankingItem,
  type TeamRanking,
} from "@/app/actions/ranking"

function DirectorTecnicoRankingContent() {
  const [loading, setLoading] = useState(true)
  const [zoneOfficial, setZoneOfficial] = useState<TeamRanking[]>([])
  const [zoneFk, setZoneFk] = useState<FreeKicksRankingItem[]>([])
  const [nationalOfficial, setNationalOfficial] = useState<TeamRanking[]>([])
  const [nationalFk, setNationalFk] = useState<FreeKicksRankingItem[]>([])
  const [userData, setUserData] = useState<{ zones?: { name?: string } } | null>(null)
  const { toast } = useToast()

  async function loadData() {
    try {
      setLoading(true)

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`*, zones:zone_id(*)`)
        .eq("id", authUser.id)
        .single()

      if (profileError) throw profileError
      setUserData(profileData)

      if (!profileData.zone_id) {
        toast({
          title: "Error",
          description: "No tienes una zona asignada",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const [zOff, zFk, nOff, nFk] = await Promise.all([
        getTeamRankingByZone(profileData.zone_id),
        getFreeKicksRankingByZone(profileData.zone_id),
        getTeamRankingByZone(),
        getFreeKicksRankingByZone(),
      ])

      if (zOff.success) setZoneOfficial(zOff.data || [])
      if (zFk.success) setZoneFk(zFk.data || [])
      if (nOff.success) setNationalOfficial(nOff.data || [])
      if (nFk.success) setNationalFk(nFk.data || [])
    } catch (error: unknown) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los rankings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function renderOfficialTable(teams: TeamRanking[], emptyTitle: string) {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600" />
        </div>
      )
    }
    if (!teams.length) {
      return <EmptyState icon="trophy" title={emptyTitle} description="Cuando haya equipos, aparecerán aquí." />
    }
    return (
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distribuidor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Goles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puntos oficiales</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team) => (
              <tr key={team.team_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                    {team.position}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.team_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.distributor_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{team.goals}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">{team.total_points}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <TeamLevelBadge position={team.position} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function renderFkTable(teams: FreeKicksRankingItem[], showZone: boolean, emptyTitle: string) {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600" />
        </div>
      )
    }
    if (!teams.length) {
      return <EmptyState icon="trophy" title={emptyTitle} description="Aún no hay datos de tiros libres." />
    }
    return (
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
              {showZone ? (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zona</th>
              ) : null}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distribuidor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puntos premio</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team) => (
              <tr key={team.team_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{team.position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.team_name}</td>
                {showZone ? (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.zone_name}</td>
                ) : null}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.distributor_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-semibold">
                  {team.free_kick_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rankings</h2>
          <p className="text-muted-foreground">
            Ranking oficial (ventas + clientes) y premio tiros libres, que no suma goles ni posición oficial.
          </p>
        </div>
        <Button onClick={() => loadData()} variant="outline" size="sm" disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="zona" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zona">Mi zona</TabsTrigger>
          <TabsTrigger value="nacional">Nacional</TabsTrigger>
        </TabsList>

        <TabsContent value="zona" className="space-y-4">
          <Tabs defaultValue="oficial">
            <TabsList>
              <TabsTrigger value="oficial" className="gap-1">
                <Trophy className="h-4 w-4" />
                Ranking oficial
              </TabsTrigger>
              <TabsTrigger value="fk" className="gap-1">
                <Target className="h-4 w-4" />
                Tiros libres
              </TabsTrigger>
            </TabsList>
            <TabsContent value="oficial" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Ranking de {userData?.zones?.name || "mi zona"}
                  </CardTitle>
                  <CardDescription>
                    Solo puntos oficiales definen posición y goles. Los tiros libres están en la pestaña aparte.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderOfficialTable(zoneOfficial, "No hay equipos en esta zona")}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="fk" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    Premio tiros libres — {userData?.zones?.name || "zona"}
                  </CardTitle>
                  <CardDescription>No suma al ranking oficial ni a los goles del concurso.</CardDescription>
                </CardHeader>
                <CardContent>{renderFkTable(zoneFk, false, "No hay datos de tiros libres en la zona")}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="nacional" className="space-y-4">
          <Tabs defaultValue="oficial">
            <TabsList>
              <TabsTrigger value="oficial" className="gap-1">
                <TrendingUp className="h-4 w-4" />
                Ranking oficial
              </TabsTrigger>
              <TabsTrigger value="fk" className="gap-1">
                <Target className="h-4 w-4" />
                Tiros libres
              </TabsTrigger>
            </TabsList>
            <TabsContent value="oficial" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Ranking nacional oficial
                  </CardTitle>
                  <CardDescription>Clasificación por puntos oficiales a nivel nacional.</CardDescription>
                </CardHeader>
                <CardContent>{renderOfficialTable(nationalOfficial, "No hay equipos registrados")}</CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="fk" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    Premio tiros libres — nacional
                  </CardTitle>
                  <CardDescription>Clasificación aparte; no altera posición en el ranking oficial.</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderFkTable(nationalFk, true, "No hay datos de tiros libres")}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function DirectorTecnicoRanking() {
  return (
    <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
      <DirectorTecnicoRankingContent />
    </AuthGuard>
  )
}
