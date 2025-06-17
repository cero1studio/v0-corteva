"use client"

import { useState, useEffect } from "react"
import { Trophy, Flag, User, Package, Users, TrendingUp, Zap, Target } from "lucide-react"
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
  const [freeKickData, setFreeKickData] = useState<any[]>([])
  const [zoneRanking, setZoneRanking] = useState<any[]>([])
  const [nationalRanking, setNationalRanking] = useState<any[]>([])
  const [zoneData, setZoneData] = useState<any>(null)
  const [puntosParaGol, setPuntosParaGol] = useState(PUNTOS_POR_GOL)
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const [distributorData, setDistributorData] = useState<any>(null)
  const [retoActual, setRetoActual] = useState<string>("")
  const [retoActivo, setRetoActivo] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkUserAndLoadData = async () => {
      if (!isMounted) return
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

    checkUserAndLoadData()

    return () => {
      isMounted = false
    }
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

      // Cargar reto actual
      const { data: retoData, error: retoError } = await supabase
        .from("system_config")
        .select("*")
        .eq("key", "reto_actual")
        .single()

      if (!retoError && retoData && retoData.value) {
        setRetoActual(retoData.value)
      }

      // Cargar estado del reto
      const { data: activoData, error: activoError } = await supabase
        .from("system_config")
        .select("*")
        .eq("key", "reto_activo")
        .single()

      if (!activoError && activoData) {
        setRetoActivo(activoData.value === "true" || activoData.value === true)
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  async function loadZoneData(zoneId: string) {
    try {
      if (!zoneId) return

      console.log("Cargando datos de la zona (Director Técnico):", zoneId)

      // Simplificar consultas - hacer secuencialmente las más pesadas
      const teamsResult = await supabase.from("teams").select("id, name, distributor_id").eq("zone_id", zoneId)

      if (teamsResult.error) throw teamsResult.error

      const teams = teamsResult.data || []
      const teamIds = teams.map((t) => t.id)

      // Solo continuar si hay equipos
      if (teamIds.length === 0) {
        setTeamsData([])
        setSalesData([])
        setClientsData([])
        setFreeKickData([])
        return
      }

      // Cargar datos básicos en paralelo (más simple)
      const [salesResult, clientsResult, freeKicksResult] = await Promise.all([
        supabase.from("sales").select("id, points, quantity, created_at, product_id, representative_id").limit(100),
        supabase.from("competitor_clients").select("id, ganadero_name, created_at, representative_id").limit(100),
        supabase.from("free_kick_goals").select("id, points, reason, created_at, team_id").in("team_id", teamIds),
      ])

      // Procesar datos de forma más simple
      setSalesData(salesResult.data || [])
      setClientsData(clientsResult.data || [])
      setFreeKickData(freeKicksResult.data || [])
      setTeamsData(
        teams.map((team) => ({
          ...team,
          calculated_total_points: 0, // Calcular después si es necesario
          calculated_total_goals: 0,
        })),
      )
    } catch (error: any) {
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
  const puntosTirosLibres = freeKickData.reduce((sum, freeKick) => sum + (freeKick.points || 0), 0)
  const totalPuntos = puntosVentas + puntosClientes + puntosTirosLibres
  const totalGoles = Math.floor(totalPuntos / puntosParaGol)
  const totalSales = salesData.length
  const totalClients = clientsData.length
  const totalFreeKicks = freeKickData.length
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
              <div className="text-muted-foreground mt-1">Supervisando {totalTeams} equipos en tu zona</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tiro libre sin arquero - Solo mostrar si está activo */}
      {retoActivo && retoActual && (
        <Card className="border-2 border-corteva-200 bg-gradient-to-r from-corteva-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full p-3 bg-corteva-500 text-white">
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-corteva-900 mb-2 text-lg">⚽ Tiro libre sin arquero</h3>
                <div className="text-corteva-700 leading-relaxed">{retoActual}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2 border-corteva-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipos en Zona</CardTitle>
            <Users className="h-4 w-4 text-corteva-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
            <div className="text-xs text-muted-foreground mt-2">Equipos bajo tu supervisión</div>
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Puntos por tiros libres:</span>
                <span>{puntosTirosLibres.toLocaleString()}</span>
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
              <div className="text-xs text-muted-foreground mt-2">
                Última venta: {salesData[0] ? new Date(salesData[0].created_at).toLocaleDateString() : "N/A"}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-2">No hay ventas registradas</div>
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
              <div className="text-xs text-muted-foreground mt-2">
                Último registro: {clientsData[0] ? new Date(clientsData[0].created_at).toLocaleDateString() : "N/A"}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-2">No hay clientes registrados</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiros Libres</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFreeKicks}</div>
            {totalFreeKicks > 0 ? (
              <div className="text-xs text-muted-foreground mt-2">
                Último tiro libre: {freeKickData[0] ? new Date(freeKickData[0].created_at).toLocaleDateString() : "N/A"}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-2">No hay tiros libres adjudicados</div>
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
          <TabsTrigger value="tiros-libres">Tiros Libres</TabsTrigger>
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
                            <div className="font-medium text-sm">{team.team_name}</div>
                            <div className="text-xs text-muted-foreground">{team.distributor_name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600 text-sm">{team.goals} goles</div>
                          <div className="text-xs text-muted-foreground">{team.total_points.toLocaleString()} pts</div>
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
                            <div className="font-medium text-sm">{team.team_name}</div>
                            <div className="text-xs text-muted-foreground">{team.zone_name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600 text-sm">{team.goals} goles</div>
                          <div className="text-xs text-muted-foreground">{team.total_points.toLocaleString()} pts</div>
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
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{team.sales_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Ventas</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{team.clients_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Clientes</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-600">{team.free_kick_count || 0}</div>
                        <div className="text-xs text-muted-foreground">T. Libres</div>
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
                            <div className="font-medium">{sale.products?.name || "Producto"}</div>
                            <div className="text-sm text-muted-foreground">
                              {sale.representative_name} - {sale.team_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">+{sale.points || 0} puntos</div>
                          <div className="text-sm text-muted-foreground">Cantidad: {sale.quantity}</div>
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
                        <div className="font-medium">{client.ganadero_name || client.client_name || "Cliente"}</div>
                        <div className="text-sm text-muted-foreground">
                          Registrado por: {client.representative_name} - {client.team_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(client.created_at).toLocaleDateString()}
                        </div>
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

        <TabsContent value="tiros-libres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Tiros Libres de la Zona
              </CardTitle>
              <CardDescription>Goles adjudicados por tiro libre en tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              {freeKickData.length > 0 ? (
                <div className="space-y-4">
                  {freeKickData.slice(0, 8).map((freeKick) => (
                    <div key={freeKick.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">{freeKick.team_name}</div>
                        <div className="text-sm text-muted-foreground">{freeKick.reason}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(freeKick.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-yellow-600">+{Math.floor(freeKick.points / 100)} goles</div>
                        <div className="text-sm text-muted-foreground">{freeKick.points} puntos</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="zap"
                  title="No hay tiros libres adjudicados"
                  description="Cuando se adjudiquen tiros libres, aparecerán aquí"
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
