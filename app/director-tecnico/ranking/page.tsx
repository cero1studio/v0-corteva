"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { AuthGuard } from "@/components/auth-guard"
import { TeamLevelBadge } from "@/components/team-level-badge"
import { Button } from "@/components/ui/button"

interface TeamRanking {
  id: string
  name: string
  total_points: number
  goals: number
  distributor_name: string
  zone_name: string
}

function DirectorTecnicoRankingContent() {
  const [loading, setLoading] = useState(true)
  const [zoneTeams, setZoneTeams] = useState<TeamRanking[]>([])
  const [nationalTeams, setNationalTeams] = useState<TeamRanking[]>([])
  const [userData, setUserData] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      console.time("Carga de ranking")

      // Obtener el usuario actual
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      // Obtener el perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
         *,
         zones:zone_id(*)
       `)
        .eq("id", authUser.id)
        .single()

      if (profileError) throw profileError
      setUserData(profileData)

      // Obtener configuración de puntos para gol
      const { data: puntosConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

      if (!profileData.zone_id) {
        toast({
          title: "Error",
          description: "No tienes una zona asignada",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // NUEVA IMPLEMENTACIÓN: Usar la función SQL para obtener el ranking de zona
      console.time("Ranking de zona")
      const { data: zoneRankingData, error: zoneRankingError } = await supabase.rpc("get_team_ranking", {
        zone_id_param: profileData.zone_id,
      })
      console.timeEnd("Ranking de zona")

      if (zoneRankingError) {
        console.error("Error al obtener ranking de zona:", zoneRankingError)
        toast({
          title: "Error",
          description: "No se pudo cargar el ranking de zona",
          variant: "destructive",
        })
      } else {
        // Transformar datos al formato esperado
        const formattedZoneRanking = zoneRankingData.map((team) => ({
          id: team.team_id,
          name: team.team_name,
          total_points: Number(team.total_points),
          goals: Math.floor(Number(team.total_points) / puntosParaGol),
          distributor_name: team.distributor_name || "Sin distribuidor",
          zone_name: team.zone_name || "Sin zona",
        }))

        setZoneTeams(formattedZoneRanking)
        console.log("Equipos de zona cargados:", formattedZoneRanking.length)
      }

      // NUEVA IMPLEMENTACIÓN: Usar la función SQL para obtener el ranking nacional
      console.time("Ranking nacional")
      const { data: nationalRankingData, error: nationalRankingError } = await supabase.rpc("get_team_ranking")
      console.timeEnd("Ranking nacional")

      if (nationalRankingError) {
        console.error("Error al obtener ranking nacional:", nationalRankingError)
        toast({
          title: "Error",
          description: "No se pudo cargar el ranking nacional",
          variant: "destructive",
        })
      } else {
        // Transformar datos al formato esperado
        const formattedNationalRanking = nationalRankingData.map((team) => ({
          id: team.team_id,
          name: team.team_name,
          total_points: Number(team.total_points),
          goals: Math.floor(Number(team.total_points) / puntosParaGol),
          distributor_name: team.distributor_name || "Sin distribuidor",
          zone_name: team.zone_name || "Sin zona",
        }))

        setNationalTeams(formattedNationalRanking)
        console.log("Equipos nacionales cargados:", formattedNationalRanking.length)
      }

      console.timeEnd("Carga de ranking")
    } catch (error: any) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudieron cargar los rankings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rankings</h2>
          <p className="text-muted-foreground">Clasificación de equipos por puntos</p>
        </div>
        <Button
          onClick={() => loadData()}
          variant="outline"
          size="sm"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="zona" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zona">Ranking de Zona</TabsTrigger>
          <TabsTrigger value="nacional">Ranking Nacional</TabsTrigger>
        </TabsList>

        <TabsContent value="zona" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking de {userData?.zones?.name || "mi zona"}
              </CardTitle>
              <CardDescription>Posiciones de los equipos en tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
                </div>
              ) : zoneTeams && zoneTeams.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posición
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distribuidor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Goles
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nivel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {zoneTeams.map((team, index) => (
                        <tr key={team.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.distributor_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                            {team.goals}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                            {team.total_points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <TeamLevelBadge position={index + 1} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="trophy"
                  title="No hay equipos en esta zona"
                  description="Cuando se creen equipos en esta zona, aparecerán en el ranking"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nacional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Ranking Nacional
              </CardTitle>
              <CardDescription>Los mejores equipos a nivel nacional</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
                </div>
              ) : nationalTeams && nationalTeams.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posición
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Zona
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distribuidor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Goles
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nivel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {nationalTeams.map((team, index) => (
                        <tr key={team.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.zone_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.distributor_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                            {team.goals}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                            {team.total_points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <TeamLevelBadge position={index + 1} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="trophy"
                  title="No hay equipos registrados"
                  description="Cuando se registren equipos, aparecerán en el ranking nacional"
                />
              )}
            </CardContent>
          </Card>
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
