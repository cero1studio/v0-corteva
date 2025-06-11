"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AdminStatsChart } from "@/components/admin-stats-chart"
import { AdminZonesChart } from "@/components/admin-zones-chart"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Users,
  Building2,
  Package,
  Trophy,
  Settings,
  UserPlus,
  Download,
  AlertCircle,
  ShoppingBag,
  Award,
  MapPin,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useRouter } from "next/navigation"

// Interfaces para tipado
interface DashboardStats {
  totalCapitanes: number
  totalDirectores: number
  totalTeams: number
  totalZones: number
  totalProducts: number
  totalSales: number
}

interface TeamStats {
  id: string
  name: string
  zone: string
  points: number
  goals: number
}

interface ZoneStats {
  id: string
  name: string
  teams: number
  total_goals: number // Cambiado de 'points' a 'total_goals'
}

interface ProductStats {
  id: string
  name: string
  sales: number
  points: number
  totalPoints: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [zonesLoading, setZonesLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)

  const [stats, setStats] = useState<DashboardStats>({
    totalCapitanes: 0,
    totalDirectores: 0,
    totalTeams: 0,
    totalZones: 0,
    totalProducts: 0,
    totalSales: 0,
  })
  const [topTeams, setTopTeams] = useState<TeamStats[]>([])
  const [zoneStats, setZoneStats] = useState<ZoneStats[]>([])
  const [productStats, setProductStats] = useState<ProductStats[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  useEffect(() => {
    // Verificar sesión primero
    checkSession()
  }, [router])

  async function checkSession(retry = 0) {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error al verificar sesión:", sessionError)
        if (retry < maxRetries && sessionError.message?.includes("Failed to fetch")) {
          console.log(`Error de red, reintentando... (${retry + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return checkSession(retry + 1)
        }
        setError("Error de conexión. Por favor, verifica tu conexión a internet.")
        setLoading(false)
        return
      }

      if (!sessionData.session) {
        console.log("No hay sesión activa")
        router.push("/login")
        return
      }

      // Verificar perfil con reintentos
      await verifyProfile(sessionData.session.user.id, retry)
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
      setError("Error de conexión. Por favor, verifica tu conexión a internet.")
      setLoading(false)
    }
  }

  async function verifyProfile(userId: string, retry = 0) {
    try {
      // Esperar un poco para dar tiempo a que se actualice el perfil
      if (retry === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("Error al obtener perfil:", profileError)

        if (retry < maxRetries && profileError.message?.includes("Failed to fetch")) {
          console.log(`Error de red al obtener perfil, reintentando... (${retry + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return verifyProfile(userId, retry + 1)
        }

        setError("Error al verificar permisos. Por favor, inicia sesión nuevamente.")
        setLoading(false)
        return
      }

      if (profile.role !== "admin") {
        console.log("Usuario no es admin:", profile.role)
        router.push(`/${profile.role}/dashboard`)
        return
      }

      // Si todo está bien, cargar datos en paralelo
      setLoading(false)

      // Cargar datos en paralelo para mejorar la experiencia
      fetchBasicStats()
      fetchTopTeams()
      fetchZoneStats()
      fetchProductStats()
    } catch (error) {
      console.error("Error al verificar perfil:", error)
      setError("Error al verificar permisos. Por favor, inicia sesión nuevamente.")
      setLoading(false)
    }
  }

  // Obtener estadísticas básicas (conteos)
  async function fetchBasicStats(retry = 0) {
    try {
      setStatsLoading(true)

      // Realizar todas las consultas de conteo en paralelo
      const [capitanesResult, directoresResult, teamsResult, zonesResult, productsResult, salesResult] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "capitan"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "director_tecnico"),
          supabase.from("teams").select("*", { count: "exact", head: true }),
          supabase.from("zones").select("*", { count: "exact", head: true }),
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("sales").select("*", { count: "exact", head: true }),
        ])

      // Verificar errores
      if (
        capitanesResult.error ||
        directoresResult.error ||
        teamsResult.error ||
        zonesResult.error ||
        productsResult.error ||
        salesResult.error
      ) {
        // Si hay error de red y no hemos alcanzado el máximo de reintentos
        if (retry < maxRetries) {
          console.log(`Error de red al obtener estadísticas, reintentando... (${retry + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return fetchBasicStats(retry + 1)
        }

        throw new Error("Error al obtener estadísticas básicas")
      }

      setStats({
        totalCapitanes: capitanesResult.count || 0,
        totalDirectores: directoresResult.count || 0,
        totalTeams: teamsResult.count || 0,
        totalZones: zonesResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalSales: salesResult.count || 0,
      })

      setRetryCount(0)
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error)

      if (retry < maxRetries && error.message?.includes("Failed to fetch")) {
        setRetryCount(retry + 1)
        setError(`Error de conexión. Reintentando... (${retry + 1}/${maxRetries})`)
        return
      }

      setError(`Error al cargar estadísticas: ${error.message}`)
    } finally {
      setStatsLoading(false)
    }
  }

  async function fetchTopTeams() {
    try {
      setTeamsLoading(true)

      // 1. Obtener configuración de puntos para gol
      const { data: puntosConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const pointsPerGoal = puntosConfig?.value ? Number(puntosConfig.value) : 100

      // 2. Obtener datos de equipos, zonas y distribuidores en una sola consulta
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select(`
          id, 
          name, 
          zone_id,
          zones (id, name),
          distributors (id, name)
        `)

      if (teamsError) throw teamsError

      if (!teamsData || teamsData.length === 0) {
        setTopTeams([])
        setTeamsLoading(false)
        return
      }

      // 3. Obtener todos los miembros de equipos en una sola consulta
      const { data: allMembers } = await supabase.from("profiles").select("id, team_id").not("team_id", "is", null)

      // Crear mapa de miembros por equipo
      const teamMembersMap = new Map<string, string[]>()
      if (allMembers) {
        allMembers.forEach((member) => {
          if (!teamMembersMap.has(member.team_id)) {
            teamMembersMap.set(member.team_id, [])
          }
          teamMembersMap.get(member.team_id)!.push(member.id)
        })
      }

      // 4. Obtener todas las ventas en una sola consulta
      const { data: allSales } = await supabase.from("sales").select("points, representative_id, team_id")

      // 5. Obtener todos los clientes en una sola consulta
      const { data: allClients } = await supabase
        .from("competitor_clients")
        .select("id, points, representative_id, team_id")

      // 6. Obtener todos los tiros libres en una sola consulta
      const { data: allFreeKicks } = await supabase.from("free_kick_goals").select("points, team_id")

      // Procesar datos para cada equipo
      const teamPointsMap = new Map<string, TeamStats>()

      for (const team of teamsData) {
        const memberIds = teamMembersMap.get(team.id) || []

        // Calcular puntos de ventas
        let salesPoints = 0
        if (allSales) {
          // Ventas por representante
          allSales
            .filter((sale) => memberIds.includes(sale.representative_id))
            .forEach((sale) => (salesPoints += sale.points || 0))

          // Ventas directas por equipo
          allSales.filter((sale) => sale.team_id === team.id).forEach((sale) => (salesPoints += sale.points || 0))
        }

        // Calcular puntos de clientes
        let clientsPoints = 0
        const countedClientIds = new Set<string>()

        if (allClients) {
          // Clientes por representante
          allClients
            .filter((client) => memberIds.includes(client.representative_id))
            .forEach((client) => {
              if (!countedClientIds.has(client.id)) {
                clientsPoints += client.points || 200
                countedClientIds.add(client.id)
              }
            })

          // Clientes directos por equipo
          allClients
            .filter((client) => client.team_id === team.id)
            .forEach((client) => {
              if (!countedClientIds.has(client.id)) {
                clientsPoints += client.points || 200
                countedClientIds.add(client.id)
              }
            })
        }

        // Calcular puntos de tiros libres
        let freeKicksPoints = 0
        if (allFreeKicks) {
          allFreeKicks.filter((fk) => fk.team_id === team.id).forEach((fk) => (freeKicksPoints += fk.points || 0))
        }

        // Calcular puntos totales y goles
        const totalPoints = salesPoints + clientsPoints + freeKicksPoints
        const goals = Math.floor(totalPoints / pointsPerGoal)

        const zoneName = team.zones?.name || "Sin zona"

        teamPointsMap.set(team.id, {
          id: team.id,
          name: team.name,
          zone: zoneName,
          points: totalPoints,
          goals: goals,
        })
      }

      // Convertir a array y ordenar por puntos totales
      const sortedTeams = Array.from(teamPointsMap.values())
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)

      setTopTeams(sortedTeams)
    } catch (error: any) {
      console.error("Error al cargar equipos destacados:", error)
      // No establecemos error global para no bloquear todo el dashboard
    } finally {
      setTeamsLoading(false)
    }
  }

  async function fetchZoneStats() {
    try {
      setZonesLoading(true)

      // 1. Obtener configuración de puntos para gol
      const { data: puntosConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const pointsPerGoal = puntosConfig?.value ? Number(puntosConfig.value) : 100

      // 2. Obtener todas las zonas
      const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name")

      if (zonesError) throw zonesError

      if (!zones || zones.length === 0) {
        setZoneStats([])
        setZonesLoading(false)
        return
      }

      // 3. Obtener todos los equipos con sus zonas
      const { data: teams } = await supabase.from("teams").select("id, zone_id").not("zone_id", "is", null)

      // Crear mapa de equipos por zona
      const zoneTeamsMap = new Map<string, string[]>()
      if (teams) {
        teams.forEach((team) => {
          if (!zoneTeamsMap.has(team.zone_id)) {
            zoneTeamsMap.set(team.zone_id, [])
          }
          zoneTeamsMap.get(team.zone_id)!.push(team.id)
        })
      }

      // 4. Obtener todos los miembros de equipos
      const { data: allMembers } = await supabase.from("profiles").select("id, team_id").not("team_id", "is", null)

      // Crear mapa de miembros por equipo
      const teamMembersMap = new Map<string, string[]>()
      if (allMembers) {
        allMembers.forEach((member) => {
          if (!teamMembersMap.has(member.team_id)) {
            teamMembersMap.set(member.team_id, [])
          }
          teamMembersMap.get(member.team_id)!.push(member.id)
        })
      }

      // 5. Obtener todas las ventas, clientes y tiros libres en una sola consulta
      const [salesResult, clientsResult, freeKicksResult] = await Promise.all([
        supabase.from("sales").select("points, representative_id, team_id"),
        supabase.from("competitor_clients").select("id, points, representative_id, team_id"),
        supabase.from("free_kick_goals").select("points, team_id"),
      ])

      const allSales = salesResult.data || []
      const allClients = clientsResult.data || []
      const allFreeKicks = freeKicksResult.data || []

      // Procesar datos para cada zona
      const zoneStatsData: ZoneStats[] = zones.map((zone) => {
        const teamIds = zoneTeamsMap.get(zone.id) || []
        let totalPoints = 0

        // Para cada equipo en la zona
        teamIds.forEach((teamId) => {
          const memberIds = teamMembersMap.get(teamId) || []

          // Calcular puntos de ventas
          let salesPoints = 0

          // Ventas por representante
          allSales
            .filter((sale) => memberIds.includes(sale.representative_id))
            .forEach((sale) => (salesPoints += sale.points || 0))

          // Ventas directas por equipo
          allSales.filter((sale) => sale.team_id === teamId).forEach((sale) => (salesPoints += sale.points || 0))

          // Calcular puntos de clientes
          let clientsPoints = 0
          const countedClientIds = new Set<string>()

          // Clientes por representante
          allClients
            .filter((client) => memberIds.includes(client.representative_id))
            .forEach((client) => {
              if (!countedClientIds.has(client.id)) {
                clientsPoints += client.points || 200
                countedClientIds.add(client.id)
              }
            })

          // Clientes directos por equipo
          allClients
            .filter((client) => client.team_id === teamId)
            .forEach((client) => {
              if (!countedClientIds.has(client.id)) {
                clientsPoints += client.points || 200
                countedClientIds.add(client.id)
              }
            })

          // Calcular puntos de tiros libres
          let freeKicksPoints = 0
          allFreeKicks.filter((fk) => fk.team_id === teamId).forEach((fk) => (freeKicksPoints += fk.points || 0))

          // Sumar al total de la zona
          totalPoints += salesPoints + clientsPoints + freeKicksPoints
        })

        // Calcular goles totales de la zona
        const totalGoals = Math.floor(totalPoints / pointsPerGoal)

        return {
          id: zone.id,
          name: zone.name,
          teams: teamIds.length,
          total_goals: totalGoals, // Cambiado de 'points' a 'total_goals'
        }
      })

      // Añadir este console.log para depuración
      console.log("DEBUG: Calculated zoneStatsData:", zoneStatsData)

      setZoneStats(zoneStatsData)
    } catch (error) {
      console.error("Error al cargar estadísticas de zonas:", error)
      // No establecemos error global para no bloquear todo el dashboard
    } finally {
      setZonesLoading(false)
    }
  }

  async function fetchProductStats() {
    try {
      setProductsLoading(true)

      // 1. Obtener productos con sus puntos
      const { data: products, error: productsError } = await supabase.from("products").select("id, name, points")

      if (productsError) throw productsError

      if (!products || products.length === 0) {
        setProductStats([])
        setProductsLoading(false)
        return
      }

      // 2. Obtener todas las ventas en una sola consulta
      const { data: allSales } = await supabase.from("sales").select("product_id, quantity, points")

      // Crear mapa para contar ventas por producto
      const productSalesMap = new Map<string, { count: number; points: number }>()

      if (allSales) {
        allSales.forEach((sale) => {
          if (!productSalesMap.has(sale.product_id)) {
            productSalesMap.set(sale.product_id, { count: 0, points: 0 })
          }
          const current = productSalesMap.get(sale.product_id)!
          current.count += sale.quantity || 1
          current.points += sale.points || 0
        })
      }

      // Procesar estadísticas de productos
      const productStatsData = products.map((product) => {
        const salesData = productSalesMap.get(product.id) || { count: 0, points: 0 }

        return {
          id: product.id,
          name: product.name,
          sales: salesData.count,
          points: product.points || 0,
          totalPoints: salesData.points,
        }
      })

      // Ordenar por ventas
      productStatsData.sort((a, b) => b.sales - a.sales)

      setProductStats(productStatsData)
    } catch (error) {
      console.error("Error al cargar estadísticas de productos:", error)
      // No establecemos error global para no bloquear todo el dashboard
    } finally {
      setProductsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    fetchBasicStats()
    fetchTopTeams()
    fetchZoneStats()
    fetchProductStats()
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full mt-6" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar el dashboard"
        description={error}
        actionLabel="Reintentar"
        onClick={handleRetry}
        className="flex-1 py-20"
        iconClassName="bg-red-50"
      />
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Administrador</h2>
          <div className="text-muted-foreground">
            Gestión del concurso Super Ganadería | {stats.totalTeams} Equipos activos
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/usuarios/nuevo">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/configuracion">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalTeams}</div>
            )}
            <p className="text-xs text-muted-foreground">Equipos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capitanes y Directores Técnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalCapitanes + stats.totalDirectores}</div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Capitanes: {stats.totalCapitanes}</span>
              <span>Directores Técnicos: {stats.totalDirectores}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            )}
            <p className="text-xs text-muted-foreground">Productos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            )}
            <p className="text-xs text-muted-foreground">Ventas registradas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Estadísticas Generales</TabsTrigger>
          <TabsTrigger value="zonas">Rendimiento por Zonas</TabsTrigger>
          <TabsTrigger value="productos">Ventas por Producto</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Evolución del Concurso</CardTitle>
                <CardDescription>Goles acumulados por equipo y semana</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[400px]">
                  <AdminStatsChart />
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Equipos Destacados</CardTitle>
                <CardDescription>Top 5 equipos con mayor rendimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamsLoading ? (
                    <>
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </>
                  ) : topTeams.length === 0 ? (
                    <EmptyState
                      icon={Award}
                      title="No hay equipos destacados"
                      description="Registra ventas para ver los equipos con mejor rendimiento."
                      className="py-6"
                      iconClassName="bg-amber-50"
                    />
                  ) : (
                    <>
                      {topTeams.map((team, index) => (
                        <div key={team.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <span
                                  className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-medium ${
                                    index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"
                                  }`}
                                >
                                  {index + 1}
                                </span>
                              )}
                              <span className="font-medium">{team.name}</span>
                              <span className="text-xs text-muted-foreground">({team.zone})</span>
                            </div>
                            <span className="font-bold text-green-600">{team.goals}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                {!teamsLoading && (
                  <div className="mt-4 flex justify-end gap-3">
                    <Button asChild variant="default" size="sm">
                      <Link href="/admin/equipos/nuevo">Crear Equipo</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/admin/ranking">Ver ranking completo</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="zonas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Zonas</CardTitle>
              <CardDescription>Rendimiento por zona geográfica</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <AdminZonesChart zonesData={zoneStats.sort((a, b) => b.total_goals - a.total_goals).slice(0, 2)} />
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            {zonesLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : zoneStats.length === 0 ? (
              <div className="col-span-3">
                <EmptyState
                  icon={MapPin}
                  title="No hay zonas registradas"
                  description="Crea zonas geográficas para organizar tus equipos y ver su rendimiento."
                  actionLabel="Crear Zona"
                  actionHref="/admin/zonas/nuevo"
                  className="py-10"
                />
              </div>
            ) : (
              zoneStats.map((zone) => (
                <Card key={zone.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{zone.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{zone.total_goals}</div>
                    <p className="text-xs text-muted-foreground">{zone.teams} equipos</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Producto</CardTitle>
              <CardDescription>Distribución de ventas por producto</CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <>
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : productStats.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No hay productos registrados"
                  description="Crea productos para que los equipos puedan registrar sus ventas."
                  actionLabel="Crear Producto"
                  actionHref="/admin/productos/nuevo"
                  className="py-10"
                  iconClassName="bg-green-50"
                />
              ) : (
                <div className="space-y-4">
                  {productStats.map((product) => (
                    <div key={product.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{product.name}</span>
                        <span className="font-bold text-green-600">{product.sales} unidades</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{product.sales} unidades</span>
                        <span>{product.totalPoints} puntos</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex justify-center space-x-3">
                <Button asChild variant="default" size="sm" className="gap-2">
                  <Link href="/admin/productos">
                    <Package className="mr-2 h-4 w-4" />
                    Gestionar Productos
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar datos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
