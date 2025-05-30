"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { AuthGuard } from "@/components/auth-guard"
import { TeamLevelBadge } from "@/components/team-level-badge"

function DirectorTecnicoRankingContent() {
  const [loading, setLoading] = useState(true)
  const [zoneTeams, setZoneTeams] = useState<any[]>([])
  const [nationalTeams, setNationalTeams] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

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

      if (!profileData.zone_id) {
        toast({
          title: "Error",
          description: "No tienes una zona asignada",
          variant: "destructive",
        })
        return
      }

      // Obtener equipos de la zona ordenados por puntos
      const { data: zoneTeamsData, error: zoneTeamsError } = await supabase
        .from("teams")
        .select(`
          id, 
          name, 
          total_points,
          distributor_id,
          distributors(name, logo_url)
        `)
        .eq("zone_id", profileData.zone_id)
        .order("total_points", { ascending: false })

      if (zoneTeamsError) {
        console.error("Error al obtener equipos de zona:", zoneTeamsError)
      } else {
        console.log("Equipos de zona cargados:", zoneTeamsData?.length || 0)
        setZoneTeams(zoneTeamsData || [])
      }

      // Obtener ranking nacional (todos los equipos)
      const { data: nationalTeamsData, error: nationalTeamsError } = await supabase
        .from("teams")
        .select(`
          id, 
          name, 
          total_points,
          distributor_id,
          zone_id,
          distributors(name, logo_url),
          zones(name)
        `)
        .order("total_points", { ascending: false })

      if (nationalTeamsError) {
        console.error("Error al obtener equipos nacionales:", nationalTeamsError)
      } else {
        console.log("Equipos nacionales cargados:", nationalTeamsData?.length || 0)
        setNationalTeams(nationalTeamsData || [])
      }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Rankings</h2>
        <p className="text-muted-foreground">Clasificación de equipos por puntos</p>
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
              {zoneTeams && zoneTeams.length > 0 ? (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              {team.distributors?.logo_url ? (
                                <img
                                  src={team.distributors?.logo_url || "/placeholder.svg"}
                                  alt={team.name}
                                  className="w-8 h-8 mr-3 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 mr-3 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                  {team.name.charAt(0)}
                                </div>
                              )}
                              {team.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {team.distributors?.name || "Sin distribuidor"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                            {team.total_points || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <TeamLevelBadge points={team.total_points || 0} />
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
              {nationalTeams && nationalTeams.length > 0 ? (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              {team.distributors?.logo_url ? (
                                <img
                                  src={team.distributors?.logo_url || "/placeholder.svg"}
                                  alt={team.name}
                                  className="w-8 h-8 mr-3 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 mr-3 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                  {team.name.charAt(0)}
                                </div>
                              )}
                              {team.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {team.zones?.name || "Sin zona"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {team.distributors?.name || "Sin distribuidor"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                            {team.total_points || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <TeamLevelBadge points={team.total_points || 0} />
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
    <AuthGuard allowedRoles={["Director Tecnico"]}>
      <DirectorTecnicoRankingContent />
    </AuthGuard>
  )
}
