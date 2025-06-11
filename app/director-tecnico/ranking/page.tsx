import { createServerClient } from "@/lib/supabase/server"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { TeamLevelBadge } from "@/components/team-level-badge"

interface TeamRanking {
  id: string
  name: string
  total_points: number
  goals: number
  distributor_name: string
  zone_name: string
  position: number
}

export default async function DirectorTecnicoRankingPage() {
  const supabase = createServerClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthGuard>
    )
  }

  // Obtener zona del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      zone_id,
      zones!left(name)
    `)
    .eq("id", user.id)
    .single()

  const userZoneId = profile?.zone_id
  const userZoneName = profile?.zones?.name || "Mi Zona"

  // Obtener configuración de puntos para gol
  const { data: config } = await supabase.from("system_config").select("value").eq("key", "puntos_para_gol").single()
  const puntosParaGol = config?.value ? Number(config.value) : 100

  // Obtener equipos de la zona del usuario (igual que admin pero filtrado)
  const { data: zoneTeams } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      total_points,
      distributors!left(name),
      zones!left(name)
    `)
    .eq("zone_id", userZoneId)
    .order("total_points", { ascending: false })

  // Obtener todos los equipos para ranking nacional (igual que admin)
  const { data: nationalTeams } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      total_points,
      distributors!left(name),
      zones!left(name)
    `)
    .order("total_points", { ascending: false })

  // Procesar equipos de zona
  const processedZoneTeams: TeamRanking[] = (zoneTeams || []).map((team, index) => ({
    id: team.id,
    name: team.name,
    total_points: team.total_points || 0,
    goals: Math.floor((team.total_points || 0) / puntosParaGol),
    distributor_name: team.distributors?.name || "Sin distribuidor",
    zone_name: team.zones?.name || "Sin zona",
    position: index + 1,
  }))

  // Procesar equipos nacionales
  const processedNationalTeams: TeamRanking[] = (nationalTeams || []).map((team, index) => ({
    id: team.id,
    name: team.name,
    total_points: team.total_points || 0,
    goals: Math.floor((team.total_points || 0) / puntosParaGol),
    distributor_name: team.distributors?.name || "Sin distribuidor",
    zone_name: team.zones?.name || "Sin zona",
    position: index + 1,
  }))

  return (
    <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rankings</h2>
          <p className="text-muted-foreground">Clasificación de equipos por puntos</p>
        </div>

        <Tabs defaultValue="zona" className="space-y-4">
          <TabsList>
            <TabsTrigger value="zona">Ranking de {userZoneName}</TabsTrigger>
            <TabsTrigger value="nacional">Ranking Nacional</TabsTrigger>
          </TabsList>

          <TabsContent value="zona" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking de {userZoneName}
                </CardTitle>
                <CardDescription>Posiciones de los equipos en tu zona</CardDescription>
              </CardHeader>
              <CardContent>
                {processedZoneTeams.length > 0 ? (
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
                        {processedZoneTeams.map((team) => (
                          <tr key={team.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                                {team.position}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {team.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.distributor_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                              {team.goals}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                              {team.total_points}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <TeamLevelBadge position={team.position} />
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
                {processedNationalTeams.length > 0 ? (
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
                        {processedNationalTeams.map((team) => (
                          <tr key={team.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                                {team.position}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {team.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.zone_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.distributor_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                              {team.goals}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                              {team.total_points}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <TeamLevelBadge position={team.position} />
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
    </AuthGuard>
  )
}
