"use client"

import { useState, useEffect } from "react"
import { Trophy, Flag, User, Package, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SalesChart } from "@/components/sales-chart"
import { LiveFeed } from "@/components/live-feed"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { useRouter } from "next/navigation"
import { getImageUrl } from "@/lib/utils/image"
import { getTeamRankingByZone } from "@/app/actions/ranking"
import { AuthGuard } from "@/components/auth-guard"
import { Badge } from "@/components/ui/badge"

// Constante para la conversión de puntos a goles
const PUNTOS_POR_GOL = 100

function DirectorTecnicoDashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [clientsData, setClientsData] = useState<any[]>([])
  const [teamsData, setTeamsData] = useState<any[]>([])
  const [zoneRanking, setZoneRanking] = useState<any[]>([])
  const [nationalRanking, setNationalRanking] = useState<any[]>([])
  const [zoneData, setZoneData] = useState<any>(null)
  const [puntosParaGol, setPuntosParaGol] = useState(PUNTOS_POR_GOL)
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const [distributorData, setDistributorData] = useState<any>(null)

  useEffect(() => {
    checkUserAndLoadData()
    loadSystemConfig()
  }, [])

  async function loadSystemConfig() {
    try {
      const { data: configData, error: configError } = await supabase
        .from("system_config")
        .select("*")
        .eq("key", "puntos_para_gol")
        .single()

      if (!configError && configData) {
        setSystemConfig(configData)
        setPuntosParaGol(Number(configData.value) || PUNTOS_POR_GOL)
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  async function checkUserAndLoadData() {
    try {
      setLoading(true)

      // Obtener el usuario actual
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/login")
        return
      }

      // Obtener el perfil del usuario con información detallada incluyendo el distribuidor
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
         *,
         zones:zone_id(*),
         teams:team_id(*, distributors:distributor_id(*))
       `)
        .eq("id", authUser.id)
        .single()

      if (profileError) throw profileError

      setUser(profileData)
      setUserData(profileData)

      // Guardar datos de zona del perfil del usuario
      if (profileData.zones) {
        setZoneData(profileData.zones)
      }

      // Guardar datos del distribuidor del equipo del director técnico
      if (profileData.teams?.distributors) {
        setDistributorData(profileData.teams.distributors)
      }

      // Cargar datos de la zona
      if (profileData.zone_id) {
        await loadZoneData(profileData.zone_id)
      }
    } catch (error: any) {
      console.error("Error al verificar usuario:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo cargar la información del usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadZoneData(zoneId: string) {
    try {
      console.log("Cargando datos de la zona:", zoneId)

      // Obtener todos los equipos de la zona
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select(`
          *,
          distributors:distributor_id(*)
        `)
        .eq("zone_id", zoneId)
        .order("total_points", { ascending: false })

      if (teamsError) {
        console.error("Error al obtener equipos:", teamsError)
      } else {
        console.log("Equipos cargados:", teams?.length || 0)
      }

      // Obtener todos los miembros de los equipos de la zona
      const teamIds = teams?.map((team) => team.id) || []

      if (teamIds.length > 0) {
        const { data: teamMembers, error: membersError } = await supabase
          .from("profiles")
          .select(`
            id, 
            full_name, 
            team_id,
            teams:team_id(
              *,
              distributors:distributor_id(*)
            )
          `)
          .in("team_id", teamIds)

        if (membersError) {
          console.error("Error al obtener miembros:", membersError)
        } else {
          const memberIds = teamMembers?.map((member) => member.id) || []

          // Cargar ventas de todos los miembros de la zona
          const { data: salesDataFromDb, error: salesError } = await supabase
            .from("sales")
            .select(`
             *,
             products(id, name, image_url)
           `)
            .in("representative_id", memberIds)
            .order("created_at", { ascending: false })

          if (salesError) {
            console.error("Error cargando ventas:", salesError)
          } else {
            console.log("Ventas cargadas:", salesDataFromDb?.length || 0)

            // Enriquecer los datos de ventas con información de perfiles y equipos
            const enrichedSales =
              salesDataFromDb?.map((sale) => {
                const representative = teamMembers?.find((member) => member.id === sale.representative_id)
                const team = teams?.find((team) => team.id === representative?.team_id)

                return {
                  ...sale,
                  representative_name: representative?.full_name || "Representante",
                  team_name: team?.name || "Equipo",
                  team_id: team?.id,
                  distributor_data: representative?.teams?.distributors,
                }
              }) || []

            setSalesData(enrichedSales)

            // Cargar clientes de todos los miembros de la zona
            const { data: clientsDataFromDb, error: clientsError } = await supabase
              .from("competitor_clients")
              .select(`*`)
              .in("representative_id", memberIds)
              .order("created_at", { ascending: false })

            if (clientsError) {
              console.error("Error cargando clientes:", clientsError)
            } else {
              console.log("Clientes cargados:", clientsDataFromDb?.length || 0)

              // Enriquecer los datos de clientes con información de perfiles y equipos
              const enrichedClients =
                clientsDataFromDb?.map((client) => {
                  const representative = teamMembers?.find((member) => member.id === client.representative_id)
                  const team = teams?.find((team) => team.id === representative?.team_id)

                  return {
                    ...client,
                    representative_name: representative?.full_name || "Representante",
                    team_name: team?.name || "Equipo",
                    team_id: team?.id,
                    distributor_data: representative?.teams?.distributors,
                  }
                }) || []

              setClientsData(enrichedClients)

              // Calcular puntos totales por equipo (ventas + clientes)
              const teamsWithTotalGoals =
                teams?.map((team) => {
                  // Obtener ventas del equipo
                  const teamSales = enrichedSales?.filter((sale) => sale.team_id === team.id) || []
                  const salesPoints = teamSales.reduce((sum, sale) => sum + (sale.points || 0), 0)

                  // Obtener clientes del equipo
                  const teamClients = enrichedClients?.filter((client) => client.team_id === team.id) || []
                  const clientsPoints = teamClients.length * 200 // 200 puntos por cliente

                  // Total de puntos y goles
                  const totalPoints = salesPoints + clientsPoints
                  const totalGoals = Math.floor(totalPoints / puntosParaGol)

                  return {
                    ...team,
                    calculated_total_points: totalPoints,
                    calculated_total_goals: totalGoals,
                    sales_points: salesPoints,
                    clients_points: clientsPoints,
                    sales_count: teamSales.length,
                    clients_count: teamClients.length,
                  }
                }) || []

              // Ordenar por puntos calculados
              teamsWithTotalGoals.sort((a, b) => (b.calculated_total_points || 0) - (a.calculated_total_points || 0))

              setTeamsData(teamsWithTotalGoals)
            }
          }
        }
      }

      // Cargar ranking de la zona
      try {
        const rankingResult = await getTeamRankingByZone(zoneId)
        if (rankingResult.success && rankingResult.data) {
          setZoneRanking(rankingResult.data)
        }
      } catch (rankingError) {
        console.error("Error al cargar ranking de zona:", rankingError)
      }

      // Cargar ranking nacional
      try {
        const nationalRankingResult = await getTeamRankingByZone()
        if (nationalRankingResult.success && nationalRankingResult.data) {
          setNationalRanking(nationalRankingResult.data)
        }
      } catch (rankingError) {
        console.error("Error al cargar ranking nacional:", rankingError)
      }
    } catch (error) {
      console.error("Error al cargar datos de la zona:", error)
    }
  }

  // Función para obtener la URL del logo del distribuidor
  const getDistributorLogo = (distributorName: string) => {
    if (!distributorName) return null
    const normalizedName = distributorName.toLowerCase()
    if (normalizedName.includes("agralba")) return "/logos/agralba.png"
    if (normalizedName.includes("coacosta")) return "/logos/coacosta.png"
    if (normalizedName.includes("hernandez")) return "/logos/hernandez.png"
    if (normalizedName.includes("insagrin")) return "/logos/insagrin.png"
    if (normalizedName.includes("cosechar")) return "/logos/cosechar.png"
    return null
  }

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  // Calcular estadísticas de la zona
  const puntosVentas = salesData.reduce((sum, sale) => sum + (sale.points || 0), 0)
  const puntosClientes = clientsData.length * 200 // 200 puntos por cliente
  const totalPuntos = puntosVentas + puntosClientes
  const totalGoles = Math.floor(totalPuntos / puntosParaGol)
  const totalSales = salesData.length
  const totalClients = clientsData.length
  const totalTeams = teamsData.length

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            {distributorData && (
              <div className="h-16 w-16 rounded-full border-2 border-corteva-200 bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={getDistributorLogo(distributorData.name) || "/placeholder.svg"}
                  alt={distributorData.name}
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  ¡Bienvenido, {userData?.full_name || "Director Técnico"}!
                </h2>
                <div className="flex items-center gap-1 bg-corteva-50 text-corteva-700 px-3 py-1.5 rounded-full text-sm font-medium border border-corteva-200">
                  <Flag className="h-4 w-4" />
                  Zona: {zoneData?.name || "N/A"}
                </div>
              </div>
              <p className="text-muted-foreground mt-1">Supervisando {totalTeams} equipos en tu zona</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-corteva-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipos en Zona</CardTitle>
            <Users className="h-4 w-4 text-corteva-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
            <p className="text-xs text-muted-foreground mt-2">Equipos bajo tu supervisión</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/director-tecnico/equipos">Ver Equipos</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goles de la Zona</CardTitle>
            <img src="/soccer-ball.png" alt="Balón" className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoles}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Puntos por ventas:</span>
                <span>{puntosVentas.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Puntos por clientes:</span>
                <span>{puntosClientes.toLocaleString()}</span>
              </div>
              <div className="border-t pt-1 flex justify-between text-xs font-medium">
                <span>Total puntos:</span>
                <span>{totalPuntos.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas de la Zona</CardTitle>
            <Package className="h-4 w-4 text-corteva-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            {totalSales > 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                Última venta: {salesData[0] ? new Date(salesData[0].created_at).toLocaleDateString() : "N/A"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">No hay ventas registradas</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes de la Zona</CardTitle>
            <User className="h-4 w-4 text-corteva-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            {totalClients > 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                Último registro: {clientsData[0] ? new Date(clientsData[0].created_at).toLocaleDateString() : "N/A"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">No hay clientes registrados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ranking">Rankings</TabsTrigger>
          <TabsTrigger value="equipos">Equipos</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking de {zoneData?.name || "tu zona"}
                </CardTitle>
                <CardDescription>Posiciones de los equipos en tu zona</CardDescription>
              </CardHeader>
              <CardContent>
                {zoneRanking.length > 0 ? (
                  <div className="space-y-3">
                    {zoneRanking.slice(0, 5).map((team) => (
                      <div key={team.team_id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">#{team.position}</span>
                            {team.position === 1 && <span className="text-lg">🥇</span>}
                            {team.position === 2 && <span className="text-lg">🥈</span>}
                            {team.position === 3 && <span className="text-lg">🥉</span>}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{team.team_name}</p>
                            <p className="text-xs text-muted-foreground">{team.distributor_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600 text-sm">{team.goals} goles</p>
                          <p className="text-xs text-muted-foreground">{team.total_points.toLocaleString()} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="trophy"
                    title="No hay ranking disponible"
                    description="Cuando los equipos acumulen puntos, aparecerá el ranking"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Ranking Nacional (Top 5)
                </CardTitle>
                <CardDescription>Los mejores equipos a nivel nacional</CardDescription>
              </CardHeader>
              <CardContent>
                {nationalRanking.length > 0 ? (
                  <div className="space-y-3">
                    {nationalRanking.slice(0, 5).map((team) => (
                      <div key={team.team_id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">#{team.position}</span>
                            {team.position === 1 && <span className="text-lg">🥇</span>}
                            {team.position === 2 && <span className="text-lg">🥈</span>}
                            {team.position === 3 && <span className="text-lg">🥉</span>}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{team.team_name}</p>
                            <p className="text-xs text-muted-foreground">{team.zone_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600 text-sm">{team.goals} goles</p>
                          <p className="text-xs text-muted-foreground">{team.total_points.toLocaleString()} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="trophy"
                    title="No hay ranking disponible"
                    description="Cuando los equipos acumulen puntos, aparecerá el ranking"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="equipos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamsData.length > 0 ? (
              teamsData.slice(0, 6).map((team, index) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        {index === 0 && <span className="text-lg">🥇</span>}
                        {index === 1 && <span className="text-lg">🥈</span>}
                        {index === 2 && <span className="text-lg">🥉</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">{team.calculated_total_goals || 0}</div>
                        <div className="text-xs text-muted-foreground">goles</div>
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mt-1">
                          {team.distributors?.name || "Sin distribuidor"}
                        </Badge>
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{team.sales_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Ventas</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{team.clients_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Clientes</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-600">
                          {(team.calculated_total_points || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Puntos</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState
                  icon="users"
                  title="No hay equipos en esta zona"
                  description="Cuando se creen equipos en esta zona, aparecerán aquí"
                />
              </div>
            )}
          </div>
          {teamsData.length > 6 && (
            <div className="text-center">
              <Button asChild variant="outline">
                <Link href="/director-tecnico/equipos">Ver todos los equipos</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ventas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Ventas de la Zona</CardTitle>
              </CardHeader>
              <CardContent className="pl-2 h-80">
                {salesData.length > 0 ? (
                  <SalesChart data={salesData} />
                ) : (
                  <EmptyState
                    icon="package"
                    title="No hay ventas registradas"
                    description="Cuando los equipos registren ventas, aparecerán aquí"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Ventas de la Zona</CardTitle>
              </CardHeader>
              <CardContent>
                {salesData.length > 0 ? (
                  <div className="space-y-4">
                    {salesData.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex justify-between items-center border-b pb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-md border bg-white flex items-center justify-center overflow-hidden">
                            <img
                              src={getImageUrl(sale.products?.image_url) || "/placeholder.svg"}
                              alt={sale.products?.name || "Producto"}
                              className="h-10 w-10 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg"
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{sale.products?.name || "Producto"}</p>
                            <p className="text-sm text-muted-foreground">
                              {sale.representative_name} - {sale.team_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+{sale.points || 0} puntos</p>
                          <p className="text-sm text-muted-foreground">Cantidad: {sale.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="package"
                    title="No hay ventas registradas"
                    description="Cuando los equipos registren ventas, aparecerán aquí"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-corteva-500" />
                Clientes de la Zona
              </CardTitle>
              <CardDescription>Clientes de la competencia registrados en tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              {clientsData.length > 0 ? (
                <div className="space-y-4">
                  {clientsData.slice(0, 8).map((client) => (
                    <div key={client.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{client.ganadero_name || client.client_name || "Cliente"}</p>
                        <p className="text-sm text-muted-foreground">
                          Registrado por: {client.representative_name} - {client.team_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{client.producto_anterior || "Competidor no especificado"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="user"
                  title="No hay clientes registrados"
                  description="Cuando los equipos registren clientes, aparecerán aquí"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LiveFeed />
    </div>
  )
}

export default function DirectorTecnicoDashboard() {
  return (
    <AuthGuard allowedRoles={["Director Tecnico"]}>
      <DirectorTecnicoDashboardContent />
    </AuthGuard>
  )
}
