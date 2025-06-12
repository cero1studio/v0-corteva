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

      const [capitanesResult, directoresResult, teamsResult, zonesResult, productsResult, salesResult] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "capitan"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "director_tecnico"),
          supabase.from("teams").select("*", { count: "exact", head: true }),
          supabase.from("zones").select("*", { count: "exact", head: true }),
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("sales").select("*", { count: "exact", head: true }),
        ])

      if (capitanesResult.error) throw capitanesResult.error
      if (directoresResult.error) throw directoresResult.error
      if (teamsResult.error) throw teamsResult.error
      if (zonesResult.error) throw zonesResult.error
      if (productsResult.error) throw productsResult.error
      if (salesResult.error) throw salesResult.error

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
      setLoading(false)
    }
  }

  async function fetchTopTeams() {
    try {
      const [
        teamsResult,
        zonesResult,
        profilesResult,
        salesResult,
        clientsResult,
        freeKicksResult,
        puntosConfigResult,
      ] = await Promise.all([
        supabase.from("teams").select("id, name, zone_id"),
        supabase.from("zones").select("id, name"),
        supabase.from("profiles").select("id, team_id"),
        supabase.from("sales").select("points, representative_id, team_id"),
        supabase.from("competitor_clients").select("id, points, representative_id, team_id"),
        supabase.from("free_kick_goals").select("points, team_id"),
        supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
      ])

      if (teamsResult.error) throw teamsResult.error
      if (zonesResult.error) throw zonesResult.error
      if (profilesResult.error) throw profilesResult.error
      if (salesResult.error) throw salesResult.error
      if (clientsResult.error) throw clientsResult.error
      if (freeKicksResult.error) throw freeKicksResult.error
      if (puntosConfigResult.error) throw puntosConfigResult.error

      const teams = teamsResult.data || []
      const zonesMap = new Map(zonesResult.data?.map((zone) => [zone.id, zone.name]))
      const profiles = profilesResult.data || []
      const sales = salesResult.data || []
      const clients = clientsResult.data || []
      const freeKicks = freeKicksResult.data || []
      const puntosParaGol = puntosConfigResult.data?.value ? Number(puntosConfigResult.data.value) : 100

      const profileTeamMap = new Map(profiles.map((p) => [p.id, p.team_id]))

      const teamPoints: Record<string, { id: string; name: string; zone: string; points: number; goals: number }> = {}

      teams.forEach((team) => {
        let salesPoints = 0
        let clientsPoints = 0
        let freeKicksPoints = 0

        // Aggregate sales points
        sales
          .filter((s) => s.team_id === team.id || profileTeamMap.get(s.representative_id || "") === team.id)
          .forEach((s) => (salesPoints += s.points || 0))

        // Aggregate client points
        clients
          .filter((c) => c.team_id === team.id || profileTeamMap.get(c.representative_id || "") === team.id)
          .forEach((c) => (clientsPoints += c.points || 200))

        // Aggregate free kick points
        freeKicks.filter((fk) => fk.team_id === team.id).forEach((fk) => (freeKicksPoints += fk.points || 0))

        const totalPoints = salesPoints + clientsPoints + freeKicksPoints
        const goals = Math.floor(totalPoints / puntosParaGol)
        const zoneName = zonesMap.get(team.zone_id) || "Sin zona"

        teamPoints[team.id] = {
          id: team.id,
          name: team.name,
          zone: zoneName,
          points: totalPoints,
          goals: goals,
        }
      })

      const sortedTeams = Object.values(teamPoints)
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)

      setTopTeams(sortedTeams)
    } catch (error: any) {
      console.error("Error al cargar equipos destacados:", error)
    }
  }

  async function fetchZoneStats() {
    try {
      console.log("🔄 Fetching zone stats (optimized)...")
      setLoading(true)

      const [
        zonesResult,
        teamsResult,
        profilesResult,
        salesResult,
        clientsResult,
        freeKicksResult,
        puntosConfigResult,
      ] = await Promise.all([
        supabase.from("zones").select("id, name"),
        supabase.from("teams").select("id, name, zone_id"),
        supabase.from("profiles").select("id, team_id"),
        supabase.from("sales").select("points, representative_id, team_id"),
        supabase.from("competitor_clients").select("id, points, representative_id, team_id"),
        supabase.from("free_kick_goals").select("points, team_id"),
        supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
      ])

      if (zonesResult.error) throw zonesResult.error
      if (teamsResult.error) throw teamsResult.error
      if (profilesResult.error) throw profilesResult.error
      if (salesResult.error) throw salesResult.error
      if (clientsResult.error) throw clientsResult.error
      if (freeKicksResult.error) throw freeKicksResult.error
      if (puntosConfigResult.error) throw puntosConfigResult.error

      const zones = zonesResult.data || []
      const teams = teamsResult.data || []
      const profiles = profilesResult.data || []
      const sales = salesResult.data || []
      const clients = clientsResult.data || []
      const freeKicks = freeKicksResult.data || []
      const puntosParaGol = puntosConfigResult.data?.value ? Number(puntosConfigResult.data.value) : 100

      console.log("DEBUG: Puntos para gol (dashboard):", puntosParaGol)

      const profileTeamMap = new Map(profiles.map((p) => [p.id, p.team_id]))

      const teamPointsMap = new Map<string, { sales: number; clients: number; freeKicks: number }>()

      // Aggregate sales points per team
      sales.forEach((s) => {
        let teamId = s.team_id
        if (!teamId && s.representative_id) {
          teamId = profileTeamMap.get(s.representative_id) || null
        }
        if (teamId) {
          const current = teamPointsMap.get(teamId) || { sales: 0, clients: 0, freeKicks: 0 }
          current.sales += s.points || 0
          teamPointsMap.set(teamId, current)
        }
      })

      // Aggregate client points per team
      clients.forEach((c) => {
        let teamId = c.team_id
        if (!teamId && c.representative_id) {
          teamId = profileTeamMap.get(c.representative_id) || null
        }
        if (teamId) {
          const current = teamPointsMap.get(teamId) || { sales: 0, clients: 0, freeKicks: 0 }
          current.clients += c.points || 200
          teamPointsMap.set(teamId, current)
        }
      })

      // Aggregate free kick points per team
      freeKicks.forEach((fk) => {
        if (fk.team_id) {
          const current = teamPointsMap.get(fk.team_id) || { sales: 0, clients: 0, freeKicks: 0 }
          current.freeKicks += fk.points || 0
          teamPointsMap.set(fk.team_id, current)
        }
      })

      const zoneStatsData = zones.map((zone) => {
        let totalZonePoints = 0
        let totalZoneTeamsCount = 0

        const teamsInZone = teams.filter((t) => t.zone_id === zone.id)
        totalZoneTeamsCount = teamsInZone.length

        teamsInZone.forEach((team) => {
          const teamAggregatedPoints = teamPointsMap.get(team.id) || { sales: 0, clients: 0, freeKicks: 0 }
          const teamTotalPoints =
            teamAggregatedPoints.sales + teamAggregatedPoints.clients + teamAggregatedPoints.freeKicks
          totalZonePoints += teamTotalPoints
        })

        const totalZoneGoals = Math.floor(totalZonePoints / puntosParaGol)

        console.log(
          `DEBUG: Zone ${zone.name} - Total Points: ${totalZonePoints}, Total Goals: ${totalZoneGoals}, Teams: ${totalZoneTeamsCount}`,
        )

        return {
          id: zone.id,
          name: zone.name,
          teams: totalZoneTeamsCount,
          points: totalZoneGoals, // Usado por AdminZonesChart como 'goles'
          total_goals: totalZoneGoals, // Para consistencia y claridad
          total_points: totalZonePoints, // Para consistencia y claridad
        }
      })

      setZoneStats(zoneStatsData)
      console.log("DEBUG: Final zoneStatsData for dashboard:", zoneStatsData)
    } catch (err: any) {
      console.error("❌ Error al cargar datos del gráfico de zonas (optimized):", err)
      setError(`Error al cargar datos de zonas: ${err.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProductStats() {
    try {
      const [productsResult, salesResult] = await Promise.all([
        supabase.from("products").select("id, name, points"),
        supabase.from("sales").select("product_id, quantity, points"),
      ])

      if (productsResult.error) throw productsResult.error
      if (salesResult.error) throw salesResult.error

      const products = productsResult.data || []
      const sales = salesResult.data || []

      const productStatsMap = new Map<string, { salesCount: number; totalPoints: number }>()

      products.forEach((p) => productStatsMap.set(p.id, { salesCount: 0, totalPoints: 0 }))

      sales.forEach((s) => {
        if (s.product_id && productStatsMap.has(s.product_id)) {
          const current = productStatsMap.get(s.product_id)!
          current.salesCount += s.quantity || 1 // Assuming quantity is 1 if not specified
          current.totalPoints += s.points || 0
          productStatsMap.set(s.product_id, current)
        }
      })

      const productStatsData = products.map((product) => {
        const stats = productStatsMap.get(product.id) || { salesCount: 0, totalPoints: 0 }
        return {
          id: product.id,
          name: product.name,
          sales: stats.salesCount,
          points: product.points || 0, // Points per unit from product definition
          totalPoints: stats.totalPoints, // Total points accumulated from sales
        }
      })

      productStatsData.sort((a, b) => b.sales - a.sales)

      setProductStats(productStatsData)
    } catch (error: any) {
      console.error("Error al cargar estadísticas de productos:", error)
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
                {/* Pasar las top 2 zonas ordenadas por goles */}
                <AdminZonesChart zonesData={zoneStats.sort((a, b) => b.total_goals - a.total_goals).slice(0, 2)} />
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
