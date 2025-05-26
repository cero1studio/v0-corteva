"use client"

import { useState, useEffect } from "react"
import { Trophy, Award, Flag, User, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SalesChart } from "@/components/sales-chart"
import { GoalCelebration } from "@/components/goal-celebration"
import { LiveFeed } from "@/components/live-feed"
import { AchievementBadge } from "@/components/achievement-badge"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { EmptyState } from "@/components/empty-state"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

// Constante para la conversión de puntos a goles
const PUNTOS_POR_GOL = 100

export default function CapitanDashboard() {
  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [teamData, setTeamData] = useState<any>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [clientsData, setClientsData] = useState<any[]>([])
  const [penaltiesData, setPenaltiesData] = useState<any[]>([])
  const [rankingPosition, setRankingPosition] = useState<number | null>(null)
  const [hasTeam, setHasTeam] = useState(false)
  const [zoneRanking, setZoneRanking] = useState<any[]>([])
  const [nextGoal, setNextGoal] = useState<number>(0)
  const [nextMedal, setNextMedal] = useState<string>("")
  const [zoneData, setZoneData] = useState<any>(null)
  const [distributorData, setDistributorData] = useState<any>(null)
  const [puntosParaGol, setPuntosParaGol] = useState(PUNTOS_POR_GOL)
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const [productImages, setProductImages] = useState<Record<string, string>>({})

  const [showCelebration, setShowCelebration] = useState(false)
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false)
  const [penaltyAmount, setPenaltyAmount] = useState(0)

  useEffect(() => {
    checkUserAndTeam()
    loadSystemConfig()
    loadProductImages()
  }, [])

  async function loadProductImages() {
    try {
      // Obtener lista de productos
      const { data: products, error: productsError } = await supabase.from("products").select("id")

      if (productsError) throw productsError

      // Crear un objeto para almacenar las URLs de las imágenes
      const images: Record<string, string> = {}

      // Para cada producto, intentar obtener su imagen
      for (const product of products || []) {
        try {
          const { data: files } = await supabase.storage.from("product-images").list("", {
            search: `${product.id}`,
          })

          if (files && files.length > 0) {
            const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(files[0].name)
            if (publicUrlData?.publicUrl) {
              images[product.id] = publicUrlData.publicUrl
            }
          }
        } catch (e) {
          console.log(`No image for product ${product.id}`)
        }
      }

      setProductImages(images)
    } catch (error) {
      console.error("Error loading product images:", error)
    }
  }

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
          distributors:distributor_id(*)
        `)
        .eq("id", authUser.id)
        .single()

      if (profileError) throw profileError

      setUser(profileData)
      setUserData(profileData)

      // Guardar datos de zona y distribuidor
      if (profileData.zones) {
        setZoneData(profileData.zones)
      }

      if (profileData.distributors) {
        setDistributorData(profileData.distributors)
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

        // Actualizar datos de zona y distribuidor con los del equipo si están disponibles
        if (teamData.zones) {
          setZoneData(teamData.zones)
        }

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
      // Cargar ventas con información de productos
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("*, products(id, name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (salesError) throw salesError
      setSalesData(salesData || [])

      // Cargar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("competitor_clients")
        .select("*")
        .eq("captured_by", userId)
        .order("created_at", { ascending: false })

      if (clientsError) throw clientsError
      setClientsData(clientsData || [])

      // Cargar penaltis
      const { data: penaltiesData, error: penaltiesError } = await supabase
        .from("penalties")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })

      if (penaltiesError) throw penaltiesError
      setPenaltiesData(penaltiesData || [])

      // IMPORTANTE: Obtener los puntos totales del equipo directamente de la base de datos
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("total_points, goals")
        .eq("id", teamId)
        .single()

      if (teamError) {
        console.error("Error al obtener puntos del equipo:", teamError)
      } else if (teamData) {
        console.log("Datos del equipo cargados:", teamData)
      }

      // Obtener configuración del sistema para penaltis
      const { data: penaltyConfig, error: configError } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "penalty_settings")
        .maybeSingle()

      if (!configError && penaltyConfig?.value) {
        try {
          const config = typeof penaltyConfig.value === "string" ? JSON.parse(penaltyConfig.value) : penaltyConfig.value

          const salesTarget = config.sales_target || 5
          const penaltyReward = config.penalty_reward || 1

          console.log("Configuración de penaltis cargada:", { salesTarget, penaltyReward })
        } catch (e) {
          console.error("Error al parsear configuración de penaltis:", e)
        }
      }

      // Calcular puntos totales de todas las ventas del usuario
      const { data: allSales, error: allSalesError } = await supabase
        .from("sales")
        .select("points")
        .eq("user_id", userId)

      if (allSalesError) {
        console.error("Error al obtener todas las ventas:", allSalesError)
      } else {
        const totalUserPoints = allSales ? allSales.reduce((sum, sale) => sum + (sale.points || 0), 0) : 0
        console.log("Puntos totales del usuario calculados:", totalUserPoints)

        // Si no hay puntos en el equipo, actualizar los puntos y goles
        if (!teamData?.total_points || teamData.total_points === 0) {
          // Calcular goles basados en los puntos
          const goles = Math.floor(totalUserPoints / puntosParaGol)

          // Actualizar el equipo con los puntos y goles calculados
          const { error: updateError } = await supabase
            .from("teams")
            .update({
              total_points: totalUserPoints,
              goals: goles,
            })
            .eq("id", teamId)

          if (updateError) {
            console.error("Error al actualizar equipo:", updateError)
          } else {
            console.log("Equipo actualizado con puntos:", totalUserPoints, "y goles:", goles)
          }
        }
      }

      // Cargar ranking real de la zona
      try {
        // Verificar que teamId sea válido antes de hacer la solicitud
        if (teamId && teamId !== "null" && teamId !== "undefined") {
          const zoneId = teamData?.zone_id || userData?.zone_id

          if (zoneId) {
            // Obtener el ranking de la zona
            const { data: zoneRankingData, error: zoneRankingError } = await supabase
              .from("teams")
              .select(`
                id,
                name,
                total_points,
                distributors:distributor_id(id, name, logo_url)
              `)
              .eq("zone_id", zoneId)
              .order("total_points", { ascending: false })

            if (zoneRankingError) throw zoneRankingError

            if (zoneRankingData) {
              // Formatear los datos para que coincidan con el formato esperado
              const formattedRanking = zoneRankingData.map((team) => ({
                team_id: team.id,
                team_name: team.name,
                total_points: team.total_points || 0,
                distributor_name: team.distributors?.name || "",
                distributor_logo: team.distributors?.logo_url || "",
              }))

              setZoneRanking(formattedRanking)

              // Encontrar la posición del equipo actual en el ranking
              const position = formattedRanking.findIndex((t) => t.team_id === teamId) + 1
              setRankingPosition(position > 0 ? position : null)

              // Calcular próximo objetivo
              if (position > 1 && position <= formattedRanking.length) {
                // Si no es el primero, el objetivo es superar al equipo de arriba
                const currentTeam = formattedRanking[position - 1]
                const nextTeam = formattedRanking[position - 2] // Equipo de arriba

                if (currentTeam && nextTeam) {
                  const goalDifference = Math.max(1, nextTeam.total_points - currentTeam.total_points + 1)
                  setNextGoal(goalDifference)
                } else {
                  setNextGoal(100)
                }

                setNextMedal(position === 2 ? "gold" : position === 3 ? "silver" : "bronze")
              } else if (position === 1) {
                // Si ya es el primero, el objetivo es mantener la ventaja
                setNextGoal(100)
                setNextMedal("gold")
              } else {
                // Si no hay posición válida
                setNextGoal(100)
                setNextMedal("bronze")
              }
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

  const handleClaimPenalty = async () => {
    if (!teamData) return

    try {
      // Calcular el bono de goles (25% de los goles actuales)
      const totalPuntos = salesData.reduce((sum, sale) => sum + sale.total_points, 0)
      const totalGoles = Math.floor(totalPuntos / puntosParaGol)
      const bonusGoles = Math.round(totalGoles * 0.25)
      const bonusPuntos = bonusGoles * puntosParaGol
      setPenaltyAmount(bonusGoles)

      // Usar un penalti
      const { data: penalty, error: penaltyError } = await supabase
        .from("penalties")
        .select("*")
        .eq("team_id", teamData.id)
        .gt("quantity", 0)
        .lt("used", "quantity")
        .order("created_at", { ascending: true })
        .limit(1)
        .single()

      if (penaltyError) {
        toast({
          title: "Error",
          description: "No hay penaltis disponibles",
          variant: "destructive",
        })
        return
      }

      // Actualizar el penalti
      const { error: updateError } = await supabase
        .from("penalties")
        .update({ used: penalty.used + 1 })
        .eq("id", penalty.id)

      if (updateError) throw updateError

      // Registrar en el historial
      await supabase.from("penalty_history").insert({
        penalty_id: penalty.id,
        team_id: teamData.id,
        action: "used",
        quantity: 1,
        description: `Penalti reclamado desde el dashboard (+${bonusGoles} goles)`,
      })

      setShowPenaltyDialog(true)

      // Actualizar penaltis
      const { data: updatedPenalties, error: refreshError } = await supabase
        .from("penalties")
        .select("*")
        .eq("team_id", teamData.id)
        .order("created_at", { ascending: false })

      if (!refreshError) {
        setPenaltiesData(updatedPenalties || [])
      }
    } catch (error: any) {
      console.error("Error al reclamar penalti:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    }
  }

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

  // Calcular estadísticas
  const totalPuntos = teamData?.total_points || salesData.reduce((sum, sale) => sum + (sale.points || 0), 0)
  const totalGoles = teamData?.goals || Math.floor(totalPuntos / puntosParaGol)
  const puntosSobrantes = totalPuntos % puntosParaGol
  const puntosParaSiguienteGol = puntosParaGol - puntosSobrantes
  const porcentajeCompletado = (puntosSobrantes / puntosParaGol) * 100
  const totalSales = salesData.length
  const totalClients = clientsData.length

  // Calcular penaltis disponibles
  const totalPenalties = penaltiesData.reduce((sum, p) => sum + p.quantity, 0)
  const usedPenalties = penaltiesData.reduce((sum, p) => sum + p.used, 0)
  const availablePenalties = totalPenalties - usedPenalties

  // Función para obtener la URL del logo del distribuidor
  const getDistributorLogo = (name) => {
    if (!name) return null

    const normalizedName = name.toLowerCase()

    if (normalizedName.includes("agralba")) {
      return "/logos/agralba.png"
    } else if (normalizedName.includes("coacosta")) {
      return "/logos/coacosta.png"
    } else if (normalizedName.includes("hernandez")) {
      return "/logos/hernandez.png"
    } else if (normalizedName.includes("insagrin")) {
      return "/logos/insagrin.png"
    } else if (normalizedName.includes("cosechar")) {
      return "/logos/cosechar.png"
    }

    return null
  }

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
              {distributorData && distributorData.name ? (
                <img
                  src={getDistributorLogo(distributorData.name) || "/placeholder.svg"}
                  alt=""
                  className="h-6 w-auto ml-2"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : null}
            </span>
          </p>
        </div>
      </div>

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
                <span>{puntosSobrantes} puntos acumulados</span>
                <span>{puntosParaGol} = 1 gol</span>
              </div>
              <Progress value={porcentajeCompletado} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {puntosSobrantes > 0
                  ? `Faltan ${puntosParaSiguienteGol} puntos para el siguiente gol`
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

      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ranking">Top Equipos</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="logros">Logros</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  TOP 5 Equipos - {zoneData?.name || "Tu Zona"}
                </CardTitle>
                <CardDescription>Los mejores equipos de tu zona</CardDescription>
              </CardHeader>
              <CardContent>
                {zoneRanking.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pos.</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead>Distribuidor</TableHead>
                        <TableHead className="text-right">Goles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zoneRanking.slice(0, 5).map((team, index) => (
                        <TableRow key={team.team_id} className={team.team_id === teamData?.id ? "bg-corteva-50" : ""}>
                          <TableCell className="font-medium">
                            {index + 1}
                            {index < 3 && (
                              <span className="ml-1">
                                {index === 0 && "🥇"}
                                {index === 1 && "🥈"}
                                {index === 2 && "🥉"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{team.team_name}</TableCell>
                          <TableCell>
                            {team.distributor_name ? (
                              <img
                                src={getDistributorLogo(team.distributor_name) || "/placeholder.svg"}
                                alt=""
                                className="h-6 w-auto"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {Math.floor(team.total_points / puntosParaGol)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon="trophy"
                    title="¡Sé el primero en el ranking!"
                    description={`Tu equipo "${teamData?.name}" será el primero en aparecer cuando registres ventas.`}
                  >
                    <Button asChild size="sm">
                      <Link href="/capitan/registrar-venta">Registrar Venta</Link>
                    </Button>
                  </EmptyState>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Tu Posición
                  </CardTitle>
                  <CardDescription>Tu posición actual en el ranking</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-7xl font-bold">{rankingPosition || (zoneRanking.length > 0 ? "-" : "1")}</div>
                  <div className="text-5xl font-bold text-green-600">{totalGoles}</div>
                  <div className="text-4xl">
                    {rankingPosition === 1 && "🥇"}
                    {rankingPosition === 2 && "🥈"}
                    {rankingPosition === 3 && "🥉"}
                    {!rankingPosition && zoneRanking.length === 0 && "🥇"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Próximo Objetivo
                  </CardTitle>
                  <CardDescription>Lo que necesitas para subir de posición</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-7xl font-bold">
                    {zoneRanking.length <= 1 ? "0" : Math.ceil(nextGoal / puntosParaGol)}
                  </div>
                  <div className="text-xl">Goles necesarios</div>
                  <div className="text-4xl">
                    {nextMedal === "gold" && "🥇"}
                    {nextMedal === "silver" && "🥈"}
                    {nextMedal === "bronze" && "🥉"}
                    {zoneRanking.length <= 1 && "🥇"}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

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
                          {sale.products?.id && productImages[sale.products.id] ? (
                            <div className="h-12 w-12 rounded-md border bg-white flex items-center justify-center overflow-hidden">
                              <img
                                src={productImages[sale.products.id] || "/placeholder.svg"}
                                alt={sale.products?.name || "Producto"}
                                className="h-10 w-10 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-md border bg-gray-100 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{sale.products?.name || "Producto"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+{sale.total_points} puntos</p>
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
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(client.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {client.competitor || "Competidor no especificado"}
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/soccer-ball.png" alt="Balón" className="h-5 w-5" />
                  Penaltis
                </CardTitle>
                <CardDescription>Completa desafíos para ganar penaltis</CardDescription>
              </CardHeader>
              <CardContent>
                {penaltiesData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="rounded-md border p-2 text-center">
                        <div className="text-lg font-bold">{totalPenalties}</div>
                        <p className="text-xs text-muted-foreground">Penaltis totales</p>
                      </div>
                      <div className="rounded-md border p-2 text-center bg-corteva-50 border-corteva-200">
                        <div className="text-lg font-bold text-corteva-700">{availablePenalties}</div>
                        <p className="text-xs text-corteva-600">Penaltis disponibles</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleClaimPenalty}
                        disabled={availablePenalties === 0}
                      >
                        <img src="/soccer-ball.png" alt="Balón" className="h-4 w-4" />
                        <span>Reclamar un penalti (+25% goles)</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon="trophy"
                    title="No tienes penaltis aún"
                    description="Completa desafíos para ganar penaltis que te darán ventaja"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logros" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AchievementBadge
              type="gold"
              name="Goleador Estrella"
              description="Registra 100 goles en total"
              icon="trophy"
              progress={totalGoles >= 100 ? 100 : (totalGoles / 100) * 100}
              unlocked={totalGoles >= 100}
            />
            <AchievementBadge
              type="silver"
              name="Maestro de Ventas"
              description="Completa 50 ventas en total"
              icon="award"
              progress={totalSales >= 50 ? 100 : (totalSales / 50) * 100}
              unlocked={totalSales >= 50}
            />
            <AchievementBadge
              type="bronze"
              name="Cazador de Clientes"
              description="Capta 10 clientes de la competencia"
              icon="target"
              progress={clientsData.length >= 10 ? 100 : (clientsData.length / 10) * 100}
              unlocked={clientsData.length >= 10}
            />
            <AchievementBadge
              type="special"
              name="Racha Ganadora"
              description="Registra ventas 5 días consecutivos"
              icon="zap"
              unlocked={false}
              progress={30}
            />
            <AchievementBadge
              type="platinum"
              name="Dominador de Zona"
              description="Lidera el ranking de tu zona por 2 semanas"
              icon="crown"
              unlocked={false}
              progress={40}
            />
            <AchievementBadge
              type="diamond"
              name="Leyenda de Corteva"
              description="Alcanza el nivel Diamante"
              icon="star"
              unlocked={false}
              progress={15}
            />
          </div>
        </TabsContent>
      </Tabs>

      <GoalCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        goalCount={25}
        productName="Producto A"
      />

      <AlertDialog open={showPenaltyDialog} onOpenChange={setShowPenaltyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <img src="/soccer-ball.png" alt="Balón" className="h-5 w-5" />
              ¡Penalti Reclamado!
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="py-4 text-center">
                <div className="text-4xl font-bold text-corteva-600 mb-2">+{penaltyAmount} goles</div>
                <p>Has reclamado un penalti que te otorga un 25% adicional sobre tus goles actuales.</p>
                <div className="mt-4 p-3 bg-corteva-50 rounded-md border border-corteva-200">
                  <div className="flex justify-between text-sm">
                    <span>Goles actuales:</span>
                    <span className="font-medium">{totalGoles}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bono de penalti (25%):</span>
                    <span className="font-medium">+{penaltyAmount}</span>
                  </div>
                  <div className="border-t border-corteva-200 mt-2 pt-2 flex justify-between font-medium">
                    <span>Nuevo total:</span>
                    <span>{totalGoles + penaltyAmount}</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>¡Entendido!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LiveFeed />
    </div>
  )
}
