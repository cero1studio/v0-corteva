"use client"

import { useState, useEffect } from "react"
import { Trophy, Award, Flag, User, Package, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SalesChart } from "@/components/sales-chart"
import { GoalCelebration } from "@/components/goal-celebration"
import { LiveFeed } from "@/components/live-feed"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { getImageUrl, getDistributorLogoUrl } from "@/lib/utils/image"
import { getTeamRankingByZone } from "@/app/actions/ranking"
import { AuthGuard } from "@/components/auth-guard"
import { getCompetitorClientsByTeam } from "@/app/actions/clients"

// Constante para la conversión de puntos a goles
const PUNTOS_POR_GOL = 100

function CapitanDashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [teamData, setTeamData] = useState<any>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [clientsData, setClientsData] = useState<any[]>([])
  const [rankingPosition, setRankingPosition] = useState<number | null>(null)
  const [hasTeam, setHasTeam] = useState(false)
  const [zoneRanking, setZoneRanking] = useState<any[]>([])
  const [zoneData, setZoneData] = useState<any>(null)
  const [distributorData, setDistributorData] = useState<any>(null)
  const [puntosParaGol, setPuntosParaGol] = useState(PUNTOS_POR_GOL)
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const [retoActual, setRetoActual] = useState<string>("")

  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    checkUserAndTeam()
    loadSystemConfig()
  }, [])

  async function loadSystemConfig() {
    try {
      // Obtener configuración del sistema
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
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  async function checkUserAndTeam() {
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

      // Obtener el perfil del usuario con información detallada
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
         *,
         zones:zone_id(*),
         teams:team_id(
           *,
           distributors:distributor_id(*)
         )
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

      // Verificar si el usuario tiene un equipo
      if (!profileData.team_id) {
        // Si no tiene equipo, verificar si es capitán
        if (profileData.role === "capitan") {
          // Redirigir a la página de creación de equipo
          router.push("/capitan/crear-equipo")
          return
        }
      } else {
        // Si tiene equipo, obtener los datos del equipo con información detallada
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select(`
           *,
           zones:zone_id(*),
           distributors:distributor_id(*)
         `)
          .eq("id", profileData.team_id)
          .single()

        if (teamError) throw teamError

        setTeam(teamData)
        setTeamData(teamData)
        setHasTeam(true)

        // Actualizar datos de zona con los del equipo si están disponibles
        if (teamData.zones) {
          setZoneData(teamData.zones)
        }

        // Guardar datos del distribuidor del equipo
        if (teamData.distributors) {
          setDistributorData(teamData.distributors)
        }
      }

      // Si tiene equipo, cargar datos adicionales
      if (profileData.team_id) {
        await loadTeamData(authUser.id, profileData.team_id)
      }
    } catch (error: any) {
      console.error("Error al verificar usuario y equipo:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo cargar la información del usuario o equipo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadTeamData(userId: string, teamId: string) {
    try {
      console.log("Cargando datos del equipo para usuario:", userId, "equipo:", teamId)

      // Obtener todos los miembros del equipo
      const { data: teamMembers, error: teamError } = await supabase.from("profiles").select("id").eq("team_id", teamId)

      if (teamError) {
        console.error("Error al obtener miembros del equipo:", teamError)
        return
      }

      if (!teamMembers || teamMembers.length === 0) {
        console.log("No se encontraron miembros en el equipo")
        return
      }

      // Obtener IDs de todos los miembros del equipo
      const memberIds = teamMembers.map((member) => member.id)
      console.log("IDs de miembros del equipo:", memberIds)

      // Cargar ventas de todos los miembros del equipo
      const { data: salesData, error: salesError } = await supabase
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
        console.log("Ventas cargadas:", salesData?.length || 0)
        setSalesData(salesData || [])
      }

      // Cargar clientes usando la misma función que en la página de clientes
      try {
        const result = await getCompetitorClientsByTeam(teamId)
        if (result.success) {
          setClientsData(result.data || [])
          console.log("Clientes cargados:", result.data?.length || 0)
        } else {
          console.error("Error al cargar clientes:", result.error)
        }
      } catch (clientError) {
        console.error("Error al cargar clientes:", clientError)
      }

      // Cargar ranking real de la zona usando las funciones de server actions
      try {
        if (teamId && teamId !== "null" && teamId !== "undefined") {
          const zoneId = teamData?.zone_id || userData?.zone_id

          if (zoneId) {
            // Usar la función de server action en lugar de fetch
            const rankingResult = await getTeamRankingByZone(zoneId)

            if (rankingResult.success && rankingResult.data) {
              setZoneRanking(rankingResult.data)
              const position = rankingResult.data.findIndex((t: any) => t.team_id === teamId) + 1
              setRankingPosition(position > 0 ? position : null)
            } else {
              console.error("Error en ranking:", rankingResult.error)
            }
          }
        }
      } catch (rankingError) {
        console.error("Error al cargar ranking:", rankingError)
      }
    } catch (error) {
      console.error("Error al cargar datos del equipo:", error)
    }
  }

  useEffect(() => {
    if (team && user) {
      loadTeamData(user.id, team.id)
    }
  }, [team, user])

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  // Si el capitán no tiene equipo, mostrar pantalla para crear equipo
  if (!team) {
    return (
      <div className="space-y-6 p-6">
        <EmptyState
          title={`¡Bienvenido, ${userData?.full_name || "Capitán"}!`}
          description="Debes crear un equipo para acceder al dashboard"
          icon="users"
        >
          <Button asChild>
            <Link href="/capitan/crear-equipo">Crear Equipo</Link>
          </Button>
        </EmptyState>
      </div>
    )
  }

  // Calcular estadísticas usando datos reales de ventas
  const puntosVentas = salesData.reduce((sum, sale) => sum + (sale.points || 0), 0)
  const puntosClientes = clientsData.length * 200 // 200 puntos por cliente
  const totalPuntos = puntosVentas + puntosClientes
  const totalGoles = Math.floor(totalPuntos / puntosParaGol)
  const puntosSobrantes = totalPuntos % puntosParaGol
  const puntosParaSiguienteGol = puntosParaGol - puntosSobrantes
  const porcentajeCompletado = (puntosSobrantes / puntosParaGol) * 100
  const totalSales = salesData.length
  const totalClients = clientsData.length

  // Agregar después de la línea donde se calculan las estadísticas
  console.log("Datos de ventas:", salesData)
  console.log("Puntos de ventas calculados:", puntosVentas)
  console.log("Total de ventas:", totalSales)

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">¡Bienvenido, {userData?.full_name || "Capitán"}!</h2>
            <div className="flex items-center gap-1 bg-corteva-50 text-corteva-700 px-3 py-1.5 rounded-full text-sm font-medium border border-corteva-200">
              <Flag className="h-4 w-4" />
              Equipo: {teamData?.name || "Tu Equipo"}
            </div>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Zona: {zoneData?.name || "N/A"} |
            <span className="flex items-center">
              Distribuidor:
              {distributorData && (
                <img
                  src={getDistributorLogoUrl(distributorData) || "/placeholder.svg"}
                  alt={distributorData.name || "Distribuidor"}
                  className="h-6 w-auto ml-2"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              )}
            </span>
          </p>
        </div>
      </div>

      {/* Tiro libre sin arquero */}
      {retoActual && (
        <Card className="border-2 border-corteva-200 bg-gradient-to-r from-corteva-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full p-3 bg-corteva-500 text-white">
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-corteva-900 mb-2 text-lg">⚽ Tiro libre sin arquero</h3>
                <p className="text-corteva-700 leading-relaxed">{retoActual}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-corteva-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posición en Ranking</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="rounded-full p-2 bg-gray-400 text-white">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {rankingPosition ? `#${rankingPosition}` : zoneRanking.length > 0 ? "#1" : "Líder"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {rankingPosition && rankingPosition <= 3
                    ? `¡Felicidades! Estás en el top ${rankingPosition}`
                    : zoneRanking.length > 0
                      ? "¡Sube posiciones para ganar una medalla!"
                      : "¡Eres el primer equipo en tu zona!"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/capitan/ranking">Ver Ranking Completo</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goles Acumulados</CardTitle>
            <img src="/soccer-ball.png" alt="Balón" className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoles}</div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{puntosSobrantes.toLocaleString()} puntos acumulados</span>
                <span>{puntosParaGol.toLocaleString()} = 1 gol</span>
              </div>
              <Progress value={porcentajeCompletado} className="h-2" />
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
              <p className="text-xs text-muted-foreground mt-1">
                {puntosSobrantes > 0
                  ? `Faltan ${puntosParaSiguienteGol.toLocaleString()} puntos para el siguiente gol`
                  : "¡Registra ventas para sumar puntos!"}
              </p>
            </div>
          </CardContent>
          {totalGoles === 0 && (
            <CardFooter>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/capitan/registrar-venta">Registrar Venta</Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Registradas</CardTitle>
            <Package className="h-4 w-4 text-corteva-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            {totalSales > 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                Último registro: {salesData[0] ? new Date(salesData[0].created_at).toLocaleDateString() : "N/A"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">No has registrado ventas aún</p>
            )}
          </CardContent>
          {totalSales === 0 && (
            <CardFooter>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/capitan/registrar-venta">Registrar Venta</Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Registrados</CardTitle>
            <User className="h-4 w-4 text-corteva-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            {totalClients > 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                Último registro: {clientsData[0] ? new Date(clientsData[0].created_at).toLocaleDateString() : "N/A"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">No has registrado clientes aún</p>
            )}
          </CardContent>
          {totalClients === 0 && (
            <CardFooter>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/capitan/registrar-cliente">Registrar Cliente</Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <Tabs defaultValue="ventas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Ventas</CardTitle>
              </CardHeader>
              <CardContent className="pl-2 h-80">
                {salesData.length > 0 ? (
                  <SalesChart data={salesData} />
                ) : (
                  <EmptyState
                    icon="package"
                    title="No hay ventas registradas"
                    description="Registra tu primera venta para comenzar a ver estadísticas"
                  >
                    <Button asChild size="sm">
                      <Link href="/capitan/registrar-venta">Registrar Venta</Link>
                    </Button>
                  </EmptyState>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Ventas</CardTitle>
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
                    description="Registra tu primera venta para comenzar a ver estadísticas"
                  >
                    <Button asChild size="sm">
                      <Link href="/capitan/registrar-venta">Registrar Venta</Link>
                    </Button>
                  </EmptyState>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-corteva-500" />
                  Clientes Registrados
                </CardTitle>
                <CardDescription>Clientes de la competencia que has registrado</CardDescription>
              </CardHeader>
              <CardContent>
                {clientsData.length > 0 ? (
                  <div className="space-y-4">
                    {clientsData.slice(0, 5).map((client) => (
                      <div key={client.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{client.client_name || "Cliente"}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(client.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {client.profiles?.full_name || "No especificado"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="user"
                    title="No hay clientes registrados"
                    description="Registra clientes de la competencia para ganar puntos adicionales"
                  >
                    <Button asChild size="sm">
                      <Link href="/capitan/registrar-cliente">Registrar Cliente</Link>
                    </Button>
                  </EmptyState>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <GoalCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        goalCount={25}
        productName="Producto A"
      />

      <LiveFeed />
    </div>
  )
}

export default function CapitanDashboard() {
  return (
    <AuthGuard allowedRoles={["capitan"]}>
      <CapitanDashboardContent />
    </AuthGuard>
  )
}
