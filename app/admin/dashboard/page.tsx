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

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCapitanes: 0,
    totalDirectores: 0,
    totalTeams: 0,
    totalZones: 0,
    totalProducts: 0,
    totalSales: 0,
  })
  const [topTeams, setTopTeams] = useState<any[]>([])
  const [zoneStats, setZoneStats] = useState<any[]>([])
  const [productStats, setProductStats] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [salesStructure, setSalesStructure] = useState<any>(null)
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
        // En lugar de redirect inmediato, establecer error y permitir que el usuario reintente
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

        // Si es un error de red y no hemos alcanzado el máximo de reintentos
        if (retry < maxRetries && profileError.message?.includes("Failed to fetch")) {
          console.log(`Error de red al obtener perfil, reintentando... (${retry + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return verifyProfile(userId, retry + 1)
        }

        // En lugar de solo establecer error, también detener loading
        setError("Error al verificar permisos. Por favor, inicia sesión nuevamente.")
        setLoading(false)
        return
      }

      if (profile.role !== "admin") {
        console.log("Usuario no es admin:", profile.role)
        router.push(`/${profile.role}/dashboard`)
        return
      }

      // Si todo está bien, cargar datos
      fetchStructure()
    } catch (error) {
      console.error("Error al verificar perfil:", error)
      setError("Error al verificar permisos. Por favor, inicia sesión nuevamente.")
      setLoading(false)
    }
  }

  // Obtener la estructura de la tabla sales primero
  async function fetchStructure(retry = 0) {
    try {
      // Verificar la estructura de la tabla sales
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id, team_id, product_id, points, created_at")
        .limit(1)

      if (salesError) {
        // Si es un error de red y no hemos alcanzado el máximo de reintentos
        if (retry < maxRetries && salesError.message?.includes("Failed to fetch")) {
          console.log(`Error de red al obtener estructura, reintentando... (${retry + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return fetchStructure(retry + 1)
        }

        throw salesError
      }

      if (salesData && salesData.length > 0) {
        setSalesStructure(salesData[0])
      } else {
        // Si no hay datos, crear estructura por defecto
        setSalesStructure({ team_id: null, id_team: null })
      }

      // Continuar con el resto de las consultas
      fetchStats()
      fetchTopTeams()
      fetchZoneStats()
      fetchProductStats()
    } catch (error: any) {
      console.error("Error al obtener estructura:", error)
      setError(`Error al cargar datos: ${error.message}`)
      setLoading(false)
    }
  }

  async function fetchStats(retry = 0) {
    try {
      setLoading(true)

      // Obtener estadísticas de capitanes
      const { count: capitanesCount, error: capitanesError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "capitan")

      if (capitanesError) {
        // Si es un error de red y no hemos alcanzado el máximo de reintentos
        if (retry < maxRetries && capitanesError.message?.includes("Failed to fetch")) {
          console.log(`Error de red al obtener capitanes, reintentando... (${retry + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return fetchStats(retry + 1)
        }

        throw capitanesError
      }

      // Obtener estadísticas de directores técnicos
      const { count: directoresCount, error: directoresError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "director_tecnico")

      if (directoresError) throw directoresError

      // Obtener estadísticas de equipos
      const { count: teamsCount, error: teamsError } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true })

      if (teamsError) throw teamsError

      // Obtener estadísticas de zonas
      const { count: zonesCount, error: zonesError } = await supabase
        .from("zones")
        .select("*", { count: "exact", head: true })

      if (zonesError) throw zonesError

      // Obtener estadísticas de productos
      const { count: productsCount, error: productsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })

      if (productsError) throw productsError

      // Obtener estadísticas de ventas
      const { count: salesCount, error: salesError } = await supabase
        .from("sales")
        .select("*", { count: "exact", head: true })

      if (salesError) throw salesError

      setStats({
        totalCapitanes: capitanesCount || 0,
        totalDirectores: directoresCount || 0,
        totalTeams: teamsCount || 0,
        totalZones: zonesCount || 0,
        totalProducts: productsCount || 0,
        totalSales: salesCount || 0,
      })

      // Resetear contador de reintentos en caso de éxito
      setRetryCount(0)
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error)

      // Si es un error de red y no hemos alcanzado el máximo de reintentos
      if (retry < maxRetries && error.message?.includes("Failed to fetch")) {
        setRetryCount(retry + 1)
        setError(`Error de conexión. Reintentando... (${retry + 1}/${maxRetries})`)
        return
      }

      setError(`Error al cargar estadísticas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTopTeams() {
    try {
      // Obtener configuración de puntos para gol
      const { data: puntosConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const pointsPerGoal = puntosConfig?.value ? Number(puntosConfig.value) : 100

      // Obtener todos los equipos con sus miembros
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("id, name, zone_id")

      if (teamsError) throw teamsError

      // Obtener todas las zonas
      const { data: zonesData, error: zonesError } = await supabase.from("zones").select("id, name")

      if (zonesError) throw zonesError

      // Crear mapa de zonas para búsqueda rápida
      const zonesMap = Object.fromEntries(zonesData.map((zone) => [zone.id, zone]))

      // Calcular puntos totales para cada equipo
      const teamPoints: Record<string, { id: string; name: string; zone: string; points: number; goals: number }> = {}

      for (const team of teamsData) {
        // Obtener miembros del equipo
        const { data: teamMembers } = await supabase.from("profiles").select("id").eq("team_id", team.id)
        const memberIds = teamMembers?.map((member) => member.id) || []

        // 1. PUNTOS DE VENTAS - BUSCAR POR AMBOS CAMPOS
        let salesPoints = 0

        // Buscar ventas por representative_id (miembros del equipo)
        if (memberIds.length > 0) {
          const { data: salesByRep } = await supabase.from("sales").select("points").in("representative_id", memberIds)
          if (salesByRep) {
            salesPoints += salesByRep.reduce((sum, sale) => sum + (sale.points || 0), 0)
          }
        }

        // Buscar ventas directas por team_id
        const { data: salesByTeam } = await supabase.from("sales").select("points").eq("team_id", team.id)
        if (salesByTeam) {
          salesPoints += salesByTeam.reduce((sum, sale) => sum + (sale.points || 0), 0)
        }

        // 2. PUNTOS DE CLIENTES DE COMPETENCIA
        let clientsPoints = 0

        // Buscar clientes por representative_id
        if (memberIds.length > 0) {
          const { data: clientsByRep } = await supabase
            .from("competitor_clients")
            .select("points")
            .in("representative_id", memberIds)
          if (clientsByRep) {
            clientsPoints += clientsByRep.reduce((sum, client) => sum + (client.points || 200), 0)
          }
        }

        // Buscar clientes directos por team_id
        const { data: clientsByTeam } = await supabase
          .from("competitor_clients")
          .select("points")
          .eq("team_id", team.id)
        if (clientsByTeam) {
          clientsPoints += clientsByTeam.reduce((sum, client) => sum + (client.points || 200), 0)
        }

        // 3. PUNTOS DE TIROS LIBRES
        const { data: freeKicksData } = await supabase.from("free_kick_goals").select("points").eq("team_id", team.id)
        const freeKicksPoints = freeKicksData?.reduce((sum, freeKick) => sum + (freeKick.points || 0), 0) || 0

        // SUMAR TODOS LOS PUNTOS
        const totalPoints = salesPoints + clientsPoints + freeKicksPoints
        const goals = Math.floor(totalPoints / pointsPerGoal)

        const zoneName = team.zone_id && zonesMap[team.zone_id] ? zonesMap[team.zone_id].name : "Sin zona"

        teamPoints[team.id] = {
          id: team.id,
          name: team.name,
          zone: zoneName,
          points: totalPoints,
          goals: goals,
        }
      }

      // Convertir a array y ordenar por puntos totales
      const sortedTeams = Object.values(teamPoints)
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)

      setTopTeams(sortedTeams)
    } catch (error: any) {
      console.error("Error al cargar equipos destacados:", error)
      // No establecemos error global para no bloquear todo el dashboard
    }
  }

  async function fetchZoneStats() {
    try {
      // Obtener configuración de puntos para gol
      const { data: puntosConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const pointsPerGoal = puntosConfig?.value ? Number(puntosConfig.value) : 100

      // Obtener zonas
      const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name")

      if (zonesError) throw zonesError

      if (!zones || zones.length === 0) {
        setZoneStats([])
        return
      }

      // Para cada zona, obtener equipos y calcular puntos totales
      const zoneStatsData = await Promise.all(
        zones.map(async (zone) => {
          // Contar equipos en la zona
          const { count: teamCount, error: teamError } = await supabase
            .from("teams")
            .select("*", { count: "exact", head: true })
            .eq("zone_id", zone.id)

          if (teamError) throw teamError

          // Obtener equipos de la zona
          const { data: teamIds, error: teamIdsError } = await supabase
            .from("teams")
            .select("id")
            .eq("zone_id", zone.id)

          if (teamIdsError) throw teamIdsError

          let totalPoints = 0
          let totalGoals = 0

          if (teamIds && teamIds.length > 0) {
            for (const team of teamIds) {
              // Obtener miembros del equipo
              const { data: teamMembers } = await supabase.from("profiles").select("id").eq("team_id", team.id)
              const memberIds = teamMembers?.map((member) => member.id) || []

              // 1. PUNTOS DE VENTAS
              let salesPoints = 0

              // Buscar ventas por representative_id
              if (memberIds.length > 0) {
                const { data: salesByRep } = await supabase
                  .from("sales")
                  .select("points")
                  .in("representative_id", memberIds)
                if (salesByRep) {
                  salesPoints += salesByRep.reduce((sum, sale) => sum + (sale.points || 0), 0)
                }
              }

              // Buscar ventas directas por team_id
              const { data: salesByTeam } = await supabase.from("sales").select("points").eq("team_id", team.id)
              if (salesByTeam) {
                salesPoints += salesByTeam.reduce((sum, sale) => sum + (sale.points || 0), 0)
              }

              // 2. PUNTOS DE CLIENTES DE COMPETENCIA
              let clientsPoints = 0

              // Buscar clientes por representative_id
              if (memberIds.length > 0) {
                const { data: clientsByRep } = await supabase
                  .from("competitor_clients")
                  .select("points")
                  .in("representative_id", memberIds)
                if (clientsByRep) {
                  clientsPoints += clientsByRep.reduce((sum, client) => sum + (client.points || 200), 0)
                }
              }

              // Buscar clientes directos por team_id
              const { data: clientsByTeam } = await supabase
                .from("competitor_clients")
                .select("points")
                .eq("team_id", team.id)
              if (clientsByTeam) {
                clientsPoints += clientsByTeam.reduce((sum, client) => sum + (client.points || 200), 0)
              }

              // 3. PUNTOS DE TIROS LIBRES
              const { data: freeKicksData } = await supabase
                .from("free_kick_goals")
                .select("points")
                .eq("team_id", team.id)
              const freeKicksPoints = freeKicksData?.reduce((sum, freeKick) => sum + (freeKick.points || 0), 0) || 0

              // SUMAR TODOS LOS PUNTOS
              const teamTotalPoints = salesPoints + clientsPoints + freeKicksPoints
              totalPoints += teamTotalPoints
            }

            totalGoals = Math.floor(totalPoints / pointsPerGoal)
          }

          return {
            id: zone.id,
            name: zone.name,
            teams: teamCount || 0,
            points: totalGoals, // Mostrar goles en lugar de puntos
          }
        }),
      )

      setZoneStats(zoneStatsData)
    } catch (error) {
      console.error("Error al cargar estadísticas de zonas:", error)
      // No establecemos error global para no bloquear todo el dashboard
    }
  }

  async function fetchProductStats() {
    try {
      // Obtener productos
      const { data: products, error: productsError } = await supabase.from("products").select("id, name, points")

      if (productsError) throw productsError

      if (!products || products.length === 0) {
        setProductStats([])
        return
      }

      // Para cada producto, obtener ventas
      const productStatsData = await Promise.all(
        products.map(async (product) => {
          // Contar ventas del producto
          const { count: salesCount, error: salesError } = await supabase
            .from("sales")
            .select("*", { count: "exact", head: true })
            .eq("product_id", product.id)

          if (salesError) throw salesError

          // Calcular puntos totales
          const totalPoints = (salesCount || 0) * (product.points || 0)

          return {
            id: product.id,
            name: product.name,
            sales: salesCount || 0,
            points: product.points || 0,
            totalPoints,
          }
        }),
      )

      // Ordenar por ventas
      productStatsData.sort((a, b) => b.sales - a.sales)

      setProductStats(productStatsData)
    } catch (error) {
      console.error("Error al cargar estadísticas de productos:", error)
      // No establecemos error global para no bloquear todo el dashboard
    }
  }

  const handleRetry = () => {
    setError(null)
    fetchStructure()
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
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.totalTeams}</div>}
            <p className="text-xs text-muted-foreground">Equipos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capitanes y Directores Técnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
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
            {loading ? (
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
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.totalSales}</div>}
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
                  {loading ? (
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
                {!loading && (
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
                <AdminZonesChart />
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            {loading ? (
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
                    <div className="text-2xl font-bold text-green-600">{zone.points}</div>
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
              {loading ? (
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
                        <span>{product.totalPoints} goles</span>
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
